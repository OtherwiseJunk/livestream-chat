export const lobbyConfig = {
    CHAT_HOST: process.env.CHAT_HOST,
    LOBBY_TITLE: process.env.LOBBY_TITLE,
};

export const chatConfig = {
    STREAM_HOST: process.env.STREAM_HOST,
    CHAT_TITLE: process.env.CHAT_TITLE,
    POSTER_IMAGES:
        process.env.POSTER_IMAGES ??
        "https://cacheblasters.nyc3.cdn.digitaloceanspaces.com/movienight.cacheblasters.com.webp",
};
