const express = require("express");

const app = express();
const server = app.listen(3001, () =>
  console.log("Server listening on port 3001")
);

app.use(express.static("public"));

const messagesByStreamKey = {};
const userCountsByStreamKey = {};
const lobbyConfig = {
  CHAT_HOST: process.env.CHAT_HOST,
  LOBBY_TITLE: process.env.LOBBY_TITLE,
};
const chatConfig = {
  STREAM_HOST: process.env.STREAM_HOST,
  CHAT_TITLE: process.env.CHAT_TITLE,
  POSTER_IMAGES:
    process.env.POSTER_IMAGES ??
    "https://cacheblasters.nyc3.cdn.digitaloceanspaces.com/movienight.cacheblasters.com.webp",
};

app.get("/messages", (req, res) => {
  let messages = messagesByStreamKey[req.query.streamKey];
  console.log(`Sending messages to client... ${JSON.stringify(messages)}`);
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
app.use("*", (req, res) => res.sendFile(`${__dirname}/public/chat.html`));

module.exports.server = server;
module.exports.messagesByStreamKey = messagesByStreamKey;
module.exports.userCountsByStreamKey = userCountsByStreamKey;

require("./websocket");
