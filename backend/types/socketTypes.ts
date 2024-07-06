export interface ChatData {
    message: string;
    html?: string;
}

export interface ServerToClientEvents {
    chat: (data: ChatData) => void;
    typing: (data: string) => void;
    userJoined: (count: number) => void;
    userLeft: (count: number) => void;
}

export interface ClientToServerEvents {
    chat: (data: ChatData) => void;
    typing: (data: string) => void;
}

export interface InterServerEvents {
}

export interface SocketData {
    stream: string;
    message: string;
    html: string;
}
