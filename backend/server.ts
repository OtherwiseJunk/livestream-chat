import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { lobbyConfig, chatConfig } from "./config/configurationConstants.js";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ChatData } from "./types/socketTypes.js";
import("./websocket.js");

const port = 3001;
const app = express();
const server = createServer(app);

export const io: Server = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server);
export const messagesByStreamKey: Map<string, ChatData[]> = new Map();
export const userCountsByStreamKey: Map<string, number> = new Map();

server.listen(port, (() => {
  console.log(`Listening on port ${port}`);
}));

app.use(express.static("public"));

app.get("/messages", (req: Request, res: Response) => {
  const messages = messagesByStreamKey.get(req.query.streamKey as string);
  res.json(messages);
});
app.get("/config", (req: Request, res: Response) => {
  switch (req.query.page) {
    case "lobby":
      res.json(lobbyConfig);
      break;
    case "chat":
      res.json(chatConfig);
      break;
  }
});
app.use("*", (_: Request, res: Response) => res.sendFile(`${__dirname}/public/chat.html`));
