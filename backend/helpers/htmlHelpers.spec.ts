import { setEmbed } from './htmlHelpers';
import { describe, afterEach, it, expect, vi } from 'vitest';
import { metascraper } from './htmlHelpers';
import { Metadata } from 'metascraper';

describe('setEmbed', () => {
    let messageData: { message: string, embed?: Metadata }
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should set the embed data if a URL is found in the message', async () => {
        messageData = { message: 'Check out this website: https://example.com' };
        const embedData: Metadata = { title: 'Example Domain', url: 'https://example.com', image: 'https://cdn.com/someCoolPng.png' };
        const mockMetadata = vi.fn().mockImplementation(metascraper).mockResolvedValue(embedData);

        await setEmbed(messageData, mockMetadata);

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
});
