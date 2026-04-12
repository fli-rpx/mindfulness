#!/usr/bin/env python3
"""
Biophilic Design Migration Script
Applies the new styles.css design system to every HTML page by:
  1. Stripping boilerplate inline <style> that overrides styles.css
  2. Injecting <link rel="stylesheet" href="styles.css"> where missing
  3. Injecting Google Font links where missing
  4. Preserving truly page-specific CSS (iframe containers, etc.)
  5. Updating nav HTML: aria attrs, mobile button, icon logo, footer
"""

import os
import re
import sys

# ── Files already fully overhauled ────────────────────────────────────────────
SKIP = {'index.html', 'cycle.html', 'nav.html', '_migrate.py',
        'neuro_source.html', 'neuro_source-zh.html', 'neuro_source-ru.html',
        'emotion_meditation_source.html', 'emotion_meditation_source.css',
        'hypnosis_source.html', 'hypnosis_source-ru.html',
        'expectation_cooling_source.html'}

# ── Iframe-wrapper pages (need .iframe-container styles) ──────────────────────
IFRAME_PAGES = {
    'emotion-meditation.html', 'emotion-meditation-zh.html', 'emotion-meditation-ru.html',
    'hypnosis.html', 'hypnosis-zh.html', 'hypnosis-ru.html',
    'neuro.html', 'neuro-zh.html', 'neuro-ru.html',
}

IFRAME_STYLE = """\
        /* Iframe wrapper — updated nav height 68px */
        body { overflow: hidden; }
        .iframe-container {
            position: fixed;
            top: 68px;
            left: 0; right: 0; bottom: 0;
        }
        .iframe-container iframe {
            width: 100%; height: 100%; border: none;
        }"""

# ── Font + CSS injections ─────────────────────────────────────────────────────
FONT_PRECONNECT = (
    '    <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
)
FONT_LINK = (
    '    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond'
    ':wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">\n'
)
FA_LINK = (
    '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/'
    'font-awesome/6.4.0/css/all.min.css">\n'
)
CSS_LINK = '    <link rel="stylesheet" href="styles.css">\n'

# ── Boilerplate selectors to remove from inline <style> ───────────────────────
# Any CSS block whose selector *starts with* one of these prefixes is stripped.
BOILERPLATE_PREFIXES = [
    ':root',
    '*',
    'body',
    'html',
    'html,body',
    'h1',
    'h2',
    'h1,',      # h1, h2, h3 combos
    'h1 ,',
    'a ',
    'a{',
    'a,',
    'img',
    '.nav ',
    '.nav{',
    '.nav-bar',
    '.nav-container',
    '.nav-logo',
    '.nav-links',
    '.nav-link',
    '.nav-btn',
    '.nav-brand',
    '.nav-dropdown',
    '.dropdown-toggle',
    '.dropdown-menu',
    '.mobile-menu-btn',
    '.tools-dropdown',
    '.hero ',
    '.hero{',
    '.hero-container',
    '.hero-eyebrow',
    '.hero-subtitle',
    '.hero-actions',
    '.hero-visual',
    '.hero-content',
    '.hero h1',
    '.hero h2',
    '.hero p',
    '.btn ',
    '.btn{',
    '.btn-primary',
    '.btn-secondary',
    '.btn-ghost',
    '.section-label',
    '.section-header',
    '.mini-cycle',
    '@media (max-width: 768px)',
    '@media (max-width: 640px)',
    '/* Navigation */',
    '/* Tools',
    '/* Hero */',
    '/* Buttons */',
    '/* Mobile',
    '/* Responsive */',
    '/* Dropdown',
]

def is_boilerplate_selector(sel: str) -> bool:
    sel = sel.strip()
    for prefix in BOILERPLATE_PREFIXES:
        if sel.startswith(prefix):
            return True
    # Catch plain element selectors like just 'body' or '*'
    if sel in ('*', 'body', 'html', 'h1', 'h2', 'h3', 'h4', 'p', 'a'):
        return True
    return False


