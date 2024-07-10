import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ChatService } from './chatService';
import { Server } from "socket.io";
import { Metadata } from "metascraper";
import got from "got";
import { ChatData } from "./types/socketTypes";
import { lobbyConfig, chatConfig } from "./config/configurationConstants";
import * as discordMarkdown from "discord-markdown";
import * as markdownToTextEmoji from "markdown-to-text-emoji";

const existingStreamKey = 'existingStreamKey';
const zeroUserStreamKey = 'zeroUserStreamKey';
const messageDuration = 100;

function buildInitialUserCountMap() {
    return new Map([[existingStreamKey, 1], [zeroUserStreamKey, 0]]);
}

function buildInitialMessageMap() {
    return new Map([[existingStreamKey, [{ message: 'test message' }]]]);
}

describe('ChatService', () => {
    let sut: ChatService;
    let io: Server;
    let metascraperMock = vi.fn();

    beforeAll(() => {
        io = new Server();
        sut = new ChatService(
            io,
            buildInitialUserCountMap(),
            buildInitialMessageMap(),
            metascraperMock,
            got,
            messageDuration);
    });

    describe('setEmbed', () => {
        let messageData: ChatData;

        it('should set the embed data if a URL is found in the message', async () => {
            messageData = { message: 'Check out this website: https://example.com' };
            const expectedEmbed: Metadata = { title: 'Example Domain', url: 'https://example.com', image: 'https://cdn.com/someCoolPng.png' };
            metascraperMock.mockResolvedValue(expectedEmbed);

            let embed = await sut.buildEmbed(messageData);

            expect(embed).toEqual(expectedEmbed);
            expect(metascraperMock).toHaveBeenCalledOnce();
        });

        it('should not set the embed data if no URL is found in the message', async () => {
            messageData = { message: 'This is a message without a URL' };

            let embed = await sut.buildEmbed(messageData);

            expect(embed).toBeUndefined();
        });

        it('should handle errors when fetching the URL', async () => {
            messageData = { message: 'Check out this website: https://example.com' };
            metascraperMock.mockRejectedValue(new Error('Network error'));

            let embed = await sut.buildEmbed(messageData);

            expect(embed).toBeUndefined();
            expect(metascraperMock).toHaveBeenCalled();
        });
    })

    describe('incrementUserCount', () => {
        it('should increment the user count if the stream key is not in the map', () => {
            const testKey = 'nonExistentStreamKeyIncrement';

            sut.incrementUserCount(testKey);
            const afterCount = sut.userCountsByStreamKey.get(testKey);

            expect(afterCount).toBe(1);
        });
        it('should increment the user count if the stream key is in the map', () => {
            sut.incrementUserCount(existingStreamKey);
            const afterCount = sut.userCountsByStreamKey.get(existingStreamKey);

            expect(afterCount).toBe(2);
        })
    });

    describe('decrementUserCount', () => {
        it('should not decrement the user count if the stream key is not in the map', () => {
            const testKey = 'nonExistentStreamKeyDecrement';

            sut.decrementUserCount(testKey);
            const afterCount = sut.userCountsByStreamKey.get(testKey);

            expect(afterCount).toBe(undefined);
        });
        it('should decrement the user count if the stream key is in the map', () => {
            sut.decrementUserCount(existingStreamKey);
            const afterCount = sut.userCountsByStreamKey.get(existingStreamKey);

            expect(afterCount).toBe(0);
        })
        it('should not decrement the user count to a negative number if the stream key is in the map', () => {
            sut.decrementUserCount(zeroUserStreamKey);
            const afterCount = sut.userCountsByStreamKey.get(zeroUserStreamKey);

            expect(afterCount).toBe(0);
        })
    });

    describe('getConfiguration', () => {
        it('should return lobbyConfig for "lobby"', () => {
            const result = sut.getConfiguration('lobby');
            expect(result).toEqual(lobbyConfig);
        });

        it('should return chatConfig for "chat"', () => {
            const result = sut.getConfiguration('chat');
            expect(result).toEqual(chatConfig);
        });

        it('should return undefined for unknown configuration types', () => {
            const result = sut.getConfiguration('unknown');
            expect(result).toBeUndefined();
        });
    });

    describe('handleChatMessage', () => {
        it('should build and emit a chat message', async () => {
            const streamKey = 'testStreamKey';
            const messageData = { message: '**test** _message_' };
            const toSpy = vi.spyOn(io, 'to');
            const buildEmbedSpy = vi.spyOn(sut, 'buildEmbed').mockResolvedValueOnce(undefined);
            const textEmojiSpy = vi.spyOn(markdownToTextEmoji, 'textEmoji').mockReturnValue(messageData.message);

            await sut.handleChatMessage(streamKey, messageData);
            const messagesAfter = sut.messagesByStreamKey.get(streamKey)!;

            expect(buildEmbedSpy).toHaveBeenCalledWith(messageData);
            expect(toSpy).toHaveBeenCalledWith(streamKey);
            expect(textEmojiSpy).toHaveBeenCalledWith(messageData.message);
            expect(messagesAfter.length).toBe(1);
            expect(messagesAfter[0]).toEqual({ ...messageData, html: '<strong>test</strong> <em>message</em>', embed: undefined });
        });

        it('should build and emit a chat message with an embed', async () => {
            const streamKey = 'testStreamKey';
            const messageData = { message: '**test** _message_' };
            const toSpy = vi.spyOn(io, 'to');
            const buildEmbedSpy = vi.spyOn(sut, 'buildEmbed').mockResolvedValueOnce({ description: 'test description' });
            const textEmojiSpy = vi.spyOn(markdownToTextEmoji, 'textEmoji').mockReturnValue(messageData.message);

            await sut.handleChatMessage(streamKey, messageData);
            const messagesAfter = sut.messagesByStreamKey.get(streamKey)!;

            expect(buildEmbedSpy).toHaveBeenCalledWith(messageData);
            expect(toSpy).toHaveBeenCalledWith(streamKey);
            expect(textEmojiSpy).toHaveBeenCalledWith(messageData.message);
            expect(sut.messagesByStreamKey.get(streamKey)!.length).toBe(1);
            expect(messagesAfter.length).toBe(1);
            expect(messagesAfter[0]).toEqual({ ...messageData, html: '<strong>test</strong> <em>message</em>', embed: { description: 'test description' } });
        });

        it('should remove the chat message after configured messageDuration', async () => {
            const streamKey = 'testStreamKey';
            const messageData = { message: 'test message' };
            const removeSpy = vi.spyOn(Array.prototype, 'splice');

            await sut.handleChatMessage(streamKey, messageData);

            // sleep for 5 minutes
            await new Promise(resolve => setTimeout(resolve, messageDuration));
            expect(removeSpy).toHaveBeenCalledWith(0, 1)
            expect(sut.messagesByStreamKey.get(streamKey)!.length).toBe(0);
        });

        afterEach(() => {
            io.removeAllListeners();
            sut.userCountsByStreamKey = buildInitialUserCountMap();
            sut.messagesByStreamKey = buildInitialMessageMap();
        });
    });
});
