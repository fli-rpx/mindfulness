#!/usr/bin/env python3
"""
Russian Content Check & Fix using Scrapling
Compares EN vs RU structure and fixes mismatches
"""

import os
import re
from scrapling import Fetcher, Selector
from urllib.parse import urljoin

BASE_URL = 'https://fli-rpx.github.io/mindfulness/'
LOCAL_PATH = '/root/.openclaw/workspace/mindfulness'

# Translation dictionary
translations = {
    'Home': 'Главная', 'Cycle': 'Цикл', 'AI Chat': 'ИИ Чат', 'Tools': 'Инструменты',
    'Journal': 'Журнал', 'Progress': 'Прогресс', 'Learn': 'Обучение',
    'Emotion Explorer': 'Исследователь Эмоций', 'Emotion Balance': 'Баланс Эмоций',
    'Salad Compass': 'Компас Салата', 'Full Salad Check': 'Полная Проверка Салата',
    'Interventions': 'Вмешательства', 'Mindfulness Therapy': 'Терапия Осознанности',
    'Start': 'Начать', 'Submit': 'Отправить', 'Cancel': 'Отмена', 'Save': 'Сохранить',
    'Next': 'Далее', 'Back': 'Назад', 'Loading': 'Загрузка', 'Welcome': 'Добро пожаловать',
    'English': 'Английский', 'Your personal emotional navigation tool': 'Ваш личный инструмент навигации по эмоциям',
}

pairs = [
    ('index.html', 'index-ru.html'),
    ('emotion-explorer.html', 'emotion-explorer-ru.html'),
    ('emotion-balance.html', 'emotion-balance-ru.html'),
    ('salad-compass.html', 'salad-compass-ru.html'),
    ('salad-check.html', 'salad-check-ru.html'),
    ('interventions.html', 'interventions-ru.html'),
    ('journal.html', 'journal-ru.html'),
    ('learn.html', 'learn-ru.html'),
    ('progress.html', 'progress-ru.html'),
    ('cycle.html', 'cycle-ru.html'),
    ('assessment.html', 'assessment-ru.html'),
    ('hypnosis.html', 'hypnosis-ru.html'),
]

fetcher = Fetcher()
results = []
files_fixed = []

print("Russian Content Check & Fix (Scrapling)")
print("=" * 60)

for en_file, ru_file in pairs:
    try:
        # Fetch both versions from live site
        en_url = urljoin(BASE_URL, en_file)
        ru_url = urljoin(BASE_URL, ru_file)
        
        print(f"\n📄 Checking {en_file} vs {ru_file}...")
        
        en_page = fetcher.get(en_url, timeout=15)
        ru_page = fetcher.get(ru_url, timeout=15)
        
        # Check structure
        en_h2 = len(en_page.css('h2').getall())
        ru_h2 = len(ru_page.css('h2').getall())
        en_h3 = len(en_page.css('h3').getall())
        ru_h3 = len(ru_page.css('h3').getall())
        
        structure_match = (en_h2 == ru_h2 and en_h3 == ru_h3)
        
        if structure_match:
            print(f"  ✓ Structure matches (h2:{en_h2}, h3:{en_h3})")
            results.append({'file': ru_file, 'status': 'ok'})
        else:
            print(f"  ✗ Structure mismatch! EN: h2={en_h2},h3={en_h3} | RU: h2={ru_h2},h3={ru_h3}")
            print(f"  🔧 Fixing {ru_file}...")
            
            # Get English content
            en_html = en_page.text
            
            # Apply translations
            ru_html = en_html
            for eng, rus in translations.items():
                pattern = r'(?<![a-zA-Z])' + re.escape(eng) + r'(?![a-zA-Z])'
                ru_html = re.sub(pattern, rus, ru_html)
            
            # Update language and links
            ru_html = ru_html.replace('lang="en"', 'lang="ru"')
            ru_html = ru_html.replace('href="index.html"', 'href="index-ru.html"')
            ru_html = ru_html.replace('href="cycle.html"', 'href="cycle-ru.html"')
            ru_html = ru_html.replace('href="assessment.html"', 'href="assessment-ru.html"')
            ru_html = ru_html.replace('href="journal.html"', 'href="journal-ru.html"')
            ru_html = ru_html.replace('href="progress.html"', 'href="progress-ru.html"')
            ru_html = ru_html.replace('href="learn.html"', 'href="learn-ru.html"')
            ru_html = ru_html.replace('href="emotion-explorer.html"', 'href="emotion-explorer-ru.html"')
            ru_html = ru_html.replace('href="emotion-balance.html"', 'href="emotion-balance-ru.html"')
            ru_html = ru_html.replace('href="hypnosis.html"', 'href="hypnosis-ru.html"')
            ru_html = ru_html.replace('href="salad-compass.html"', 'href="salad-compass-ru.html"')
            ru_html = ru_html.replace('href="salad-check.html"', 'href="salad-check-ru.html"')
            ru_html = ru_html.replace('href="interventions.html"', 'href="interventions-ru.html"')
            ru_html = ru_html.replace('-ru-ru.html', '-ru.html')  # Fix double replacement
            
            # Save fixed file
            filepath = os.path.join(LOCAL_PATH, ru_file)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(ru_html)
            
            files_fixed.append(ru_file)
            results.append({'file': ru_file, 'status': 'fixed'})
            print(f"  ✅ Fixed and saved {ru_file}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        results.append({'file': ru_file, 'status': 'error', 'error': str(e)})

# Summary
print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")

total = len(pairs)
ok = sum(1 for r in results if r['status'] == 'ok')
fixed = len(files_fixed)
errors = sum(1 for r in results if r['status'] == 'error')

print(f"Total pairs checked: {total}")
print(f"✅ Already matching: {ok}")
print(f"🔧 Fixed: {fixed}")
print(f"❌ Errors: {errors}")

if files_fixed:
    print(f"\nFiles fixed:")
    for f in files_fixed:
        print(f"  • {f}")
    
    # Commit and push changes
    print("\n📦 Committing and pushing changes...")
    import subprocess
    try:
        os.chdir(LOCAL_PATH)
        subprocess.run(['git', 'add', '*.html'], check=True)
        subprocess.run(['git', 'commit', '-m', 'Auto-fix: Update Russian files to match English structure'], check=True)
        subprocess.run(['git', 'push', 'origin', 'main'], check=True)
        print("✅ Changes committed and pushed to GitHub!")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git operation failed: {e}")
else:
    print("\n✅ No fixes needed. All Russian files match English structure.")
