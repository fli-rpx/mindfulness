#!/usr/bin/env python3
import re
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self.skip_tags = {'script', 'style', 'meta', 'link'}
        self.current_tag = None
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        
    def handle_endtag(self, tag):
        self.current_tag = None
        
    def handle_data(self, data):
        if self.current_tag not in self.skip_tags:
            text = data.strip()
            if text and len(text) > 2:
                # Check if it's mostly English (contains English words)
                if re.search(r'[a-zA-Z]{3,}', text):
                    self.texts.append(text)

files = ['index-zh.html', 'emotion-explorer-zh.html', 'emotion-balance-zh.html', 
         'salad-compass-zh.html', 'salad-check-zh.html', 'interventions-zh.html',
         'journal-zh.html', 'learn-zh.html', 'progress-zh.html', 'cycle-zh.html',
         'assessment-zh.html', 'hypnosis-zh.html']

for filename in files:
    print(f"\n=== {filename} ===")
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove CSS/JS blocks
        content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)
        content = re.sub(r'<script>.*?</script>', '', content, flags=re.DOTALL)
        
        parser = TextExtractor()
        parser.feed(content)
        
        for text in parser.texts[:15]:  # Show first 15
            print(f"  - {text[:80]}")
    except Exception as e:
        print(f"  Error: {e}")
