#!/usr/bin/env python3
"""
Chinese Link Checker using Scrapling
"""

import os
import re
from scrapling import Fetcher
from urllib.parse import urljoin

BASE_URL = 'https://fli-rpx.github.io/mindfulness/'
LOCAL_PATH = '/root/.openclaw/workspace/mindfulness'

chinese_files = [f.replace('.html', '-zh.html') for f in [
    'index.html', 'emotion-explorer.html', 'emotion-balance.html',
    'salad-compass.html', 'salad-check.html', 'interventions.html',
    'journal.html', 'learn.html', 'progress.html', 'cycle.html',
    'assessment.html', 'hypnosis.html'
]]

fetcher = Fetcher()
fixes = []

print("Chinese Link Checker (Scrapling)")
print("=" * 50)

for filename in chinese_files:
    try:
        url = urljoin(BASE_URL, filename)
        page = fetcher.get(url, timeout=10)
        content = page.text
        original = content
        
        # Fix links
        for match in re.findall(r'href="([a-zA-Z0-9_-]+)\.html"', content):
            if match.endswith(('-zh', '-ru')) or match.startswith('http'):
                continue
            content = content.replace(f'href="{match}.html"', f'href="{match}-zh.html"')
            fixes.append(filename)
        
        if content != original:
            with open(os.path.join(LOCAL_PATH, filename), 'w', encoding='utf-8') as f:
                f.write(content)
    except Exception as e:
        print(f"Error: {e}")

print(f"Files checked: {len(chinese_files)}")
print(f"Fixed: {len(fixes)} files" if fixes else "All links correct!")
