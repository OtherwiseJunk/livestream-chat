import { ChatHelper } from "./helpers/chatHelper.js";
import { SocketHelper } from "./helpers/socketHelper.js";
import { VideoHelper } from "./helpers/videoHelper.js";

const streamKey = window.location.href.slice(8).split("/")[1];
const socketHelper = new SocketHelper(streamKey);
let posterImages;

// query DOM
const message = document.getElementById("message");
const username = document.getElementById("username");
const btn = document.getElementById("send");
const output = document.getElementById("messages-container");
const isTypingContainer = document.getElementById("is-typing-container");
const chatContainer = document.getElementById("chat-window");
const playerContainer = document.getElementById("player-container");
const viewCountDisplay = document.getElementById("viewer-count-display");

// load Config from server
await fetch("/config?page=chat").then(async (data) => {
  const config = await data.json();
  posterImages = config.POSTER_IMAGES.split(";");
  appendVideoSourceToPlayerContainer(config.STREAM_HOST, streamKey);
  videojs("#player", { autoplay: true });
  document.title = config.CHAT_TITLE ?? "Movie Lobby";
});

// load message history
fetch(`/messages?streamKey=${streamKey}`).then(async (data) => {
  console.log(data);
  const messages = await data.json();
  console.log(`Got messages maybe? ${JSON.stringify(messages)}`);
  for (const message of messages) appendMessage(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

function appendVideoSourceToPlayerContainer(host, streamKey) {
  VideoHelper.appendVideoSourceToPlayerContainer(
    host,
    streamKey,
    playerContainer,
    posterImages
  );
}

function sendMessage() {
  if (message.value && username.value) {
    socketHelper.sendMessage(message.value, username.value);
    message.value = "";
  }
}

function emitTypingEvent() {
  if (username.value) {
    socketHelper.emitTypingEvent(username.value);
  }
}

function appendMessage(messageData) {
  ChatHelper.appendMessage(messageData, output);
}

function updateViewerCount(userCount) {
  ChatHelper.updateViewerCount(userCount, viewCountDisplay);
}

function userCountChangeEvent(userCount, eventType) {
  console.log(
    `Received count value of ${userCount}, previous was ${userCount}`
  );
  updateViewerCount(userCount);
  console.log(`User ${eventType}! current user count: ${userCount}`);
}

function handleTypingEvent(typingEvent) {
  if(typingEvent.username === username.value){
    return;
  }
  const isTypingElement = `<p>${typingEvent.username} <em>is typing a message...</em></p>`;
  ChatHelper.updateIsTyping(
    isTypingElement,
    isTypingContainer,
    typingEvent,
    username
  );
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// emit events
btn.addEventListener("click", () => {
  sendMessage();
});

message.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    sendMessage();
  } else {
    emitTypingEvent();
  }
});

// listen for events
socketHelper.socket.on("chat", (data) => {
  appendMessage(data);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socketHelper.socket.on("typing", (typingEvent) => {
  handleTypingEvent(typingEvent);
});
socketHelper.socket.on("userJoined", (count) => {
  userCountChangeEvent(count, "Joined");
});

socketHelper.socket.on("userLeft", (count) => {
  userCountChangeEvent(count, "Left");
});
