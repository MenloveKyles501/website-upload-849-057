(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  ready(function () {
    var navButton = document.querySelector("[data-nav-toggle]");
    var navMenu = document.querySelector("[data-nav-menu]");

    if (navButton && navMenu) {
      navButton.addEventListener("click", function () {
        navMenu.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("[data-hero]").forEach(function (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var index = 0;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
        });
      });

      if (slides.length > 1) {
        setInterval(function () {
          show(index + 1);
        }, 5200);
      }
    });

    document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
      var input = scope.querySelector("[data-search-input]");
      var region = scope.querySelector("[data-filter-region]");
      var year = scope.querySelector("[data-filter-year]");
      var genre = scope.querySelector("[data-filter-genre]");
      var empty = scope.querySelector("[data-filter-empty]");

      function applyFilters() {
        var keyword = normalize(input ? input.value : "");
        var regionValue = normalize(region ? region.value : "");
        var yearValue = normalize(year ? year.value : "");
        var genreValue = normalize(genre ? genre.value : "");
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search"));
          var cardRegion = normalize(card.getAttribute("data-region"));
          var cardYear = normalize(card.getAttribute("data-year"));
          var cardGenre = normalize(card.getAttribute("data-genre"));
          var match = true;

          if (keyword && haystack.indexOf(keyword) === -1) {
            match = false;
          }
          if (regionValue && cardRegion !== regionValue) {
            match = false;
          }
          if (yearValue && cardYear !== yearValue) {
            match = false;
          }
          if (genreValue && cardGenre.indexOf(genreValue) === -1) {
            match = false;
          }

          card.style.display = match ? "" : "none";
          if (match) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [input, region, year, genre].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilters);
          control.addEventListener("change", applyFilters);
        }
      });
    });

    document.querySelectorAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var trigger = player.querySelector("[data-play-trigger]");
      var stream = player.getAttribute("data-stream");
      var attached = false;
      var hlsInstance = null;

      if (!video || !stream) {
        return;
      }

      function attachStream() {
        if (attached) {
          return Promise.resolve();
        }

        attached = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            maxBufferLength: 30
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          return new Promise(function (resolve) {
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
          });
        }

        video.src = stream;
        return Promise.resolve();
      }

      function begin() {
        attachStream().then(function () {
          var promise = video.play();
          if (promise && typeof promise.catch === "function") {
            promise.catch(function () {});
          }
        });
        player.classList.add("is-playing");
        if (trigger) {
          trigger.hidden = true;
        }
      }

      if (trigger) {
        trigger.addEventListener("click", begin);
      }

      video.addEventListener("click", function () {
        if (video.paused) {
          begin();
        }
      });

      video.addEventListener("play", function () {
        player.classList.add("is-playing");
        if (trigger) {
          trigger.hidden = true;
        }
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
