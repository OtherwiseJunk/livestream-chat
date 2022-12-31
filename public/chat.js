// establish connection
const socket = io.connect('/');



// query DOM
const message = document.getElementById('message');
const username = document.getElementById('username');
const btn = document.getElementById('send');
const output = document.getElementById('output');
const feedback = document.getElementById('feedback');
const chatContainer = document.getElementById('chat-window');
const playerContainer = document.getElementById('player-container');

const streamKey = window.location.href.slice(8).split('/')[1];
const wasRecentlyTypingByUsername = {};

fetch('/config?page=chat')
.then(async(data) =>{
    const config = await data.json();
    appendVideoSourceToPlayerDiv(config.STREAM_HOST, streamKey);
    var player = videojs('#player', {autoplay: true});
    document.title = config.CHAT_TITLE != undefined ? config.CHAT_TITLE : 'Movie Lobby';
});

function appendVideoSourceToPlayerDiv(host, streamKey){
  playerContainer.innerHTML = `
  <video id="player" class="video-js vjs-default-skin" controls preload="auto">
    <source src="${host}/hls/${streamKey}.m3u8" type="application/x-mpegURL" />
  </video>
  `
}

function sendMessage() {
  socket.emit('chat', {
    stream: streamKey,
    message: message.value,
    username: username.value,
    createdAt: new Date(),
    id: new Date().getTime()
  });
  message.value = '';
}

function clearIsTyping(isTypingElement, username){
  if(!wasRecentlyTypingByUsername[username]){
    feedback.innerHTML = feedback.innerHTML.replace(isTypingElement,'')
  }
  else{
    setTimeout(() => {      
      clearIsTyping(isTypingElement, username)
      wasRecentlyTypingByUsername[username] = false;
    }, 5 * 1000);
  }
}

// emit events
btn.addEventListener('click', () => {
  sendMessage();
});

message.addEventListener('keypress', (e) => {
  if(e.key == 'Enter') {
    sendMessage();
  } else {
    socket.emit('typing', username.value);
  }
});

// listen for events
socket.on('chat', (data) => { 
  appendMessage(data);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('typing', (username) => {
  const isTypingElement = `<p><em>${username} is typing a message...</em></p>`;

  if(feedback.innerHTML.indexOf(isTypingElement) == -1) {
    // Initializes the value if the dictionary value doesn't currently exist.
    // Otherwise, we want this false, we only consider them typing recently on subsequent typing emits occur.
    wasRecentlyTypingByUsername[username] = false;
    feedback.innerHTML += isTypingElement;
    
    setTimeout(() => {
      clearIsTyping(isTypingElement, username);
    }, 5 * 1000);
  }
  else{
    wasRecentlyTypingByUsername[username] = true;
  }
});

// load message history
fetch(`/messages?streamKey=${streamKey}`)
.then(async(data) => {
  const messages = await data.json();
  for (const message of messages)
    appendMessage(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}) 

function appendMessage(data) {
  output.innerHTML += extremelyLongMessagePreview(data);
}
