import { H as Hls } from "./hls-vendor-dru42stk.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

function setupMobileMenu() {
  const button = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-mobile-nav]");

  if (!button || !nav) {
    return;
  }

  button.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
}

function setupHero() {
  const hero = document.querySelector("[data-hero]");

  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
  const thumbs = Array.from(hero.querySelectorAll("[data-hero-thumb]"));
  const prev = hero.querySelector("[data-hero-prev]");
  const next = hero.querySelector("[data-hero-next]");
  let current = 0;
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, itemIndex) => {
      slide.classList.toggle("is-active", itemIndex === current);
    });

    dots.forEach((dot, itemIndex) => {
      dot.classList.toggle("is-active", itemIndex === current);
    });

    thumbs.forEach((thumb, itemIndex) => {
      thumb.classList.toggle("is-active", itemIndex === current);
    });
  };

  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5000);
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.heroDot));
      start();
    });
  });

  thumbs.forEach((thumb) => {
    thumb.addEventListener("mouseenter", () => {
      show(Number(thumb.dataset.heroThumb));
      start();
    });
  });

  if (prev) {
    prev.addEventListener("click", () => {
      show(current - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      show(current + 1);
      start();
    });
  }

  show(0);
  start();
}

function setupFilters() {
  const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));

  panels.forEach((panel) => {
    const root = panel.closest("main") || document;
    const searchInput = panel.querySelector("[data-local-search]");
    const regionSelect = panel.querySelector("[data-filter-region]");
    const typeSelect = panel.querySelector("[data-filter-type]");
    const yearSelect = panel.querySelector("[data-filter-year]");
    const cards = Array.from(root.querySelectorAll("[data-movie-card]"));
    const emptyState = root.querySelector("[data-empty-state]");
    const count = root.querySelector("[data-result-count]");

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("q") || "";

    if (initialQuery && searchInput) {
      searchInput.value = initialQuery;
    }

    const update = () => {
      const query = (searchInput?.value || "").trim().toLowerCase();
      const region = regionSelect?.value || "";
      const type = typeSelect?.value || "";
      const year = yearSelect?.value || "";
      let visible = 0;

      cards.forEach((card) => {
        const matchesQuery = !query || (card.dataset.search || "").toLowerCase().includes(query);
        const matchesRegion = !region || card.dataset.region === region;
        const matchesType = !type || card.dataset.type === type;
        const matchesYear = !year || card.dataset.year === year;
        const shouldShow = matchesQuery && matchesRegion && matchesType && matchesYear;

        card.hidden = !shouldShow;

        if (shouldShow) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }

      if (count) {
        count.textContent = `共 ${visible} 部内容`;
      }
    };

    [searchInput, regionSelect, typeSelect, yearSelect].forEach((control) => {
      if (control) {
        control.addEventListener("input", update);
        control.addEventListener("change", update);
      }
    });

    update();
  });
}

function setupPlayer() {
  const video = document.querySelector("[data-hls-player]");
  const overlay = document.querySelector("[data-player-overlay]");

  if (!video) {
    return;
  }

  const source = video.dataset.src;
  let hls = null;
  let initialized = false;

  const initialize = () => {
    if (initialized || !source) {
      return;
    }

    initialized = true;

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    } else {
      video.src = source;
    }
  };

  const play = async () => {
    initialize();

    try {
      await video.play();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    } catch (error) {
      console.warn("Video play was interrupted:", error);
    }
  };

  if (overlay) {
    overlay.addEventListener("click", play);
  }

  video.addEventListener("play", () => {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  });

  video.addEventListener("pause", () => {
    if (overlay && video.currentTime === 0) {
      overlay.classList.remove("is-hidden");
    }
  });

  video.addEventListener("click", () => {
    if (video.paused) {
      play();
    }
  });

  initialize();
}

ready(() => {
  setupMobileMenu();
  setupHero();
  setupFilters();
  setupPlayer();
});
