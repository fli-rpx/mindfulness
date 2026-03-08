#!/usr/bin/env python3
import re
import os

# Translation dictionary for common UI terms (English to Russian)
translations = {
    # Navigation
    'Home': 'Главная',
    'Cycle': 'Цикл', 
    'AI Chat': 'ИИ Чат',
    'Tools': 'Инструменты',
    'Journal': 'Журнал',
    'Progress': 'Прогресс',
    'Learn': 'Обучение',
    
    # Tool names
    'Emotion Explorer': 'Исследователь Эмоций',
    'Emotion Balance': 'Баланс Эмоций',
    'Salad Compass': 'Компас Салата',
    'Full Salad Check': 'Полная Проверка Салата',
    'Interventions': 'Вмешательства',
    
    # Brand/Header
    'Mindfulness Therapy': 'Терапия Осознанности',
    
    # UI Labels
    'English': 'Английский',
    'Your personal emotional navigation tool': 'Ваш личный инструмент навигации по эмоциям',
    'Take the Full Salad Check': 'Пройти Полную Проверку Салата',
    'All rights reserved': 'Все права защищены',
    
    # Common buttons/actions
    'Start': 'Начать',
    'Submit': 'Отправить',
    'Cancel': 'Отмена',
    'Save': 'Сохранить',
    'Next': 'Далее',
    'Previous': 'Назад',
    'Back': 'Назад',
    'Continue': 'Продолжить',
    'Close': 'Закрыть',
    'Open': 'Открыть',
    'Loading': 'Загрузка',
    'Error': 'Ошибка',
    'Success': 'Успех',
    'Warning': 'Предупреждение',
    'Info': 'Информация',
    
    # Common phrases
    'Welcome': 'Добро пожаловать',
    'Hello': 'Здравствуйте',
    'Thank you': 'Спасибо',
    'Please': 'Пожалуйста',
    'Click here': 'Нажмите здесь',
    'Learn more': 'Узнать больше',
    'Read more': 'Читать далее',
    'Get started': 'Начать',
    'Sign in': 'Войти',
    'Sign up': 'Зарегистрироваться',
    'Log out': 'Выйти',
    'Profile': 'Профиль',
    'Settings': 'Настройки',
    'Help': 'Помощь',
    'Support': 'Поддержка',
    'Contact': 'Контакты',
    'About': 'О нас',
    'Privacy': 'Конфиденциальность',
    'Terms': 'Условия',
    'Cookie': 'Cookie',
}

russian_files = [
    "index-ru.html", "emotion-explorer-ru.html", "emotion-balance-ru.html",
    "salad-compass-ru.html", "salad-check-ru.html", "interventions-ru.html",
    "journal-ru.html", "learn-ru.html", "progress-ru.html", "cycle-ru.html",
    "assessment-ru.html", "hypnosis-ru.html"
]

base_path = "/root/.openclaw/workspace/mindfulness"
fixes = []
total_files_checked = 0
total_translations = 0

for filename in russian_files:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
    
    total_files_checked += 1
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    file_fixes = []
    
    # Apply translations
    for english, russian in translations.items():
        # Match whole words/phrases
        pattern = r'(?<![a-zA-Z])' + re.escape(english) + r'(?![a-zA-Z])'
        if re.search(pattern, content):
            content = re.sub(pattern, russian, content)
            file_fixes.append(f"'{english}' → '{russian}'")
            total_translations += 1
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fixes.append(f"{filename}: {', '.join(file_fixes)}")

# Output results
print(f"Checked {total_files_checked} Russian files")
if fixes:
    print(f"Made {total_translations} translations in {len(fixes)} files:")
    for fix in fixes:
        print(f"  {fix}")
else:
    print("No English content found. All files are already in Russian.")
