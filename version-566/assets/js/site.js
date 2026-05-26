import { H as Hls } from "./hls-dru42stk.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

ready(() => {
  initMobileMenu();
  initHeroCarousels();
  initFilters();
  initPlayers();
});

function initMobileMenu() {
  const button = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-nav]");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "×" : "☰";
  });
}

function initHeroCarousels() {
  document.querySelectorAll("[data-hero]").forEach((hero) => {
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dot"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");

    if (slides.length <= 1) {
      return;
    }

    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => show(index + 1), 5000);
    };

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    prev?.addEventListener("click", () => {
      show(index - 1);
      start();
    });

    next?.addEventListener("click", () => {
      show(index + 1);
      start();
    });

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  });
}

function initFilters() {
  document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
    const cards = Array.from(scope.querySelectorAll(".movie-card"));
    const queryInput = scope.querySelector("[data-filter-query]");
    const categorySelect = scope.querySelector("[data-filter-category]");
    const yearSelect = scope.querySelector("[data-filter-year]");
    const regionSelect = scope.querySelector("[data-filter-region]");
    const typeSelect = scope.querySelector("[data-filter-type]");
    const countNode = scope.querySelector("[data-result-count]");
    const emptyNode = scope.querySelector("[data-empty-state]");
    const resetButton = scope.querySelector("[data-filter-reset]");

    if (!cards.length) {
      return;
    }

    const normalize = (value) => (value || "").toString().trim().toLowerCase();

    const apply = () => {
      const query = normalize(queryInput?.value);
      const category = normalize(categorySelect?.value);
      const year = normalize(yearSelect?.value);
      const region = normalize(regionSelect?.value);
      const type = normalize(typeSelect?.value);
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.summary,
          card.dataset.genre,
          card.dataset.tags,
          card.dataset.region,
          card.dataset.type,
          card.dataset.category,
          card.dataset.year
        ].join(" "));

        const matchQuery = !query || haystack.includes(query);
        const matchCategory = !category || normalize(card.dataset.category) === category;
        const matchYear = !year || normalize(card.dataset.year) === year;
        const matchRegion = !region || normalize(card.dataset.region).includes(region);
        const matchType = !type || normalize(card.dataset.type) === type;
        const match = matchQuery && matchCategory && matchYear && matchRegion && matchType;

        card.classList.toggle("hidden", !match);
        if (match) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = `当前显示 ${visible} 部影片 / 共 ${cards.length} 部`;
      }

      if (emptyNode) {
        emptyNode.classList.toggle("is-visible", visible === 0);
      }
    };

    [queryInput, categorySelect, yearSelect, regionSelect, typeSelect].forEach((input) => {
      input?.addEventListener("input", apply);
      input?.addEventListener("change", apply);
    });

    resetButton?.addEventListener("click", () => {
      [queryInput, categorySelect, yearSelect, regionSelect, typeSelect].forEach((input) => {
        if (input) {
          input.value = "";
        }
      });
      apply();
    });

    apply();
  });
}

function initPlayers() {
  document.querySelectorAll("[data-player]").forEach((player) => {
    const video = player.querySelector("video");
    const startButton = player.querySelector("[data-player-start]");
    const playButton = player.querySelector("[data-player-play]");
    const muteButton = player.querySelector("[data-player-mute]");
    const fullscreenButton = player.querySelector("[data-player-fullscreen]");
    const errorNode = player.querySelector("[data-player-error]");
    const source = player.dataset.src;
    const fallbackSource = player.dataset.fallbackSrc;
    let hls = null;
    let loaded = false;
    let usingFallback = false;

    if (!video || !source) {
      return;
    }

    const setError = (message) => {
      player.classList.remove("is-loading");
      player.classList.add("has-error");
      if (errorNode) {
        errorNode.textContent = message;
      }
    };

    const clearError = () => {
      player.classList.remove("has-error");
      if (errorNode) {
        errorNode.textContent = "";
      }
    };

    const destroyHls = () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    };

    const fallback = () => {
      if (fallbackSource && !usingFallback) {
        usingFallback = true;
        loaded = false;
        destroyHls();
        return loadSource(fallbackSource);
      }
      setError("视频加载失败，请稍后刷新页面或更换浏览器。播放器逻辑仍可重新点击初始化。 ");
      return Promise.resolve();
    };

    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          player.classList.add("is-paused");
        });
      }
    };

    const loadSource = (src) => {
      clearError();
      player.classList.add("is-loading");

      return new Promise((resolve) => {
        if (Hls.isSupported() && src.includes(".m3u8")) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            loaded = true;
            player.classList.remove("is-loading");
            player.classList.add("is-ready");
            playVideo();
            resolve();
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data && data.fatal) {
              fallback().then(resolve);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl") || !src.includes(".m3u8")) {
          video.src = src;
          video.addEventListener("loadedmetadata", () => {
            loaded = true;
            player.classList.remove("is-loading");
            player.classList.add("is-ready");
            playVideo();
            resolve();
          }, { once: true });
          video.addEventListener("error", () => {
            fallback().then(resolve);
          }, { once: true });
          video.load();
        } else {
          fallback().then(resolve);
        }
      });
    };

    const start = () => {
      if (!loaded) {
        loadSource(source);
      } else if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    };

    startButton?.addEventListener("click", start);
    video.addEventListener("click", start);

    playButton?.addEventListener("click", () => {
      if (!loaded) {
        start();
      } else if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    muteButton?.addEventListener("click", () => {
      video.muted = !video.muted;
      muteButton.textContent = video.muted ? "🔇" : "🔊";
    });

    fullscreenButton?.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        player.requestFullscreen?.();
      }
    });

    video.addEventListener("play", () => {
      player.classList.add("is-playing");
      player.classList.remove("is-paused");
      if (playButton) {
        playButton.textContent = "⏸";
      }
    });

    video.addEventListener("pause", () => {
      player.classList.remove("is-playing");
      player.classList.add("is-paused");
      if (playButton) {
        playButton.textContent = "▶";
      }
    });
  });
}
