#!/usr/bin/env python3
import re
import os
from html.parser import HTMLParser

# Translation dictionary for common UI terms
translations = {
    # Navigation
    'Home': '首页',
    'Cycle': '周期', 
    'AI Chat': 'AI对话',
    'Tools': '工具',
    'Journal': '日记',
    'Progress': '进度',
    'Learn': '学习',
    
    # Tool names
    'Emotion Explorer': '情绪探索器',
    'Emotion Balance': '情绪平衡',
    'Salad Compass': '沙拉罗盘',
    'Full Salad Check': '完整沙拉检查',
    'Interventions': '干预措施',
    
    # Brand/Header
    'Mindfulness Therapy': '正念疗法',
    
    # UI Labels
    'English': '英语',
    'Your personal emotional navigation tool': '您的个人情绪导航工具',
    'Take the Full Salad Check': '进行完整沙拉检查',
    'All rights reserved': '保留所有权利',
    
    # Common buttons/actions
    'Start': '开始',
    'Submit': '提交',
    'Cancel': '取消',
    'Save': '保存',
    'Next': '下一步',
    'Previous': '上一步',
    'Back': '返回',
    'Continue': '继续',
    'Close': '关闭',
    'Open': '打开',
    'Loading': '加载中',
    'Error': '错误',
    'Success': '成功',
    'Warning': '警告',
    'Info': '信息',
    
    # Common phrases
    'Welcome': '欢迎',
    'Hello': '你好',
    'Thank you': '谢谢',
    'Please': '请',
    'Click here': '点击这里',
    'Learn more': '了解更多',
    'Read more': '阅读更多',
    'Get started': '开始使用',
    'Sign in': '登录',
    'Sign up': '注册',
    'Log out': '退出',
    'Profile': '个人资料',
    'Settings': '设置',
    'Help': '帮助',
    'Support': '支持',
    'Contact': '联系',
    'About': '关于',
    'Privacy': '隐私',
    'Terms': '条款',
    'Cookie': 'Cookie',
}

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self.skip_tags = {'script', 'style', 'meta', 'link', 'code'}
        self.current_tag = None
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        
    def handle_endtag(self, tag):
        self.current_tag = None
        
    def handle_data(self, data):
        if self.current_tag not in self.skip_tags:
            text = data.strip()
            if text and len(text) > 1:
                self.texts.append(text)

chinese_files = [
    "index-zh.html", "emotion-explorer-zh.html", "emotion-balance-zh.html",
    "salad-compass-zh.html", "salad-check-zh.html", "interventions-zh.html",
    "journal-zh.html", "learn-zh.html", "progress-zh.html", "cycle-zh.html",
    "assessment-zh.html", "hypnosis-zh.html"
]

base_path = "/root/.openclaw/workspace/mindfulness"
fixes = []
total_files_checked = 0
total_translations = 0

for filename in chinese_files:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
    
    total_files_checked += 1
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    file_fixes = []
    
    # Apply translations
    for english, chinese in translations.items():
        # Match whole words/phrases, case sensitive for some
        pattern = r'(?<![a-zA-Z])' + re.escape(english) + r'(?![a-zA-Z])'
        if re.search(pattern, content):
            content = re.sub(pattern, chinese, content)
            file_fixes.append(f"'{english}' → '{chinese}'")
            total_translations += 1
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fixes.append(f"{filename}: {', '.join(file_fixes)}")

# Output results
print(f"Checked {total_files_checked} Chinese files")
if fixes:
    print(f"Made {total_translations} translations in {len(fixes)} files:")
    for fix in fixes:
        print(f"  {fix}")
else:
    print("No English content found. All files are already in Chinese.")
