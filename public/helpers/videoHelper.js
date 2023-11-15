export class VideoHelper {
  static appendVideoSourceToPlayerContainer(
    host,
    streamKey,
    playerContainer,
    posterImages
  ) {
    let posterImage;
    let posterCount = posterImages.length;
    if (posterImages != null && posterCount > 0) {
      posterImage = posterImages[Math.floor(Math.random() * posterCount)];
    }

    playerContainer.innerHTML = `
        <video liveui=true poster="${posterImage}"  id="player" class="video-js vjs-default-skin vjs-big-play-centered" controls preload="auto">
          <source src="${host}/hls/${streamKey}.m3u8" type="application/x-mpegURL" />
        </video>
        `;
  }
}