def strip_boilerplate_from_css(css: str) -> str:
    """
    Remove boilerplate CSS blocks from a string of CSS.
    Uses a simple brace-counter approach to extract each top-level block,
    checks the selector, and either keeps or discards it.
    """
    result = []
    i = 0
    n = len(css)

    while i < n:
        # Skip whitespace / comments at the top level between blocks
        # Find the next '{' — everything before it is the selector
        brace_start = css.find('{', i)
        if brace_start == -1:
            # No more blocks — keep any trailing text (unlikely to matter)
            tail = css[i:].strip()
            if tail and not tail.startswith('/*'):
                result.append(css[i:])
            break

        selector_raw = css[i:brace_start]

        # Find the matching closing brace (handle nesting for @media)
        depth = 1
        j = brace_start + 1
        while j < n and depth > 0:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        block_body = css[brace_start:j]  # includes { ... }

        full_block = selector_raw + block_body

        if is_boilerplate_selector(selector_raw.strip()):
            pass  # discard
        else:
            result.append(full_block)

        i = j

    return '\n'.join(r.strip() for r in result if r.strip())


def get_active_page_key(filename: str) -> str:
    """Map filename to the nav link that should be active."""
    base = filename.replace('-zh.html', '.html').replace('-ru.html', '.html')
    mapping = {
        'index.html': 'index.html',
        'cycle.html': 'cycle.html',
        'assessment.html': 'assessment.html',
        'emotion-explorer.html': 'emotion-explorer.html',
        'emotion-balance.html': 'emotion-balance.html',
        'emotion-meditation.html': 'emotion-meditation.html',
        'expectation-cooling.html': 'expectation-cooling.html',
        'hypnosis.html': 'hypnosis.html',
        'neuro.html': 'neuro.html',
        'salad-compass.html': 'salad-compass.html',
        'salad-check.html': 'salad-check.html',
        'interventions.html': 'interventions.html',
        'connection.html': 'connection.html',
        'journal.html': 'journal.html',
        'progress.html': 'progress.html',
        'learn.html': 'learn.html',
        'disclaimer.html': 'disclaimer.html',
    }
    return mapping.get(base, '')


def build_nav_html(filename: str, lang: str) -> str:
    """
    Returns the complete nav HTML for a page, localised to lang ('en'|'zh'|'ru').
    All links point to the correct language variants.
    """
    is_zh = lang == 'zh'
    is_ru = lang == 'ru'
    suffix = '-zh' if is_zh else ('-ru' if is_ru else '')
    ext = '.html'

    def page(name):
        return f"{name}{suffix}{ext}"

    # Determine active link
    active_page = get_active_page_key(filename)

    def link(href, label):
        active = ' active' if href == active_page or (suffix and href.replace(suffix,'') == active_page.replace(suffix,'')) else ''
        return f'                <a href="{href}" class="nav-link{active}">{label}</a>\n'

    if is_zh:
        logo_text = '正念疗法'
        home_lbl = '首页'; cycle_lbl = '周期'; chat_lbl = 'AI对话'
        tools_lbl = '工具'; journal_lbl = '日记'; progress_lbl = '进度'
        learn_lbl = '学习'; connection_lbl = '联结'
        menu_aria = '打开导航菜单'
    elif is_ru:
        logo_text = 'Осознанность'
        home_lbl = 'Главная'; cycle_lbl = 'Цикл'; chat_lbl = 'AI Чат'
        tools_lbl = 'Инструменты'; journal_lbl = 'Журнал'; progress_lbl = 'Прогресс'
        learn_lbl = 'Учиться'; connection_lbl = 'Связь'
        menu_aria = 'Открыть меню'
    else:
        logo_text = 'Mindfulness Therapy'
        home_lbl = 'Home'; cycle_lbl = 'Cycle'; chat_lbl = 'AI Chat'
        tools_lbl = 'Tools'; journal_lbl = 'Journal'; progress_lbl = 'Progress'
        learn_lbl = 'Learn'; connection_lbl = 'Connection'
        menu_aria = 'Open navigation menu'

    # Tool menu items always link to EN pages (no zh/ru tool variants for most)
    # But for pages that DO have zh/ru variants, we link to them:
    tool_links = [
        ('emotion-explorer.html', '🎨 Emotion Explorer'),
        ('emotion-balance.html', '⚡ Emotion Balance'),
        ('emotion-meditation.html', '🌬️ Emotion Meditation'),
        ('expectation-cooling.html', '❄️ Expectation Cooling'),
        ('hypnosis.html', '🌀 Hypnosis'),
        ('neuro.html', '🧠 Neuro·Contemplative'),
        ('salad-compass.html', '🥗 Salad Compass'),
        ('salad-check.html', '🥬 Full Salad Check'),
        ('interventions.html', '🧰 Interventions'),
        ('connection.html', '🤝 Connection'),
    ]

    tool_items_html = ''
    for href, label in tool_links:
        tool_items_html += f'                        <a href="{href}" role="menuitem">{label}</a>\n'

    # Check active link for the given filename
    def nav_link(href, label):
        base_href = href.replace(suffix + '.html', '.html')
        base_active = active_page.replace(suffix + '.html', '.html') if suffix else active_page
        is_active = (href == active_page or base_href == base_active)
        cls = 'nav-link active' if is_active else 'nav-link'
        return f'                <a href="{href}" class="{cls}">{label}</a>'

    nav = f'''\
    <nav class="nav" aria-label="Main navigation">
        <div class="nav-container">
            <a href="{page('index')}" class="nav-logo" aria-label="{logo_text} – Home">
                <i class="fas fa-leaf" aria-hidden="true"></i> {logo_text}
            </a>
            <div class="nav-links" id="nav-links">
                {nav_link(page('index'), home_lbl)}
                {nav_link(page('cycle'), cycle_lbl)}
                {nav_link(page('assessment'), chat_lbl)}
                <div class="tools-dropdown-container">
                    <button class="tools-dropdown-btn"
                            onclick="toggleToolsDropdown(this)"
                            aria-haspopup="true" aria-expanded="false" aria-controls="toolsMenu">
                        {tools_lbl} <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div class="tools-dropdown-menu" id="toolsMenu" role="menu">
{tool_items_html}\
                    </div>
                </div>
                {nav_link(page('journal'), journal_lbl)}
                {nav_link(page('progress'), progress_lbl)}
                {nav_link(page('learn'), learn_lbl)}
                {nav_link(page('connection'), connection_lbl)}
            </div>
            <button class="mobile-menu-btn" id="mobile-menu-btn"
                    aria-label="{menu_aria}" aria-expanded="false" aria-controls="nav-links">
                <i class="fas fa-bars" aria-hidden="true"></i>
            </button>
        </div>
    </nav>'''
    return nav


