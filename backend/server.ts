import express, { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ChatData } from "./types/socketTypes.js";
import { ChatService } from "./chatService.js";
import createMetascraper, { Metascraper } from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import got from 'got';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);

if (process.env.DEVMODE) {
  __dirname = __dirname.replace('/backend', '/');
}

const port = 3001;
const app = express();
const server = createServer(app);
const messageDuration = 5 * 60 * 1000;

const io: Server = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server);
const messagesByStreamKey: Map<string, ChatData[]> = new Map();
const userCountsByStreamKey: Map<string, number> = new Map();
const metascraper: Metascraper = createMetascraper([metascraperDescription(), metascraperImage(), metascraperTitle(), metascraperUrl()]);
const chatService: ChatService = new ChatService(io, userCountsByStreamKey, messagesByStreamKey, metascraper, got, messageDuration);

server.listen(port, (() => {
  console.log(`Listening on port ${port}`);
}));

app.use(express.static("public"));

app.get("/messages", (req: Request, res: Response) => {
  res.json(chatService.getMessages(req.query.streamKey as string));
});
app.get("/config", (req: Request, res: Response) => {
  res.json(chatService.getConfiguration(req.query.page as string));
});
app.use("*", (_: Request, res: Response) => res.sendFile(`${__dirname}/public/chat.html`));

io.on("connection", (clientSocket: Socket) => {
  if (!clientSocket.handshake.query.streamKey) {
    clientSocket.disconnect();
    return;
  }
  const streamKey: string = clientSocket.handshake.query.streamKey as string;

  clientSocket.join(streamKey);
  chatService.incrementUserCount(streamKey);

  console.log("Made socket connection", clientSocket.id);
  chatService.emitUserJoined(streamKey);

  clientSocket.on("chat", async (data: ChatData) => {
    await chatService.handleChatMessage(streamKey, data);
  });

  clientSocket.on("typing", (data) => {
    console.log('Received Is Typing request');
    console.log(data);
    chatService.emitUserTyping(streamKey, data);
  });

  clientSocket.on("disconnect", () => {
    chatService.decrementUserCount(streamKey);
    chatService.emitUserLeft(streamKey);
  });
});
