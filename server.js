const express = require('express');

const app = express();
const server = app.listen(3001,
  () => console.log('Server listening on port 3001'));
  
app.use(express.static('public'));
  
const messages = {};
const lobbyConfig = {
  CHAT_HOST: process.env.CHAT_HOST,
  LOBBY_TITLE: process.env.LOBBY_TITLE
};
const chatConfig = {
  STREAM_HOST: process.env.STREAM_HOST,
  CHAT_TITLE: process.env.CHAT_TITLE
};

app.get('/messages', (req, res) => res.json(messages[req.query.streamKey]));
app.get('/config', (req, res) =>{
  switch(req.query.page){
    case 'lobby':
      res.json(lobbyConfig)
      break;
    case 'chat':
      res.json(chatConfig)
      break;
  }
})
app.use('*', (req, res) => res.sendFile(`${__dirname}/public/chat.html`))

module.exports.server = server;
module.exports.messages = messages;

require('./websocket');