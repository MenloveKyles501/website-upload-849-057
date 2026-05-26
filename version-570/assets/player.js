(function () {
  function initPlayer(box) {
    var video = box.querySelector('video');
    var button = box.querySelector('[data-player-button]');
    var message = box.querySelector('[data-player-message]');
    var hls = null;
    var loaded = false;

    if (!video || !button) {
      return;
    }

    function showMessage(text) {
      if (!message) {
        return;
      }

      message.textContent = text;
      message.classList.add('is-visible');
    }

    function loadStream() {
      if (loaded) {
        return;
      }

      var stream = video.getAttribute('data-stream');

      if (!stream) {
        showMessage('视频未找到');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(stream);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) {
            return;
          }

          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            showMessage('网络错误，请检查连接');
            hls.startLoad();
            return;
          }

          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            showMessage('媒体错误，正在尝试恢复');
            hls.recoverMediaError();
            return;
          }

          showMessage('无法播放视频');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        video.src = stream;
      }

      loaded = true;
    }

    function playVideo() {
      loadStream();
      button.classList.add('is-hidden');

      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          button.classList.remove('is-hidden');
        });
      }
    }

    button.addEventListener('click', playVideo);

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        button.classList.remove('is-hidden');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.querySelectorAll('[data-player]').forEach(initPlayer);
})();
