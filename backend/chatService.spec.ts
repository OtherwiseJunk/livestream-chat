import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ChatService } from './chatService';
import { Server } from "socket.io";
import { Metadata, Metascraper } from "metascraper";
import got from "got";
import { ChatData } from "./types/socketTypes";

const ioMock = vi.mock('socket.io', () =>{
    
});
const metascraperMock = vi.mock('metascraper');
const gotMock = vi.mock('got');

describe('ChatService', () =>{
    let sut: ChatService;    

    beforeAll(() =>{

    });

    describe('setEmbed', () =>{
        let messageData: ChatData;
        
        it('should set the embed data if a URL is found in the message', async () => {
            messageData = { message: 'Check out this website: https://example.com' };
            const embedData: Metadata = { title: 'Example Domain', url: 'https://example.com', image: 'https://cdn.com/someCoolPng.png' };
            const mockMetadata = ioMock.fn().mockImplementation(metascraper).mockResolvedValue(embedData);
    
            let embedData = await sut.buildEmbed(messageData);
    
            expect(messageData.embed).toEqual(embedData);
            expect(mockMetadata).toHaveBeenCalledOnce();
        });
    
        it('should not set the embed data if no URL is found in the message', async () => {
            messageData = { message: 'This is a message without a URL' };
    
            await setEmbed(messageData);
    
            expect(messageData.embed).toBeUndefined();
        });
    
        it('should handle errors when fetching the URL', async () => {
            messageData = { message: 'Check out this website: https://example.com' };
            const mockMetadata = vi.fn().mockImplementation(metascraper).mockRejectedValue(new Error('Network error'));
    
            await setEmbed(messageData, mockMetadata);
    
            expect(messageData.embed).toBeUndefined();
            expect(mockMetadata).toHaveBeenCalledOnce();
        });
    })

    afterEach(() =>{
        vi.restoreAllMocks();
    })
})