/* Reading Improver web shell */
(function () {
    var STORAGE_KEY = "readingImproverWebV1";
    var SAMPLE_STORIES = {
        morning: "Every morning, Emma walks to the park before breakfast. She listens to the birds and watches the sky change color. The fresh air helps her feel calm and focused for the day.",
        library: "After school, Leo goes to the library to study English. He reads one short story and writes down five new words. Then he practices saying each sentence out loud."
    };

    var state = {
        storyText: "",
        sentences: [],
        currentIndex: 0,
        transcript: "",
        lastScore: null,
        liveScore: null,
        threshold: 70,
        autoAdvance: true,
        showCues: true,
        failedIndexes: {},
        started: false,
        isListening: false,
        shouldIgnoreError: false,
        autoAdvancedThisSentence: false
    };

    var refs = {
        installPanel: byId("install-panel"),
        installStatusText: byId("install-status-text"),
        installSteps: byId("install-steps"),
        copyInstallUrlBtn: byId("copy-install-url-btn"),
        copyInstallUrlNote: byId("copy-install-url-note"),
        setupPanel: byId("setup-panel"),
        practicePanel: byId("practice-panel"),
        storyInput: byId("story-input"),
        sampleSelect: byId("sample-select"),
        thresholdRange: byId("threshold-range"),
        thresholdLabel: byId("threshold-label"),
        autoAdvanceToggle: byId("auto-advance-toggle"),
        showCuesToggle: byId("show-cues-toggle"),
        wordCount: byId("word-count"),
        setupStatus: byId("setup-status"),
        startReadingBtn: byId("start-reading-btn"),
        sentenceProgress: byId("sentence-progress"),
        sentenceList: byId("sentence-list"),
        currentSentenceText: byId("current-sentence-text"),
        intonationCue: byId("intonation-cue"),
        transcriptText: byId("transcript-text"),
        listenToggleBtn: byId("listen-toggle-btn"),
        hearBtn: byId("hear-btn"),
        nextBtn: byId("next-btn"),
        repeatBtn: byId("repeat-btn"),
        liveScoreValue: byId("live-score-value"),
        lastScoreValue: byId("last-score-value"),
        effectiveThresholdValue: byId("effective-threshold-value"),
        practiceStatus: byId("practice-status"),
        newStoryBtn: byId("new-story-btn"),
        apiKeyInput: byId("api-key-input"),
        levelSelect: byId("level-select"),
        topicInput: byId("topic-input"),
        targetWordsInput: byId("target-words-input"),
        lengthRange: byId("length-range"),
        lengthLabel: byId("length-label"),
        generateStoryBtn: byId("generate-story-btn"),
        generatorNote: byId("generator-note")
    };

    var recognition = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function init() {
        hydrateSettings();
        bindEvents();
        updateWordCount();
        updateInstallHint();
        renderSetupControls();
        renderPractice();
    }

    function hydrateSettings() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            refs.apiKeyInput.value = saved.apiKey || "";
            refs.levelSelect.value = saved.level || "A2";
            refs.topicInput.value = saved.topic || "daily life";
            refs.targetWordsInput.value = saved.targetWords || "";
            refs.lengthRange.value = String(saved.length || 140);
            refs.lengthLabel.textContent = refs.lengthRange.value;
            state.threshold = Number(saved.threshold || 70);
            state.autoAdvance = saved.autoAdvance !== false;
            state.showCues = saved.showCues !== false;
            refs.thresholdRange.value = String(state.threshold);
            refs.thresholdLabel.textContent = String(state.threshold);
            refs.autoAdvanceToggle.checked = state.autoAdvance;
            refs.showCuesToggle.checked = state.showCues;
        } catch (_err) {}
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            apiKey: refs.apiKeyInput.value.trim(),
            level: refs.levelSelect.value,
            topic: refs.topicInput.value.trim(),
            targetWords: refs.targetWordsInput.value.trim(),
            length: Number(refs.lengthRange.value),
            threshold: state.threshold,
            autoAdvance: state.autoAdvance,
            showCues: state.showCues
        }));
    }

    function updateInstallHint() {
        if (!refs.installPanel || !refs.installStatusText || !refs.installSteps) return;

        var isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
        var ua = navigator.userAgent || "";
        var isIOS = /iPhone|iPad|iPod/i.test(ua);
        var isMacSafari = /Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);

        if (isStandalone || window.navigator.standalone === true) {
            refs.installStatusText.textContent = "Installed: launch from your Home Screen or Dock.";
            refs.installSteps.innerHTML = "<li>You're all set. Open the app icon directly for the best full-screen experience.</li>";
            return;
        }

        if (isIOS) {
            refs.installStatusText.textContent = "Install on iPhone for one-tap access.";
            refs.installSteps.innerHTML = [
                "<li>Open this page in Safari on iPhone.</li>",
                "<li>Tap Share.</li>",
                "<li>Tap Add to Home Screen, then tap Add.</li>"
            ].join("");
            return;
        }

        if (isMacSafari) {
            refs.installStatusText.textContent = "Install on Mac for app-like launch.";
            refs.installSteps.innerHTML = [
                "<li>In Safari, click Share.</li>",
                "<li>Choose Add to Dock.</li>",
                "<li>Open it from Dock like a standalone app.</li>"
            ].join("");
            return;
        }

        refs.installStatusText.textContent = "For best install support, use Safari.";
        refs.installSteps.innerHTML = [
            "<li>Open this URL in Safari.</li>",
            "<li>Then use Share and install to Home Screen or Dock.</li>"
        ].join("");
    }

    async function copyInstallURL() {
        if (!refs.copyInstallUrlNote) return;
        var url = window.location.origin + window.location.pathname;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                fallbackCopy(url);
            }
            refs.copyInstallUrlNote.textContent = "Install URL copied.";
        } catch (_err) {
            try {
                fallbackCopy(url);
                refs.copyInstallUrlNote.textContent = "Install URL copied.";
            } catch (_fallbackErr) {
                refs.copyInstallUrlNote.textContent = "Copy failed. Please copy from browser address bar.";
            }
        }
    }

    function fallbackCopy(text) {
        var temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(temp);
        if (!ok) {
            throw new Error("execCommand copy failed");
        }
    }

    function bindEvents() {
        refs.storyInput.addEventListener("input", function () {
            state.storyText = refs.storyInput.value;
            updateWordCount();
        });

        refs.sampleSelect.addEventListener("change", function () {
            var selected = refs.sampleSelect.value;
            if (selected && SAMPLE_STORIES[selected]) {
                refs.storyInput.value = SAMPLE_STORIES[selected];
                state.storyText = refs.storyInput.value;
                updateWordCount();
            }
        });

        refs.thresholdRange.addEventListener("input", function () {
            state.threshold = Number(refs.thresholdRange.value);
            refs.thresholdLabel.textContent = String(state.threshold);
            renderPractice();
            saveSettings();
        });

        refs.autoAdvanceToggle.addEventListener("change", function () {
            state.autoAdvance = refs.autoAdvanceToggle.checked;
            saveSettings();
        });

        refs.showCuesToggle.addEventListener("change", function () {
            state.showCues = refs.showCuesToggle.checked;
            renderCurrentSentence();
            saveSettings();
        });

        refs.lengthRange.addEventListener("input", function () {
            refs.lengthLabel.textContent = refs.lengthRange.value;
            saveSettings();
        });

        refs.startReadingBtn.addEventListener("click", startReading);
        refs.listenToggleBtn.addEventListener("click", toggleListening);
        refs.hearBtn.addEventListener("click", function () {
            speakSentence(currentSentence());
        });
        refs.nextBtn.addEventListener("click", function () {
            goToNextSentence(false);
        });
        refs.repeatBtn.addEventListener("click", function () {
            state.transcript = "";
            state.liveScore = null;
            refs.transcriptText.textContent = "Start speaking...";
            beginListening();
        });
        refs.newStoryBtn.addEventListener("click", resetFlow);
        refs.generateStoryBtn.addEventListener("click", generateStory);
        if (refs.copyInstallUrlBtn) {
            refs.copyInstallUrlBtn.addEventListener("click", copyInstallURL);
        }
    }

    function updateWordCount() {
        var count = wordCount(refs.storyInput.value);
        refs.wordCount.textContent = String(count);
        refs.wordCount.style.color = count > 500 ? "#b91c1c" : "inherit";
    }

    function renderSetupControls() {
        refs.thresholdLabel.textContent = String(state.threshold);
        refs.autoAdvanceToggle.checked = state.autoAdvance;
        refs.showCuesToggle.checked = state.showCues;
    }

    function startReading() {
        var text = refs.storyInput.value.trim();
        var count = wordCount(text);
        if (!text) {
            refs.setupStatus.textContent = "Please paste or generate a story first.";
            return;
        }
        if (count > 500) {
            refs.setupStatus.textContent = "Story is too long. Keep it under 500 words.";
            return;
        }

        var sentences = splitSentences(text);
        if (!sentences.length) {
            refs.setupStatus.textContent = "No valid sentence found.";
            return;
        }

        state.storyText = text;
        state.sentences = sentences;
        state.currentIndex = 0;
        state.transcript = "";
        state.lastScore = null;
        state.liveScore = null;
        state.failedIndexes = {};
        state.started = true;
        state.autoAdvancedThisSentence = false;

        refs.setupPanel.classList.add("hidden");
        refs.practicePanel.classList.remove("hidden");
        refs.practiceStatus.textContent = "Mic is ready. Read sentence 1 aloud.";
        renderPractice();
        beginListening();
    }

    function resetFlow() {
        stopListening(true);
        state.started = false;
        state.sentences = [];
        state.currentIndex = 0;
        state.transcript = "";
        state.lastScore = null;
        state.liveScore = null;
        state.failedIndexes = {};
        refs.practicePanel.classList.add("hidden");
        refs.setupPanel.classList.remove("hidden");
        refs.setupStatus.textContent = "Paste or generate a short story to begin.";
    }

    function toggleListening() {
        if (state.isListening) {
            stopListening(true);
            evaluateUsingCurrentTranscript();
            return;
        }
        beginListening();
    }

    function beginListening() {
        var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            refs.practiceStatus.textContent = "Speech recognition is not supported in this browser.";
            return;
        }

        stopListening(true);
        recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        state.shouldIgnoreError = false;
        state.autoAdvancedThisSentence = false;
        state.transcript = "";
        state.liveScore = null;
        refs.transcriptText.textContent = "Start speaking...";
        refs.practiceStatus.textContent = "Listening... read the sentence aloud.";

        recognition.onstart = function () {
            state.isListening = true;
            updateListenButton();
        };

        recognition.onresult = function (event) {
            var full = "";
            for (var i = 0; i < event.results.length; i += 1) {
                full += event.results[i][0].transcript + " ";
            }
            full = full.trim();
            state.transcript = full;
            refs.transcriptText.textContent = full || "Start speaking...";
            evaluateLiveProgress(full);
        };

        recognition.onerror = function (event) {
            if (state.shouldIgnoreError || event.error === "aborted" || event.error === "no-speech") {
                return;
            }
            state.isListening = false;
            updateListenButton();
            refs.practiceStatus.textContent = "Speech recognition failed: " + event.error;
        };

        recognition.onend = function () {
            state.isListening = false;
            updateListenButton();
        };

        try {
            recognition.start();
        } catch (_err) {
            refs.practiceStatus.textContent = "Could not start listening. Tap Start Listening again.";
        }
    }

    function stopListening(suppressError) {
        state.shouldIgnoreError = !!suppressError;
        if (recognition) {
            try {
                recognition.stop();
            } catch (_err) {}
        }
        state.isListening = false;
        updateListenButton();
    }

    function updateListenButton() {
        refs.listenToggleBtn.textContent = state.isListening ? "Stop Listening" : "Start Listening";
    }

    function evaluateUsingCurrentTranscript() {
        var spoken = state.transcript.trim();
        if (!spoken) {
            refs.practiceStatus.textContent = "No speech captured. Please try again.";
            return;
        }
        evaluateAttempt(spoken);
    }

    function evaluateLiveProgress(text) {
        if (!state.autoAdvance || state.autoAdvancedThisSentence || !text.trim()) return;
        var score = sentenceScore(currentSentence(), text);
        var threshold = effectiveThreshold(currentSentence(), state.threshold);
        state.liveScore = score;
        renderScores();

        if (score >= threshold) {
            state.autoAdvancedThisSentence = true;
            state.lastScore = score;
            delete state.failedIndexes[state.currentIndex];
            refs.practiceStatus.textContent = "Passed live threshold. Moving to next sentence...";
            stopListening(true);
            goToNextSentence(true);
        }
    }

    function evaluateAttempt(text) {
        var cleaned = text.trim();
        if (!cleaned) {
            refs.practiceStatus.textContent = "No speech captured. Please try again.";
            return;
        }
        var score = sentenceScore(currentSentence(), cleaned);
        var threshold = effectiveThreshold(currentSentence(), state.threshold);
        state.lastScore = score;
        state.liveScore = score;

        if (score >= threshold) {
            delete state.failedIndexes[state.currentIndex];
            refs.practiceStatus.textContent = "Great. Passed with " + Math.round(score) + "%.";
            if (state.autoAdvance) {
                goToNextSentence(true);
            }
        } else {
            state.failedIndexes[state.currentIndex] = true;
            refs.practiceStatus.textContent = "Score " + Math.round(score) + "% is below " + Math.round(threshold) + "%. Repeat this sentence.";
            speakSentence(currentSentence());
        }

        renderPractice();
    }

    function goToNextSentence(autoStarted) {
        if (state.currentIndex >= state.sentences.length - 1) {
            refs.practiceStatus.textContent = "Finished all sentences. Nice work.";
            stopListening(true);
            return;
        }
        state.currentIndex += 1;
        state.transcript = "";
        state.liveScore = null;
        state.lastScore = null;
        state.autoAdvancedThisSentence = false;
        refs.transcriptText.textContent = "Start speaking...";
        renderPractice();

        if (autoStarted || state.autoAdvance) {
            beginListening();
        }
    }

    function renderPractice() {
        if (!state.started) return;
        refs.sentenceProgress.textContent = "Sentence " + (state.currentIndex + 1) + " of " + state.sentences.length;
        renderSentenceList();
        renderCurrentSentence();
        renderScores();
        refs.nextBtn.disabled = state.currentIndex >= state.sentences.length - 1;
        var threshold = effectiveThreshold(currentSentence(), state.threshold);
        var showRepeat = state.lastScore != null && state.lastScore < threshold;
        refs.repeatBtn.classList.toggle("hidden", !showRepeat);
        updateListenButton();
    }

    function renderSentenceList() {
        var html = state.sentences.map(function (sentence, idx) {
            var classes = ["sentence-item"];
            if (idx === state.currentIndex) classes.push("current");
            if (state.failedIndexes[idx]) classes.push("failed");
            return "<div class=\"" + classes.join(" ") + "\">" + (idx + 1) + ". " + escapeHtml(sentence) + "</div>";
        }).join("");
        refs.sentenceList.innerHTML = html;
    }

    function renderCurrentSentence() {
        var sentence = currentSentence();
        refs.currentSentenceText.innerHTML = styledSentenceHTML(sentence, state.showCues);
        if (state.showCues) {
            var cue = intonationCue(sentence);
            refs.intonationCue.textContent = "Intonation: " + cue.symbol + " " + cue.hint;
            refs.intonationCue.classList.remove("hidden");
        } else {
            refs.intonationCue.classList.add("hidden");
        }
    }

    function renderScores() {
        var threshold = effectiveThreshold(currentSentence(), state.threshold);
        refs.effectiveThresholdValue.textContent = isFinite(threshold) ? Math.round(threshold) + "%" : "--";
        refs.liveScoreValue.textContent = state.liveScore == null ? "--" : Math.round(state.liveScore) + "%";
        refs.lastScoreValue.textContent = state.lastScore == null ? "--" : Math.round(state.lastScore) + "%";
    }

    function currentSentence() {
        return state.sentences[state.currentIndex] || "";
    }

    function splitSentences(text) {
        var cleaned = text.replace(/\s+/g, " ").trim();
        var matches = cleaned.match(/[^.!?]+[.!?]?/g);
        if (!matches) return [];
        return matches.map(function (item) { return item.trim(); }).filter(Boolean);
    }

    function wordCount(text) {
        return (text.trim().match(/\S+/g) || []).length;
    }

    function normalizeTokens(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
            .map(stemToken);
    }

    function stemToken(token) {
        if (token.length > 4 && /ing$/.test(token)) return token.slice(0, -3);
        if (token.length > 3 && /ed$/.test(token)) return token.slice(0, -2);
        if (token.length > 3 && /es$/.test(token)) return token.slice(0, -2);
        if (token.length > 2 && /s$/.test(token)) return token.slice(0, -1);
        return token;
    }

    function sentenceScore(expected, spoken) {
        var expectedTokens = normalizeTokens(expected);
        var spokenTokens = normalizeTokens(spoken);
        if (!expectedTokens.length) return 0;

        var tokenSimilarity = distanceSimilarity(
            levenshtein(expectedTokens, spokenTokens),
            Math.max(expectedTokens.length, spokenTokens.length)
        );

        if (Math.max(expectedTokens.length, spokenTokens.length) <= 3) {
            var expectedChars = expectedTokens.join(" ").split("");
            var spokenChars = spokenTokens.join(" ").split("");
            var charSimilarity = distanceSimilarity(
                levenshtein(expectedChars, spokenChars),
                Math.max(expectedChars.length, spokenChars.length)
            );
            return clamp((tokenSimilarity * 0.6 + charSimilarity * 0.4) * 100, 0, 100);
        }

        return clamp(tokenSimilarity * 100, 0, 100);
    }

    function effectiveThreshold(sentence, base) {
        var count = normalizeTokens(sentence).length;
        var adjustment = 0;
        if (count <= 2) adjustment = 20;
        else if (count === 3) adjustment = 15;
        else if (count === 4) adjustment = 10;
        else if (count === 5) adjustment = 5;
        return Math.max(50, base - adjustment);
    }

    function levenshtein(a, b) {
        var m = a.length;
        var n = b.length;
        if (!m) return n;
        if (!n) return m;

        var dp = Array(m + 1);
        for (var i = 0; i <= m; i += 1) {
            dp[i] = Array(n + 1);
            dp[i][0] = i;
        }
        for (var j = 0; j <= n; j += 1) dp[0][j] = j;

        for (i = 1; i <= m; i += 1) {
            for (j = 1; j <= n; j += 1) {
                var cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }

    function distanceSimilarity(distance, maxLen) {
        if (!maxLen) return 1;
        return 1 - distance / maxLen;
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function speakSentence(text) {
        if (!window.speechSynthesis || !text) return;
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.45;
        window.speechSynthesis.speak(utterance);
    }

    function styledSentenceHTML(sentence, showCues) {
        if (!showCues) return escapeHtml(sentence);
        return sentence.split(/\s+/).map(function (word) {
            var cssClass = isWeakWord(word) ? "weak-word" : "strong-word";
            return "<span class=\"" + cssClass + "\">" + escapeHtml(word) + "</span>";
        }).join(" ");
    }

    function isWeakWord(word) {
        var token = word.toLowerCase().replace(/[^a-z']/g, "");
        var weak = {
            a: 1, an: 1, the: 1, to: 1, of: 1, in: 1, on: 1, at: 1, for: 1, from: 1, with: 1, by: 1,
            and: 1, or: 1, but: 1, so: 1, if: 1, than: 1, as: 1, that: 1, this: 1, these: 1, those: 1,
            is: 1, am: 1, are: 1, was: 1, were: 1, be: 1, been: 1, being: 1, do: 1, does: 1, did: 1,
            have: 1, has: 1, had: 1, will: 1, would: 1, can: 1, could: 1, shall: 1, should: 1,
            i: 1, you: 1, he: 1, she: 1, it: 1, we: 1, they: 1, me: 1, him: 1, her: 1, us: 1, them: 1
        };
        return !!weak[token];
    }

    function intonationCue(sentence) {
        var s = sentence.trim().toLowerCase();
        if (!s) return { symbol: "↘", hint: "Fall at the end (statement)" };
        if (/[?]$/.test(s)) return { symbol: "↗", hint: "Rise at the end (question)" };
        if (/,/.test(s) || /^and |^but /.test(s)) return { symbol: "→", hint: "Keep it connected" };
        return { symbol: "↘", hint: "Fall at the end (statement)" };
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    async function generateStory() {
        var apiKey = refs.apiKeyInput.value.trim();
        if (!apiKey) {
            refs.generatorNote.textContent = "Please enter your Gemini API key.";
            return;
        }

        refs.generateStoryBtn.disabled = true;
        refs.generatorNote.textContent = "Generating story...";
        saveSettings();

        try {
            var level = refs.levelSelect.value;
            var topic = (refs.topicInput.value || "daily life").trim();
            var targetWords = refs.targetWordsInput.value.trim();
            var length = Number(refs.lengthRange.value);
            var wordsLine = targetWords ? ("- Include these words naturally: " + targetWords) : "- Target words: none required";
            var prompt = [
                "Create one short English reading story for language learners.",
                "Requirements:",
                "- CEFR level: " + level,
                "- Topic: " + topic,
                "- Length: approximately " + length + " words, and never above 500 words",
                "- Use clear, short sentences",
                "- Avoid slang and difficult idioms",
                wordsLine,
                "Output only the story text. Do not include headings, explanations, or bullet points."
            ].join("\n");

            var response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(apiKey), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 700 }
                })
            });

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            var data = await response.json();
            var text = (((data || {}).candidates || [])[0] || {}).content;
            var parts = (text && text.parts) || [];
            var story = parts.map(function (part) { return part.text || ""; }).join("\n").trim();
            if (!story) throw new Error("Gemini returned empty story.");

            refs.storyInput.value = story;
            state.storyText = story;
            updateWordCount();
            refs.generatorNote.textContent = "Story ready. Tap Start Reading.";
        } catch (err) {
            refs.generatorNote.textContent = "Generation failed: " + (err && err.message ? err.message : "unknown error");
        } finally {
            refs.generateStoryBtn.disabled = false;
        }
    }

    init();
}());