NAV_JS = """\
    <script>
        function toggleToolsDropdown(btn) {
            var menu = btn.nextElementSibling;
            var open = menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', open);
            if (open) {
                var r = btn.getBoundingClientRect();
                menu.style.top  = (r.bottom + window.scrollY + 6) + 'px';
                menu.style.left = r.left + 'px';
            }
        }
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.tools-dropdown-container')) {
                document.querySelectorAll('.tools-dropdown-menu').forEach(function(m){ m.classList.remove('open'); });
                document.querySelectorAll('.tools-dropdown-btn').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.tools-dropdown-menu').forEach(function(m){ m.classList.remove('open'); });
            }
        });
        (function() {
            var btn = document.getElementById('mobile-menu-btn');
            var links = document.getElementById('nav-links');
            if (!btn || !links) return;
            btn.addEventListener('click', function() {
                var open = links.classList.toggle('mobile-open');
                btn.setAttribute('aria-expanded', open);
                btn.querySelector('i').className = open ? 'fas fa-times' : 'fas fa-bars';
            });
            links.querySelectorAll('a').forEach(function(a) {
                a.addEventListener('click', function() {
                    links.classList.remove('mobile-open');
                    btn.setAttribute('aria-expanded', 'false');
                    btn.querySelector('i').className = 'fas fa-bars';
                });
            });
        }());
    </script>"""


def detect_lang(filename: str) -> str:
    if '-zh.' in filename:
        return 'zh'
    if '-ru.' in filename:
        return 'ru'
    return 'en'


