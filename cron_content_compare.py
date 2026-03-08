#!/usr/bin/env python3
"""
Content Comparison Script for Cron Job
Uses Scrapling to verify Chinese pages match English structure
ONLY scans https://fli-rpx.github.io/mindfulness/ - 12 file pairs (24 pages total)
"""

import json
import sys
from scrapling import Fetcher
from urllib.parse import urljoin

# EXPLICITLY ONLY THIS SITE - NO OTHER URLS
BASE_URL = 'https://fli-rpx.github.io/mindfulness/'

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

print("=" * 70)
print("Content Comparison: English vs Chinese Pages")
print(f"Target site: {BASE_URL}")
print(f"Files to check: {len(file_pairs)} pairs = {len(file_pairs) * 2} pages")
print("=" * 70)

fetcher = Fetcher()
results = []
errors = []

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
        
        # Print summary
        all_match = all(check['match'] for check in comparison['checks'].values())
        
        if all_match:
            print(f"   ✅ Structure matches!")
        else:
            print(f"   ⚠️  Differences found:")
            for check_name, check_data in comparison['checks'].items():
                if not check_data['match']:
                    print(f"      • {check_name}: EN={check_data['en']}, ZH={check_data['zh']}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        errors.append(f"{en_file} vs {zh_file}: {str(e)[:50]}")

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
print(f"✅ Fully matching: {passed}")
print(f"⚠️  Differences found: {failed}")
print(f"❌ Errors: {len(errors)}")

if failed > 0:
    print("\nFiles with structural differences:")
    for r in results:
        if not all(c['match'] for c in r['checks'].values()):
            diffs = [k for k, v in r['checks'].items() if not v['match']]
            print(f"  • {r['file_pair']}: {', '.join(diffs)}")

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
        'results': results,
        'errors': errors
    }, f, indent=2)

print(f"\n📊 Detailed report saved to: {report_file}")
print("\n✅ Content comparison complete!")
print(f"   ONLY scanned: {BASE_URL}")
print(f"   Total pages: {len(file_pairs) * 2}")

sys.exit(0 if failed == 0 and len(errors) == 0 else 1)
