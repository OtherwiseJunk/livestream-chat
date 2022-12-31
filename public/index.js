const streamKey = document.getElementById('streamKey');
let host;

fetch('/config?page=lobby')
.then(async(data) =>{
    const config = await data.json();
    console.log(config);
    host = config.CHAT_HOST;
    document.title = config.LOBBY_TITLE ?? 'Movie Lobby';
});

function navigateToStreamChat() {
    window.location.href = `${host}/${streamKey.value}`;
}

streamKey.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        navigateToStreamChat();
    }
});

document.getElementById('send').addEventListener('click', () => {
    navigateToStreamChat();
});
