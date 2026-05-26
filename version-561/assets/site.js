(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('image-missing');
    });
  });

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  if (slides.length > 1) {
    var current = 0;
    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    };
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showSlide(i);
      });
    });
    window.setInterval(function () {
      showSlide(current + 1);
    }, 5600);
  }

  var heroForm = document.querySelector('.hero-search');
  if (heroForm) {
    heroForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = heroForm.querySelector('input');
      var query = input ? input.value.trim() : '';
      var target = 'all-movies.html';
      if (query) {
        target += '?q=' + encodeURIComponent(query) + '#search';
      }
      window.location.href = target;
    });
  }

  var filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    var searchInput = filterBar.querySelector('[data-filter="search"]');
    var regionSelect = filterBar.querySelector('[data-filter="region"]');
    var yearSelect = filterBar.querySelector('[data-filter="year"]');
    var items = Array.prototype.slice.call(document.querySelectorAll('.filter-item'));
    var resultCount = document.querySelector('.result-count strong');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');
    if (initialQuery && searchInput) {
      searchInput.value = initialQuery;
    }
    var applyFilters = function () {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var region = regionSelect ? regionSelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var visible = 0;
      items.forEach(function (item) {
        var haystack = [
          item.getAttribute('data-title') || '',
          item.getAttribute('data-genre') || '',
          item.getAttribute('data-tags') || '',
          item.textContent || ''
        ].join(' ').toLowerCase();
        var itemRegion = item.getAttribute('data-region') || '';
        var itemYear = item.getAttribute('data-year') || '';
        var ok = true;
        if (keyword && haystack.indexOf(keyword) === -1) {
          ok = false;
        }
        if (region && itemRegion !== region) {
          ok = false;
        }
        if (year && itemYear.indexOf(year) === -1) {
          ok = false;
        }
        item.classList.toggle('hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (resultCount) {
        resultCount.textContent = String(visible);
      }
    };
    ['input', 'change'].forEach(function (eventName) {
      [searchInput, regionSelect, yearSelect].forEach(function (field) {
        if (field) {
          field.addEventListener(eventName, applyFilters);
        }
      });
    });
    applyFilters();
  }

  var hlsLoader = null;
  var loadHls = function () {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (!hlsLoader) {
      hlsLoader = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
        script.onload = function () {
          resolve(window.Hls);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return hlsLoader;
  };

  var setupPlayer = function (shell) {
    var video = shell.querySelector('video');
    var stream = shell.getAttribute('data-stream');
    if (!video || !stream) {
      return;
    }
    var play = function () {
      shell.classList.add('is-ready');
      if (video.dataset.loaded === 'yes') {
        video.play().catch(function () {});
        return;
      }
      var startVideo = function () {
        video.dataset.loaded = 'yes';
        video.play().catch(function () {});
      };
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        video.addEventListener('loadedmetadata', startVideo, { once: true });
        video.load();
        return;
      }
      loadHls().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, startVideo);
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          });
        } else {
          video.src = stream;
          startVideo();
        }
      }).catch(function () {
        video.src = stream;
        startVideo();
      });
    };
    shell.addEventListener('click', function (event) {
      if (event.target && event.target.tagName === 'VIDEO' && video.dataset.loaded === 'yes') {
        return;
      }
      play();
    });
    var button = shell.querySelector('.player-start');
    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        play();
      });
    }
  };

  document.querySelectorAll('.player-shell').forEach(setupPlayer);
})();
