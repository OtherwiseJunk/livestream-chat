import { toHTML } from "discord-markdown";
import { textEmoji } from "markdown-to-text-emoji";
import { ChatData } from "./types/socketTypes.js";
import { Server } from "socket.io";
import { Metadata, Metascraper } from "metascraper";
import { Got } from "got";
import { lobbyConfig, chatConfig } from "./config/configurationConstants.js";

export class ChatService {
  constructor(
    private io : Server, 
    private userCountsByStreamKey:Map<string, number>,
    private messagesByStreamKey:Map<string, ChatData[]>,
    private metascraper: Metascraper,
    private got: Got){}

    urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;

    incrementUserCount(streamKey: string) {
      let currentCount: number = this.userCountsByStreamKey.get(streamKey) ?? 0;
      currentCount++;
      this.userCountsByStreamKey.set(streamKey, currentCount);
    } 
    decrementUserCount(streamKey: string) {
      let currentCount: number = this.userCountsByStreamKey.get(streamKey) ?? 0;
      if (!currentCount) {
        return;
      }
    
      currentCount--;
    
      this.userCountsByStreamKey.set(streamKey, 0);
    }

    async handleChatMessage(streamKey: string, message: ChatData) {
      message.embed = await this.buildEmbed(message);
      message.html = toHTML(textEmoji(message.message));

      if (!this.messagesByStreamKey.get(streamKey)) {
        this.messagesByStreamKey.set(streamKey, []);
      }
      const newIndex = this.messagesByStreamKey.get(streamKey)!.push(message) - 1;
      setTimeout(() => this.messagesByStreamKey.get(streamKey)!.splice(newIndex, 1), 5 * 60 * 1000);

      this.io.to(streamKey).emit("chat", message);
    }

    async buildEmbed(messageData: { message: string, embed?: Metadata }): Promise<Metadata | undefined> {
      const urlMatches = messageData.message.match(this.urlRegex);
  
      if (urlMatches) {
          try {
              const url = urlMatches[0];
              const { body: html } = await this.got(url);
              return await this.metascraper({ html, url });
          } catch (error) {
              console.error(error);
          }
      }

      return;
  }

    emitUserLeft(streamKey: string) {
      this.io.to(streamKey).emit("userLeft", this.userCountsByStreamKey.get(streamKey));
    }

    emitUserTyping(streamKey: string, username: string) {
      this.io.to(streamKey).emit("typing", username);
    }

    emitUserJoined(streamKey: string) {
      this.io.to(streamKey).emit("userJoined", this.userCountsByStreamKey.get(streamKey));
    }

    getMessages(streamKey: string) {
      return this.messagesByStreamKey.get(streamKey);
    }

    getConfiguration(configurationType: string) {
      switch(configurationType){
        case "lobby":
          return lobbyConfig;
        case "chat":
          return chatConfig;
      }
    }
}
