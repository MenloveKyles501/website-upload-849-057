(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
            document.body.classList.toggle('menu-open', mobileNav.classList.contains('is-open'));
        });
    }

    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function setupSearch() {
        var input = document.querySelector('[data-search-input]');
        var list = document.querySelector('.searchable-list');
        var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter-chip]'));

        if (!list || (!input && chips.length === 0)) {
            return;
        }

        var cards = Array.prototype.slice.call(list.querySelectorAll('[data-title]'));
        var activeFilter = '';

        function applyFilter() {
            var query = normalize(input ? input.value : '');
            var filter = normalize(activeFilter);

            cards.forEach(function (card) {
                var title = normalize(card.getAttribute('data-title'));
                var meta = normalize(card.getAttribute('data-meta'));
                var haystack = title + ' ' + meta;
                var matchesQuery = !query || haystack.indexOf(query) !== -1;
                var matchesFilter = !filter || haystack.indexOf(filter) !== -1;
                card.classList.toggle('is-hidden', !(matchesQuery && matchesFilter));
            });
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (item) {
                    item.classList.remove('active');
                });
                chip.classList.add('active');
                activeFilter = chip.getAttribute('data-filter-chip') || '';
                applyFilter();
            });
        });

        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q && input) {
            input.value = q;
            applyFilter();
        }
    }

    function setupPlayer() {
        var video = document.querySelector('[data-player-video]');
        var button = document.querySelector('[data-player-button]');
        var jump = document.querySelector('[data-player-jump]');
        var hlsInstance = null;
        var started = false;

        if (!video || !button) {
            return;
        }

        function playVideo() {
            var stream = button.getAttribute('data-stream');

            if (!stream) {
                return;
            }

            button.hidden = true;

            if (started) {
                video.play().catch(function () {});
                return;
            }

            started = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
                video.play().catch(function () {});
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(function () {});
                });
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal || !hlsInstance) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hlsInstance.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hlsInstance.recoverMediaError();
                    } else {
                        hlsInstance.destroy();
                    }
                });
                return;
            }

            video.src = stream;
            video.play().catch(function () {});
        }

        button.addEventListener('click', playVideo);
        video.addEventListener('click', function () {
            if (!started) {
                playVideo();
            }
        });

        if (jump) {
            jump.addEventListener('click', function (event) {
                event.preventDefault();
                video.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                playVideo();
            });
        }

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    setupSearch();
    setupPlayer();
})();
