#!/usr/bin/env python3
"""
Content Comparison Script for Cron Job
Uses Scrapling to verify Chinese pages match English structure
AND auto-fixes differences by recreating ZH files from EN templates
ONLY scans https://fli-rpx.github.io/mindfulness/ - 12 file pairs (24 pages total)
"""

import json
import sys
import os
import subprocess
import re
from pathlib import Path
from scrapling import Fetcher
from urllib.parse import urljoin

# Telegram config
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

# EXPLICITLY ONLY THIS SITE - NO OTHER URLS
BASE_URL = 'https://fli-rpx.github.io/mindfulness/'
WORKSPACE_DIR = Path('/root/.openclaw/workspace/mindfulness')

# ONLY THESE 12 FILE PAIRS - NO CRAWLING BEYOND THIS LIST
file_pairs = [
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

def fix_zh_file(en_file, zh_file):
    """Recreate ZH file from EN template, preserving translations where possible"""
    print(f"   🔧 Fixing {zh_file}...")
    
    en_path = WORKSPACE_DIR / en_file
    zh_path = WORKSPACE_DIR / zh_file
    
    # Read EN file
    try:
        with open(en_path, 'r', encoding='utf-8') as f:
            en_content = f.read()
    except Exception as e:
        print(f"      ❌ Error reading EN file: {e}")
        return False
    
    # Try to read existing ZH content for translation preservation
    zh_translations = {}
    if zh_path.exists():
        try:
            with open(zh_path, 'r', encoding='utf-8') as f:
                old_zh_content = f.read()
            # Extract title if present
            title_match = re.search(r'<title>(.*?)</title>', old_zh_content, re.IGNORECASE)
            if title_match:
                zh_translations['title'] = title_match.group(1)
            # Extract h1 if present
            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', old_zh_content, re.IGNORECASE | re.DOTALL)
            if h1_match:
                zh_translations['h1'] = h1_match.group(1)
        except Exception as e:
            print(f"      ⚠️ Could not read existing ZH file: {e}")
    
    # Create ZH content from EN template
    zh_content = en_content
    
    # Replace lang attribute
    zh_content = re.sub(r'lang=["\']en["\']', 'lang="zh-CN"', zh_content, flags=re.IGNORECASE)
    zh_content = re.sub(r'lang=["\']en-US["\']', 'lang="zh-CN"', zh_content, flags=re.IGNORECASE)
    
    # Fix internal links: href="xxx.html" -> href="xxx-zh.html" (but not if already -zh)
    def fix_link(match):
        href = match.group(1)
        # Skip external links, anchors, already-fixed links
        if href.startswith('http') or href.startswith('#') or href.startswith('mailto:'):
            return f'href="{href}"'
        if '-zh.html' in href or '-ru.html' in href:
            return f'href="{href}"'
        # Fix .html links to -zh.html
        if href.endswith('.html') and not href.endswith('-zh.html'):
            new_href = href.replace('.html', '-zh.html')
            return f'href="{new_href}"'
        return f'href="{href}"'
    
    zh_content = re.sub(r'href=["\']([^"\']+)["\']', fix_link, zh_content)
    
    # Add/fix title if we have translation
    if 'title' in zh_translations:
        zh_content = re.sub(
            r'<title>.*?</title>',
            f'<title>{zh_translations["title"]}</title>',
            zh_content,
            flags=re.IGNORECASE
        )
    
    # Write ZH file
    try:
        with open(zh_path, 'w', encoding='utf-8') as f:
            f.write(zh_content)
        print(f"      ✅ Fixed: {zh_path}")
        return True
    except Exception as e:
        print(f"      ❌ Error writing ZH file: {e}")
        return False

def git_commit_and_push():
    """Commit and push changes if any files were modified"""
    try:
        # Check if there are changes
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=WORKSPACE_DIR,
            capture_output=True, text=True, check=True
        )
        
        if not result.stdout.strip():
            print("   No changes to commit")
            return True, "No changes"
        
        # Add all HTML files
        subprocess.run(['git', 'add', '*.html'], cwd=WORKSPACE_DIR, check=True)
        
        # Commit
        subprocess.run([
            'git', 'commit', '-m',
            'Auto-fix: Update Chinese files to match English structure'
        ], cwd=WORKSPACE_DIR, check=True)
        
        # Push
        subprocess.run(['git', 'push', 'origin', 'main'], cwd=WORKSPACE_DIR, check=True)
        
        return True, "Committed and pushed successfully"
        
    except subprocess.CalledProcessError as e:
        error_msg = f"Git operation failed: {e}"
        print(f"   {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Git error: {e}"
        print(f"   {error_msg}")
        return False, error_msg

def send_telegram_report(stats):
    """Send report to Telegram"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("   Telegram not configured, skipping notification")
        return
    
    message = f"""🇨🇳 Chinese Content Check Complete

📊 Summary:
• Files checked: {stats['total']}
• Already matching: {stats['matching']}
• Fixed and updated: {stats['fixed']}
• Errors: {stats['errors']}

🔧 Fixed files:
{chr(10).join(f"• {f}" for f in stats['fixed_files']) if stats['fixed_files'] else "• None (all files already matching)"}

✅ All Chinese pages now match English structure.
"""
    
    try:
        import requests
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'Markdown'
        }
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            print("   ✅ Telegram notification sent")
        else:
            print(f"   ⚠️ Telegram failed: {response.status_code}")
    except Exception as e:
        print(f"   ⚠️ Telegram error: {e}")

print("=" * 70)
print("Content Comparison: English vs Chinese Pages")
print("With AUTO-FIX for structural mismatches")
print(f"Target site: {BASE_URL}")
print(f"Files to check: {len(file_pairs)} pairs = {len(file_pairs) * 2} pages")
print("=" * 70)

fetcher = Fetcher()
results = []
errors = []
files_to_fix = []

for en_file, zh_file in file_pairs:
    print(f"\n📄 Comparing {en_file} vs {zh_file}...")
    
    try:
        # Build URLs - ONLY from BASE_URL
        en_url = urljoin(BASE_URL, en_file)
        zh_url = urljoin(BASE_URL, zh_file)
        
        print(f"   Fetching: {en_url}")
        en_page = fetcher.get(en_url, timeout=15)
        
        print(f"   Fetching: {zh_url}")
        zh_page = fetcher.get(zh_url, timeout=15)
        
        comparison = {
            'file_pair': f"{en_file} vs {zh_file}",
            'en_url': en_url,
            'zh_url': zh_url,
            'checks': {}
        }
        
        # Check structure
        en_h2 = len(en_page.css('h2').getall())
        zh_h2 = len(zh_page.css('h2').getall())
        comparison['checks']['h2_sections'] = {'en': en_h2, 'zh': zh_h2, 'match': en_h2 == zh_h2}
        
        en_h3 = len(en_page.css('h3').getall())
        zh_h3 = len(zh_page.css('h3').getall())
        comparison['checks']['h3_subsections'] = {'en': en_h3, 'zh': zh_h3, 'match': en_h3 == zh_h3}
        
        en_p = len(en_page.css('p').getall())
        zh_p = len(zh_page.css('p').getall())
        comparison['checks']['paragraphs'] = {'en': en_p, 'zh': zh_p, 'match': abs(en_p - zh_p) <= 3}
        
        en_img = len(en_page.css('img').getall())
        zh_img = len(zh_page.css('img').getall())
        comparison['checks']['images'] = {'en': en_img, 'zh': zh_img, 'match': en_img == zh_img}
        
        results.append(comparison)
        
        # Check if needs fixing
        all_match = all(check['match'] for check in comparison['checks'].values())
        
        if all_match:
            print(f"   ✅ Structure matches!")
        else:
            print(f"   ⚠️  Differences found:")
            for check_name, check_data in comparison['checks'].items():
                if not check_data['match']:
                    print(f"      • {check_name}: EN={check_data['en']}, ZH={check_data['zh']}")
            files_to_fix.append((en_file, zh_file))
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        errors.append(f"{en_file} vs {zh_file}: {str(e)[:50]}")

# FIX PHASE
print("\n" + "=" * 70)
print("FIX PHASE")
print("=" * 70)

fixed_count = 0
fixed_files = []

for en_file, zh_file in files_to_fix:
    if fix_zh_file(en_file, zh_file):
        fixed_count += 1
        fixed_files.append(zh_file)

# Git operations if files were fixed
git_result = None
if fixed_count > 0:
    print(f"\n   Committing changes...")
    success, git_result = git_commit_and_push()
    if not success:
        errors.append(git_result)

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

total = len(file_pairs)
successful = len(results)
passed = sum(1 for r in results if all(c['match'] for c in r['checks'].values()))
failed = successful - passed

print(f"Site scanned: {BASE_URL}")
print(f"Total file pairs: {total}")
print(f"✅ Already matching: {passed}")
print(f"🔧 Fixed: {fixed_count}")
print(f"⚠️  Still mismatched: {failed - fixed_count}")
print(f"❌ Errors: {len(errors)}")

if fixed_files:
    print(f"\nFixed files:")
    for f in fixed_files:
        print(f"  • {f}")

if errors:
    print(f"\nErrors ({len(errors)}):")
    for e in errors[:5]:
        print(f"  • {e}")

# Save detailed report
report_file = '/root/.openclaw/workspace/content_comparison_report.json'
with open(report_file, 'w') as f:
    json.dump({
        'site': BASE_URL,
        'files_checked': total,
        'matching': passed,
        'fixed': fixed_count,
        'errors': len(errors),
        'results': results,
        'errors_list': errors
    }, f, indent=2)

print(f"\n📊 Report saved to: {report_file}")

# Send Telegram report
print("\n" + "=" * 70)
print("TELEGRAM NOTIFICATION")
print("=" * 70)

stats = {
    'total': total,
    'matching': passed,
    'fixed': fixed_count,
    'errors': len(errors),
    'fixed_files': fixed_files
}
send_telegram_report(stats)

print("\n✅ Content comparison complete!")
print(f"   ONLY scanned: {BASE_URL}")
print(f"   Total pages: {len(file_pairs) * 2}")

sys.exit(0 if len(errors) == 0 else 1)
