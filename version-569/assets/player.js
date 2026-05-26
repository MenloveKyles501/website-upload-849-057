function initMoviePlayer(streamUrl) {
  var box = document.querySelector('[data-player-box]');
  var video = document.querySelector('[data-player-video]');
  var cover = document.querySelector('[data-player-cover]');
  var playButton = document.querySelector('[data-player-toggle]');
  var muteButton = document.querySelector('[data-player-mute]');
  var fullButton = document.querySelector('[data-player-full]');
  var message = document.querySelector('[data-player-message]');
  var loaded = false;
  var hls = null;

  if (!box || !video || !streamUrl) {
    return;
  }

  function showMessage(text) {
    if (message) {
      message.textContent = text;
      message.classList.add('is-visible');
    }
  }

  function bindStream() {
    if (loaded) {
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }

        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        showMessage('视频暂时无法加载，请稍后重试。');
      });
      return;
    }

    showMessage('视频暂时无法加载，请稍后重试。');
  }

  function setPlayingState() {
    box.classList.toggle('is-active', !video.paused);

    if (playButton) {
      playButton.innerHTML = video.paused ? '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"></path></svg>' : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"></path></svg>';
    }
  }

  function start() {
    bindStream();

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var playRequest = video.play();

    if (playRequest && typeof playRequest.catch === 'function') {
      playRequest.catch(function () {
        showMessage('点击播放按钮即可继续观看。');
      });
    }
  }

  function togglePlay() {
    bindStream();

    if (video.paused) {
      start();
    } else {
      video.pause();
    }
  }

  if (cover) {
    cover.addEventListener('click', start);
  }

  video.addEventListener('click', togglePlay);
  video.addEventListener('play', setPlayingState);
  video.addEventListener('pause', setPlayingState);
  video.addEventListener('ended', setPlayingState);
  video.addEventListener('error', function () {
    showMessage('视频暂时无法加载，请稍后重试。');
  });

  if (playButton) {
    playButton.addEventListener('click', togglePlay);
  }

  if (muteButton) {
    muteButton.addEventListener('click', function () {
      video.muted = !video.muted;
      muteButton.innerHTML = video.muted ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor"></path><path d="M16 9l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>' : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor"></path><path d="M16 8a5 5 0 010 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path></svg>';
    });
  }

  if (fullButton) {
    fullButton.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (box.requestFullscreen) {
        box.requestFullscreen();
      }
    });
  }

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
