/* Language switcher — auto-derives links from current page filename */
(function () {
    var filename = window.location.pathname.split('/').pop() || 'index.html';
    if (!filename.endsWith('.html')) filename = 'index.html';

    // Strip language suffix to get the base stem (e.g. "learn-zh.html" → "learn")
    var stem = filename.replace(/-zh\.html$/, '').replace(/-ru\.html$/, '').replace(/\.html$/, '');

    // Detect current language
    var currentLang = 'en';
    if (filename.endsWith('-zh.html')) currentLang = 'zh';
    else if (filename.endsWith('-ru.html')) currentLang = 'ru';

    // Build hrefs
    var hrefs = {
        en: stem + '.html',
        zh: stem + '-zh.html',
        ru: stem + '-ru.html'
    };

    // Friendly labels shown on the pill button
    var btnLabels = { en: 'EN', zh: '中文', ru: 'RU' };

    // Apply once DOM is ready
    function init() {
        var btn  = document.getElementById('lang-btn');
        var menu = document.getElementById('langMenu');
        if (!btn || !menu) return;

        // Update pill label to show current language
        var labelEl = btn.querySelector('.lang-current');
        if (labelEl) labelEl.textContent = btnLabels[currentLang];

        // Set hrefs and mark active
        ['en', 'zh', 'ru'].forEach(function (lang) {
            var link = document.getElementById('lang-link-' + lang);
            if (!link) return;
            link.href = hrefs[lang];
            if (lang === currentLang) {
                link.classList.add('lang-active');
                link.setAttribute('aria-current', 'true');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* Toggle open/close */
    window.toggleLangMenu = function (btn) {
        var menu = btn.nextElementSibling;
        var open = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
        if (open) {
            var r = btn.getBoundingClientRect();
            menu.style.top  = (r.bottom + window.scrollY + 6) + 'px';
            menu.style.right = (window.innerWidth - r.right) + 'px';
            menu.style.left = 'auto';
        }
    };

    /* Close on outside click */
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.lang-switcher')) {
            document.querySelectorAll('.lang-menu').forEach(function (m) {
                m.classList.remove('open');
            });
            document.querySelectorAll('.lang-btn').forEach(function (b) {
                b.setAttribute('aria-expanded', 'false');
            });
        }
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.lang-menu').forEach(function (m) {
                m.classList.remove('open');
            });
        }
    });
}());
