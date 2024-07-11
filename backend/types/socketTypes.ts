import { Metadata } from "metascraper";

export interface ChatData {
    message: string;
    html?: string;
    embed?: Metadata;
    username: string;
    createdAt: Date;
    id: string;
}

export interface TypingData {
    username: string;
}

export interface ServerToClientEvents {
    chat: (data: ChatData) => void;
    typing: (data: TypingData) => void;
    userJoined: (count: number) => void;
    userLeft: (count: number) => void;
}

export interface ClientToServerEvents {
    chat: (data: ChatData) => void;
    typing: (data: TypingData) => void;
    userJoined: (count: number) => void;
    userLeft: (count: number) => void
}

export interface InterServerEvents {
}

export interface SocketData {
    stream: string;
    message: string;
    html: string;
}
