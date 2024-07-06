import { decrementUserCount, incrementUserCount } from './websocket.ts';
import { describe, it, expect } from 'vitest';

describe('incrementUserCount', () => {
    it('should increment the user count if the stream key is not in the map', () => {
        const userCountsByStreamKey: Map<string, number> = new Map();
        const testKey = 'testStreamKey';

        incrementUserCount(testKey, userCountsByStreamKey);

        expect(userCountsByStreamKey.get(testKey)).toBe(1);
    });
    it('should increment the user count if the stream key is in the map', () => {
        const testKey = 'testStreamKey';
        const userCountsByStreamKey: Map<string, number> = new Map([[testKey, 1]]);

        incrementUserCount(testKey, userCountsByStreamKey);

        expect(userCountsByStreamKey.get(testKey)).toBe(2);
    })
});

describe('decrementUserCount', () => {
    it('should not decrement the user count if the stream key is not in the map', () => {
        const userCountsByStreamKey: Map<string, number> = new Map();
        const testKey = 'testStreamKey';

        decrementUserCount(testKey, userCountsByStreamKey);

        expect(userCountsByStreamKey.get(testKey)).toBe(undefined);
    });
    it('should decrement the user count if the stream key is in the map', () => {
        const testKey = 'testStreamKey';
        const userCountsByStreamKey: Map<string, number> = new Map([[testKey, 1]]);

        decrementUserCount(testKey, userCountsByStreamKey);

        expect(userCountsByStreamKey.get(testKey)).toBe(0);
    })
    it('should not decrement the user count to a negative number if the stream key is in the map', () => {
        const testKey = 'testStreamKey';
        const userCountsByStreamKey: Map<string, number> = new Map([[testKey, 0]]);

        decrementUserCount(testKey, userCountsByStreamKey);

        expect(userCountsByStreamKey.get(testKey)).toBe(0);
    })
});
