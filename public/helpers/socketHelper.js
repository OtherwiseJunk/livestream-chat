export class SocketHelper {
  socket;
  streamKey;

  constructor(streamKey) {
    this.streamKey = streamKey;
    this.socket = io.connect("/", {
      query: {
        streamKey: streamKey,
      },
    });
  }

  sendMessage(message, username) {
    this.socket.emit("chat", {
      stream: this.streamKey,
      message: message,
      username: username,
      createdAt: new Date(),
      id: new Date().getTime(),
    });
  }

  emitTypingEvent(username) {
    this.socket.emit("typing", {
      username: username,
      stream: this.streamKey,
    });
  }
}
