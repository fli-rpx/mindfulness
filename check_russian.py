#!/usr/bin/env python3
import os
import json

# List of English files and their Russian counterparts
file_pairs = [
    ("index.html", "index-ru.html"),
    ("emotion-explorer.html", "emotion-explorer-ru.html"),
    ("emotion-balance.html", "emotion-balance-ru.html"),
    ("salad-compass.html", "salad-compass-ru.html"),
    ("salad-check.html", "salad-check-ru.html"),
    ("interventions.html", "interventions-ru.html"),
    ("journal.html", "journal-ru.html"),
    ("learn.html", "learn-ru.html"),
    ("progress.html", "progress-ru.html"),
    ("cycle.html", "cycle-ru.html"),
    ("assessment.html", "assessment-ru.html"),
    ("hypnosis.html", "hypnosis-ru.html")
]

base_path = "/root/.openclaw/workspace/mindfulness"
total = len(file_pairs)
existing = 0
missing = []

for english, russian in file_pairs:
    russian_path = os.path.join(base_path, russian)
    if os.path.exists(russian_path):
        existing += 1
    else:
        missing.append(russian)

# Output results
print(f"Russian Version Check: {existing}/{total} files exist")
if missing:
    print(f"Missing files: {', '.join(missing)}")
else:
    print("All Russian versions exist!")
