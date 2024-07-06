import { userCountsByStreamKey, messagesByStreamKey, io } from "./server";
const got = require("got");
const { toHTML } = require("discord-markdown");
const { textEmoji } = require("markdown-to-text-emoji");
const metascraper = require("metascraper")([
    require("metascraper-description")(),
    require("metascraper-image")(),
    require("metascraper-title")(),
    require("metascraper-url")(),
]);
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
            messagesByStreamKey.set(streamKey, new Array());
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
async function setEmbed(data) {
    const containsURL = /([https://].*)/.test(data.message);
    if (containsURL) {
        try {
            const targetUrl = /([https://].*)/.exec(data.message)[0];
            const { body: html, url } = await got(targetUrl);
            data.embed = await metascraper({ html, url });
        }
        catch { }
    }
}
