#!/usr/bin/env python3
"""
Russian Link Checker using Scrapling
Checks if Russian pages have correct links by fetching live site
"""

import os
import re
from scrapling import Fetcher, Selector
from urllib.parse import urljoin, urlparse

BASE_URL = 'https://fli-rpx.github.io/mindfulness/'
LOCAL_PATH = '/root/.openclaw/workspace/mindfulness'

russian_files = [
    'index-ru.html', 'emotion-explorer-ru.html', 'emotion-balance-ru.html',
    'salad-compass-ru.html', 'salad-check-ru.html', 'interventions-ru.html',
    'journal-ru.html', 'learn-ru.html', 'progress-ru.html', 'cycle-ru.html',
    'assessment-ru.html', 'hypnosis-ru.html'
]

fetcher = Fetcher()
fixes = []
files_checked = 0

print("Russian Link Checker (using Scrapling)")
print("=" * 50)

for filename in russian_files:
    try:
        url = urljoin(BASE_URL, filename)
        print(f"\nChecking {filename}...")
        
        # Fetch page using Scrapling
        page = fetcher.get(url, timeout=10)
        content = page.text
        
        files_checked += 1
        original_content = content
        
        # Find all href links to .html files (not -ru.html, not -zh.html, not http)
        pattern = r'href="([a-zA-Z0-9_-]+)\.html"'
        matches = re.findall(pattern, content)
        
        for match in matches:
            # Skip if already -ru or -zh
            if match.endswith('-ru') or match.endswith('-zh'):
                continue
            # Skip external URLs
            if match.startswith('http'):
                continue
            
            # Replace with -ru version
            old_link = f'href="{match}.html"'
            new_link = f'href="{match}-ru.html"'
            content = content.replace(old_link, new_link)
            fixes.append(f"{filename}: {old_link} → {new_link}")
        
        # Write back if changed
        if content != original_content:
            filepath = os.path.join(LOCAL_PATH, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  Fixed links in {filename}")
        else:
            print(f"  ✓ All links correct")
            
    except Exception as e:
        print(f"  Error: {e}")

# Output results
print(f"\n{'='*50}")
print(f"Files checked: {files_checked}")
if fixes:
    print(f"Links fixed: {len(fixes)}")
    for fix in fixes[:10]:  # Show first 10
        print(f"  - {fix}")
else:
    print("All Russian files have correct links!")
