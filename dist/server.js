import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { lobbyConfig, chatConfig } from "./config/configurationConstants.js";
const port = 3001;
const app = express();
const server = createServer(app);
export const io = new Server(server);
export const messagesByStreamKey = new Map();
export const userCountsByStreamKey = new Map();
server.listen(port, (() => {
    console.log(`Listening on port ${port}`);
}));
app.use(express.static("public"));
app.get("/messages", (req, res) => {
    const messages = messagesByStreamKey.get(req.query.streamKey);
    res.json(messages);
});
app.get("/config", (req, res) => {
    switch (req.query.page) {
        case "lobby":
            res.json(lobbyConfig);
            break;
        case "chat":
            res.json(chatConfig);
            break;
    }
});
app.use("*", (_, res) => res.sendFile(`${__dirname}/public/chat.html`));
