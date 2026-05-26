(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      siteNav.classList.toggle("is-open");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var prev = document.querySelector("[data-hero-prev]");
  var next = document.querySelector("[data-hero-next]");
  var current = 0;
  var timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === current);
    });
  }

  function startHero() {
    if (slides.length < 2) {
      return;
    }
    clearInterval(timer);
    timer = setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  if (prev) {
    prev.addEventListener("click", function () {
      showSlide(current - 1);
      startHero();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      showSlide(current + 1);
      startHero();
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
      startHero();
    });
  });

  showSlide(0);
  startHero();

  function normalize(text) {
    return (text || "").toString().trim().toLowerCase();
  }

  var searchInput = document.querySelector(".movie-search");
  var categoryFilter = document.querySelector(".movie-category-filter");
  var yearFilter = document.querySelector(".movie-year-filter");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-list] .movie-card, [data-movie-list] .ranking-card"));
  var emptyState = document.querySelector("[data-empty-state]");

  function applyFilters() {
    if (!cards.length) {
      return;
    }
    var query = normalize(searchInput && searchInput.value);
    var category = normalize(categoryFilter && categoryFilter.value);
    var year = normalize(yearFilter && yearFilter.value);
    var visible = 0;

    cards.forEach(function (card) {
      var text = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-category"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year"),
        card.getAttribute("data-genre"),
        card.textContent
      ].join(" "));
      var cardCategory = normalize(card.getAttribute("data-category"));
      var cardYear = normalize(card.getAttribute("data-year"));
      var yearMatch = true;

      if (year === "1990") {
        yearMatch = Number(cardYear) < 2020;
      } else if (year) {
        yearMatch = cardYear === year;
      }

      var match = (!query || text.indexOf(query) !== -1) && (!category || cardCategory === category) && yearMatch;
      card.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  [searchInput, categoryFilter, yearFilter].forEach(function (control) {
    if (control) {
      control.addEventListener("input", applyFilters);
      control.addEventListener("change", applyFilters);
    }
  });

  function attachPlayer(shell) {
    var video = shell.querySelector("video");
    var button = shell.querySelector(".play-overlay");
    var url = shell.getAttribute("data-video");
    var initialized = false;
    var hls = null;

    function start() {
      if (!video || !url) {
        return;
      }
      shell.classList.add("is-playing");
      if (!initialized) {
        initialized = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          video.src = url;
        }
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", start);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener("play", function () {
        shell.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        shell.classList.remove("is-playing");
      });
      video.addEventListener("ended", function () {
        shell.classList.remove("is-playing");
      });
    }
    window.addEventListener("pagehide", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll(".player-shell")).forEach(attachPlayer);
})();
