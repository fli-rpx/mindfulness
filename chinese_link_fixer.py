#!/usr/bin/env python3
import re
import os

chinese_files = [
    "index-zh.html", "emotion-explorer-zh.html", "emotion-balance-zh.html",
    "salad-compass-zh.html", "salad-check-zh.html", "interventions-zh.html",
    "journal-zh.html", "learn-zh.html", "progress-zh.html", "cycle-zh.html",
    "assessment-zh.html", "hypnosis-zh.html"
]

base_path = "/root/.openclaw/workspace/mindfulness"
fixes = []

for filename in chinese_files:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Find all href links to .html files (not -zh.html, not -ru.html, not http)
    pattern = r'href="([a-zA-Z0-9_-]+)\.html"'
    matches = re.findall(pattern, content)
    
    for match in matches:
        # Skip if already -zh or -ru
        if match.endswith('-zh') or match.endswith('-ru'):
            continue
        # Skip external URLs
        if match.startswith('http'):
            continue
        
        # Replace with -zh version
        old_link = f'href="{match}.html"'
        new_link = f'href="{match}-zh.html"'
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
    print("All Chinese files have correct links. No fixes needed.")
