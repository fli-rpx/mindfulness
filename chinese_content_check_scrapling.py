#!/usr/bin/env python3
"""
Chinese Content Check using Scrapling
"""

from scrapling import Fetcher
from urllib.parse import urljoin

BASE_URL = 'https://fli-rpx.github.io/mindfulness/'

pairs = [
    ('index.html', 'index-zh.html'),
    ('emotion-explorer.html', 'emotion-explorer-zh.html'),
    ('emotion-balance.html', 'emotion-balance-zh.html'),
    ('salad-compass.html', 'salad-compass-zh.html'),
    ('salad-check.html', 'salad-check-zh.html'),
    ('interventions.html', 'interventions-zh.html'),
    ('journal.html', 'journal-zh.html'),
    ('learn.html', 'learn-zh.html'),
    ('progress.html', 'progress-zh.html'),
    ('cycle.html', 'cycle-zh.html'),
    ('assessment.html', 'assessment-zh.html'),
    ('hypnosis.html', 'hypnosis-zh.html'),
]

fetcher = Fetcher()
results = []

print("Chinese Content Check (Scrapling)")
print("=" * 50)

for en, zh in pairs:
    try:
        en_page = fetcher.get(urljoin(BASE_URL, en), timeout=10)
        zh_page = fetcher.get(urljoin(BASE_URL, zh), timeout=10)
        
        checks = {
            'pair': f"{en} vs {zh}",
            'h2': len(en_page.css('h2').getall()) == len(zh_page.css('h2').getall()),
            'h3': len(en_page.css('h3').getall()) == len(zh_page.css('h3').getall()),
            'p': abs(len(en_page.css('p').getall()) - len(zh_page.css('p').getall())) <= 3,
            'img': len(en_page.css('img').getall()) == len(zh_page.css('img').getall()),
        }
        results.append(checks)
        
        status = "✓" if all(checks.values()) else "✗"
        print(f"{status} {en} vs {zh}")
        
    except Exception as e:
        print(f"✗ Error: {en} vs {zh} - {e}")

matching = sum(1 for r in results if all(v for k, v in r.items() if k != 'pair'))
print(f"\n{'='*50}")
print(f"Results: {matching}/{len(pairs)} pairs match")