def process_file(filepath: str):
    filename = os.path.basename(filepath)
    print(f'Processing: {filename}')

    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    lang = detect_lang(filename)

    # ── 1. Strip ALL inline <style> blocks ────────────────────────────────────
    # We'll collect non-boilerplate CSS from each block and rebuild
    page_specific_css_parts = []

    def handle_style_block(m):
        css = m.group(1)
        remaining = strip_boilerplate_from_css(css)
        if remaining.strip():
            page_specific_css_parts.append(remaining.strip())
        return ''  # remove the block from HTML

    html = re.sub(r'<style[^>]*>(.*?)</style>', handle_style_block,
                  html, flags=re.DOTALL | re.IGNORECASE)

    # ── 2. Rebuild a single <style> block with page-specific CSS ──────────────
    new_style_parts = []
    if filename in IFRAME_PAGES:
        new_style_parts.append(IFRAME_STYLE)
    if page_specific_css_parts:
        new_style_parts.extend(page_specific_css_parts)

    new_style_block = ''
    if new_style_parts:
        inner = '\n\n        '.join(new_style_parts)
        new_style_block = f'    <style>\n        {inner}\n    </style>\n'

    # ── 3. Ensure font + FA + styles.css links are in <head> ─────────────────
    # Remove any existing duplicate font/FA/styles links first
    html = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com"[^>]*>\n?', '', html)
    html = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*>\n?', '', html)
    html = re.sub(r'\s*<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet"[^>]*>\n?', '', html)
    html = re.sub(r'\s*<link rel="stylesheet" href="https://cdnjs\.cloudflare\.com[^"]*"[^>]*>\n?', '', html)
    html = re.sub(r'\s*<link rel="stylesheet" href="styles\.css"[^>]*>\n?', '', html)

    # Inject all links just before </head>
    injection = (
        FONT_PRECONNECT +
        FONT_LINK +
        FA_LINK +
        CSS_LINK +
        new_style_block
    )
    html = re.sub(r'(\s*</head>)', '\n' + injection + r'\1', html, count=1)

    # ── 4. Replace entire <nav ...> block with new accessible nav ─────────────
    new_nav = build_nav_html(filename, lang)
    html = re.sub(r'<nav\b[^>]*>.*?</nav>', new_nav, html,
                  count=1, flags=re.DOTALL | re.IGNORECASE)

    # ── 5. Replace (or inject) nav JS — drop+replace existing toggleToolsMenu/toggleToolsDropdown
    html = re.sub(
        r'<script>\s*(//\s*(周期|工具|Tools)?\s*dropdown[^\<]*|function toggleTools[^\<]*</script>)',
        '', html, flags=re.DOTALL)

    # Remove old standalone toggleToolsMenu / toggleToolsDropdown / mobile-menu scripts
    html = re.sub(
        r'<script>\s*function (toggleTools(?:Dropdown|Menu)|closeToolsDropdown)[^<]*?</script>',
        '', html, flags=re.DOTALL)

    # Inject new nav JS just before </body>
    html = re.sub(r'(\s*</body>)', '\n' + NAV_JS + r'\n\1', html, count=1)

    # ── 6. Ensure <main> wraps content for a11y (add id if missing) ───────────
    if '<main' not in html:
        # wrap everything between </nav> and <footer (or </body>) in <main>
        html = re.sub(
            r'(</nav>\s*\n)(.*?)(\s*<footer|\s*</body>)',
            r'\1\n    <main id="main-content">\n\2\n    </main>\n\3',
            html, count=1, flags=re.DOTALL)
    elif 'id="main-content"' not in html:
        html = html.replace('<main>', '<main id="main-content">', 1)

    # ── 7. Add skip link after <body> if missing ──────────────────────────────
    if 'skip-link' not in html:
        html = re.sub(
            r'(<body[^>]*>)',
            r'\1\n    <a href="#main-content" class="skip-link">Skip to main content</a>',
            html, count=1)

    # ── 8. Add meta description if missing ───────────────────────────────────
    if 'meta name="description"' not in html:
        title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        desc = title_m.group(1) if title_m else 'Mindfulness Therapy — Emotional Wellness Platform'
        meta_desc = f'    <meta name="description" content="{desc}">\n'
        html = re.sub(r'(<meta name="viewport"[^>]*>\n?)', r'\1' + meta_desc, html, count=1)

    # ── 9. Fix footer ─────────────────────────────────────────────────────────
    # Replace any emoji 🧘 in the logo link with <i class="fas fa-leaf">
    html = re.sub(r'🧘\s*', '<i class="fas fa-leaf" aria-hidden="true"></i> ', html)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'  ✓ Done')


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_files = sorted(
        f for f in os.listdir(script_dir)
        if f.endswith('.html') and f not in SKIP
    )

    for fname in html_files:
        fpath = os.path.join(script_dir, fname)
        try:
            process_file(fpath)
        except Exception as e:
            print(f'  ✗ ERROR on {fname}: {e}', file=sys.stderr)

    print(f'\nMigration complete. {len(html_files)} files processed.')


if __name__ == '__main__':
    main()
