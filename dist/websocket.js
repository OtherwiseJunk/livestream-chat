import { userCountsByStreamKey, messagesByStreamKey, io } from "./server.js";
import { toHTML } from "discord-markdown";
import { textEmoji } from "markdown-to-text-emoji";
import got from "got";
import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
const metascraper = createMetascraper([metascraperDescription(), metascraperImage(), metascraperTitle(), metascraperUrl()]);
io.on("connection", (clientSocket) => {
    if (!clientSocket.handshake.query.streamKey) {
        clientSocket.disconnect();
        return;
    }
    const streamKey = clientSocket.handshake.query.streamKey[0];
    clientSocket.join(streamKey);
    incrementUserCount(streamKey);
    console.log("Made socket connection", clientSocket.id);
    io.to(streamKey).emit("userJoined", userCountsByStreamKey.get(streamKey));
    clientSocket.on("chat", async (data) => {
        await setEmbed(data);
        data.html = toHTML(textEmoji(data.message));
        if (!messagesByStreamKey.get(streamKey)) {
            messagesByStreamKey.set(streamKey, []);
        }
        const newIndex = messagesByStreamKey.get(streamKey).push(data) - 1;
        setTimeout(() => messagesByStreamKey.get(streamKey).splice(newIndex, 1), 5 * 60 * 1000);
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
function incrementUserCount(streamKey) {
    if (userCountsByStreamKey.get(streamKey) == null) {
        userCountsByStreamKey.set(streamKey, 1);
    }
    else {
        userCountsByStreamKey.get(streamKey);
    }
}
function decrementUserCount(streamKey) {
    let currentCount = userCountsByStreamKey.get(streamKey) ?? 0;
    if (!currentCount) {
        return;
    }
    currentCount--;
    if (currentCount < 0)
        userCountsByStreamKey.set(streamKey, 0);
}
async function setEmbed(messageData) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
    const urlMatches = messageData.message.match(urlRegex);
    if (urlMatches) {
        try {
            const url = urlMatches[0];
            const { body: html } = await got(url);
            messageData.embed = await metascraper({ html, url });
        }
        catch (error) {
            console.error(error);
        }
    }
}
