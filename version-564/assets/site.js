(function () {
  var body = document.body;
  var toggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", function () {
      mobileMenu.classList.toggle("open");
      body.classList.toggle("menu-open", mobileMenu.classList.contains("open"));
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
  var activeSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === activeSlide);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === activeSlide);
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      showSlide(i);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(activeSlide + 1);
    }, 5200);
  }

  showSlide(0);

  var forms = Array.prototype.slice.call(document.querySelectorAll(".site-search-form"));
  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var input = form.querySelector("input[name='q']");
      if (!input || !input.value.trim()) {
        event.preventDefault();
        input && input.focus();
      }
    });
  });

  var localSearch = document.querySelector(".local-search");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .mini-card"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".filter-chip"));
  var noResults = document.querySelector(".no-results");
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get("q") || "";
  var activeCategory = "all";

  if (localSearch && initialQuery) {
    localSearch.value = initialQuery;
  }

  function cardText(card) {
    return [
      card.getAttribute("data-title"),
      card.getAttribute("data-genre"),
      card.getAttribute("data-region"),
      card.getAttribute("data-year"),
      card.getAttribute("data-type"),
      card.getAttribute("data-category")
    ].join(" ").toLowerCase();
  }

  function filterCards() {
    var query = localSearch ? localSearch.value.trim().toLowerCase() : "";
    var visible = 0;
    cards.forEach(function (card) {
      var matchQuery = !query || cardText(card).indexOf(query) !== -1;
      var matchCategory = activeCategory === "all" || card.getAttribute("data-category") === activeCategory;
      var show = matchQuery && matchCategory;
      card.style.display = show ? "" : "none";
      if (show) {
        visible += 1;
      }
    });
    if (noResults) {
      noResults.style.display = visible ? "none" : "block";
    }
  }

  if (localSearch && cards.length) {
    localSearch.addEventListener("input", filterCards);
    filterCards();
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (item) {
        item.classList.remove("active");
      });
      chip.classList.add("active");
      activeCategory = chip.getAttribute("data-category") || "all";
      filterCards();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll(".player-panel")).forEach(function (panel) {
    var video = panel.querySelector("video");
    var overlay = panel.querySelector(".player-overlay");
    var stream = panel.getAttribute("data-stream");
    var started = false;
    var hlsInstance = null;

    function bindStream() {
      if (!video || !stream || started) {
        return;
      }
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }
    }

    function playVideo() {
      bindStream();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      if (video) {
        video.controls = true;
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }
    }

    if (overlay) {
      overlay.addEventListener("click", playVideo);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          playVideo();
        }
      });
      video.addEventListener("ended", function () {
        if (hlsInstance && typeof hlsInstance.stopLoad === "function") {
          hlsInstance.stopLoad();
        }
      });
    }
  });
})();
