import { userCountsByStreamKey, messagesByStreamKey, io } from "./server.js";
import { Socket } from "socket.io";
import { toHTML } from "discord-markdown";
import { textEmoji } from "markdown-to-text-emoji";
import { ChatData } from "./types/socketTypes.js";
import { setEmbed } from "./helpers/htmlHelpers.js";

io.on("connection", (clientSocket: Socket) => {
  if (!clientSocket.handshake.query.streamKey) {
    clientSocket.disconnect();
    return;
  }
  const streamKey: string = clientSocket.handshake.query.streamKey[0];

  clientSocket.join(streamKey);
  incrementUserCount(streamKey);

  console.log("Made socket connection", clientSocket.id);
  io.to(streamKey).emit("userJoined", userCountsByStreamKey.get(streamKey));

  clientSocket.on("chat", async (data: ChatData) => {
    await setEmbed(data);

    data.html = toHTML(textEmoji(data.message));

    if (!messagesByStreamKey.get(streamKey)) {
      messagesByStreamKey.set(streamKey, []);
    }
    const newIndex = messagesByStreamKey.get(streamKey)!.push(data) - 1;
    setTimeout(() => messagesByStreamKey.get(streamKey)!.splice(newIndex, 1), 5 * 60 * 1000);

    io.sockets.emit("chat", data);
  });

  clientSocket.on("typing", (data) => {
    clientSocket.broadcast.emit("typing", data);
  });

  clientSocket.on("disconnect", () => {
    decrementUserCount(streamKey);
    clientSocket.to(streamKey).emit("userLeft", userCountsByStreamKey.get(streamKey));
  });
});

export function incrementUserCount(streamKey: string, userCountsMap: Map<string, number> = userCountsByStreamKey) {
  let currentCount: number = userCountsMap.get(streamKey) ?? 0;
  currentCount++;
  userCountsMap.set(streamKey, currentCount);
}

export function decrementUserCount(streamKey: string, userCountsMap: Map<string, number> = userCountsByStreamKey) {
  let currentCount: number = userCountsMap.get(streamKey) ?? 0;
  if (!currentCount) {
    return;
  }

  currentCount--;

  userCountsMap.set(streamKey, 0);
}
