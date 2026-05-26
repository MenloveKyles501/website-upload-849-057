(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('is-missing');
      image.removeAttribute('src');
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  document.querySelectorAll('[data-card-search]').forEach(function (input) {
    var list = document.querySelector('[data-card-list]');

    if (!list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.children);

    input.addEventListener('input', function () {
      var keyword = input.value.trim().toLowerCase();

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre')
        ].join(' ').toLowerCase();

        card.classList.toggle('is-hidden-card', keyword && text.indexOf(keyword) === -1);
      });
    });
  });

  var searchForm = document.querySelector('[data-search-form]');
  var searchInput = document.querySelector('[data-search-input]');
  var searchResults = document.querySelector('[data-search-results]');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function searchMovies(query) {
    if (!searchResults || !window.MovieCatalog) {
      return;
    }

    var keyword = query.trim().toLowerCase();

    if (!keyword) {
      searchResults.innerHTML = '<p class="search-empty">输入关键词即可查看匹配影片。</p>';
      return;
    }

    var matches = window.MovieCatalog.filter(function (item) {
      return item.text.indexOf(keyword) !== -1;
    }).slice(0, 80);

    if (!matches.length) {
      searchResults.innerHTML = '<p class="search-empty">没有找到匹配影片。</p>';
      return;
    }

    searchResults.innerHTML = matches.map(function (item) {
      return [
        '<article class="movie-card-horizontal">',
        '<a class="horizontal-link" href="' + escapeHtml(item.url) + '">',
        '<span class="horizontal-poster"><img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy"><span class="horizontal-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z"></path></svg></span></span>',
        '<span class="horizontal-body">',
        '<strong>' + escapeHtml(item.title) + '</strong>',
        '<span>' + escapeHtml(item.desc) + '</span>',
        '<em>' + escapeHtml(item.year) + '年 · ' + escapeHtml(item.region) + ' · ' + escapeHtml(item.genre) + '</em>',
        '</span>',
        '</a>',
        '</article>'
      ].join('');
    }).join('');
  }

  if (searchForm && searchInput) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (initialQuery) {
      searchInput.value = initialQuery;
      searchMovies(initialQuery);
    }

    searchInput.addEventListener('input', function () {
      searchMovies(searchInput.value);
    });

    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      searchMovies(searchInput.value);

      var query = searchInput.value.trim();
      var nextUrl = query ? './search.html?q=' + encodeURIComponent(query) : './search.html';
      window.history.replaceState(null, '', nextUrl);
    });
  }
})();
