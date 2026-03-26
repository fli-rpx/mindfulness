#!/usr/bin/env python3
"""
Auto-Translate Russian using Scrapling
Scans live site for English content that should be translated
"""

import re
from scrapling import Fetcher
from urllib.parse import urljoin

BASE_URL = 'https://fli-rpx.github.io/mindfulness/'

russian_files = [
    'index-ru.html', 'emotion-explorer-ru.html', 'emotion-balance-ru.html',
    'salad-compass-ru.html', 'salad-check-ru.html', 'interventions-ru.html',
    'journal-ru.html', 'learn-ru.html', 'progress-ru.html', 'cycle-ru.html',
    'assessment-ru.html', 'hypnosis-ru.html'
]

# Common UI terms that should be translated
terms_to_check = ['Home', 'Cycle', 'AI Chat', 'Tools', 'Journal', 'Progress', 'Learn',
                  'Start', 'Submit', 'Cancel', 'Save', 'Next', 'Back', 'Loading']

fetcher = Fetcher()
findings = []

print("Auto-Translate Russian Scan (Scrapling)")
print("=" * 50)

for filename in russian_files:
    try:
        url = urljoin(BASE_URL, filename)
        page = fetcher.get(url, timeout=10)
        text = page.get_all_text(ignore_tags=('script', 'style'))
        
        found_terms = []
        for term in terms_to_check:
            if re.search(r'\b' + re.escape(term) + r'\b', text):
                found_terms.append(term)
        
        if found_terms:
            findings.append(f"{filename}: {', '.join(found_terms)}")
            print(f"✗ {filename}: {len(found_terms)} untranslated terms")
        else:
            print(f"✓ {filename}: All translated")
            
    except Exception as e:
        print(f"✗ Error: {filename} - {e}")

print(f"\n{'='*50}")
if findings:
    print(f"Found {len(findings)} files with untranslated content")
else:
    print("All Russian files are fully translated!")
