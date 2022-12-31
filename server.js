const express = require('express');

const app = express();
const server = app.listen(3001,
  () => console.log('Server listening on port 3001'));
  
app.use(express.static('public'));
  
const messages = {};

app.get('/messages', (req, res) => res.json(messages[req.query.streamKey]));
app.use('*', (req, res) => res.sendFile(`${__dirname}/public/chat.html`))

module.exports.server = server;
module.exports.messages = messages;

require('./websocket');