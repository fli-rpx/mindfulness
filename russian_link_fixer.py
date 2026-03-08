#!/usr/bin/env python3
import re
import os

russian_files = [
    "index-ru.html", "emotion-explorer-ru.html", "emotion-balance-ru.html",
    "salad-compass-ru.html", "salad-check-ru.html", "interventions-ru.html",
    "journal-ru.html", "learn-ru.html", "progress-ru.html", "cycle-ru.html",
    "assessment-ru.html", "hypnosis-ru.html"
]

base_path = "/root/.openclaw/workspace/mindfulness"
fixes = []

for filename in russian_files:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
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
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# Output results
if fixes:
    print(f"Fixed {len(fixes)} links:")
    for fix in fixes:
        print(f"  {fix}")
else:
    print("All Russian files have correct links. No fixes needed.")
