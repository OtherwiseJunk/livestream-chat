// establish connection
const socket = io.connect('/');

// query DOM
const message = document.getElementById('message');
const username = document.getElementById('username');
const btn = document.getElementById('send');
const output = document.getElementById('output');
const feedback = document.getElementById('feedback');
const chatContainer = document.getElementById('chat-window');
const streamKey = testString.slice(8).split('/')[1];

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

socket.on('typing', (data) => {
  feedback.innerHTML = `<p><em>${data} is typing a message...</em></p>`;
  
  setTimeout(() => feedback.innerHTML = '', 5 * 1000);
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
