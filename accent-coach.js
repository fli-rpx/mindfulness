/* Accent Coach v2 */
(function () {
    var locale = (document.documentElement.lang || "en").toLowerCase();
    if (locale.indexOf("zh") === 0) locale = "zh";
    else if (locale.indexOf("ru") === 0) locale = "ru";
    else locale = "en";

    var I18N = {
        en: {
            noAttempt: "No attempt yet.",
            recording: "Recording...",
            micDenied: "Microphone permission denied. Please allow microphone access.",
            listening: "Listening... say the target sentence now.",
            noTranscript: "No transcript captured.",
            recognitionError: "Could not analyze speech. Try again in a quieter environment.",
            analyzing: "Analyzing...",
            tipStart: "Start with one drill and repeat until you can say it smoothly.",
            chooseWord: "Listen and choose the word you heard.",
            pairStart: "Press \"Play Pair Challenge\" to start.",
            pairCorrect: "Correct. Great ear training.",
            pairWrong: "Not quite. Correct answer:",
            engineGood: "Best results: use headphones and speak in a quiet room.",
            engineNoRecord: "Recording is not supported in this browser.",
            engineInsecure: "Microphone requires a secure context (HTTPS or localhost).",
            engineNoSpeech: "Speech recognition is not supported here (try Chrome).",
            engineStarting: "Requesting microphone access...",
            micNotFound: "No microphone device found.",
            micBusy: "Microphone is busy in another app/tab.",
            micSecurity: "Microphone blocked by browser security settings.",
            streakDays: "days",
            planToday: "Today's plan",
            lessonDone: "Done",
            waveTitle: "Waveform",
            pitchTitle: "Pitch contour (F0)"
        },
        zh: {
            noAttempt: "尚未开始练习。",
            recording: "正在录音...",
            micDenied: "麦克风权限被拒绝，请允许访问麦克风。",
            listening: "正在聆听... 请现在朗读目标句子。",
            noTranscript: "未捕获到转写内容。",
            recognitionError: "语音分析失败，请在更安静的环境重试。",
            analyzing: "分析中...",
            tipStart: "先固定一个句子，连续重复到流畅为止。",
            chooseWord: "请听音并选择你听到的单词。",
            pairStart: "点击“播放最小对立挑战”开始。",
            pairCorrect: "正确，听辨很棒。",
            pairWrong: "不完全正确。正确答案：",
            engineGood: "建议使用耳机，并在安静环境中练习。",
            engineNoRecord: "当前浏览器不支持录音。",
            engineInsecure: "麦克风需要安全上下文（HTTPS 或 localhost）。",
            engineNoSpeech: "当前浏览器不支持语音识别（建议使用 Chrome）。",
            engineStarting: "正在请求麦克风权限...",
            micNotFound: "未检测到麦克风设备。",
            micBusy: "麦克风正被其他应用或标签页占用。",
            micSecurity: "浏览器安全策略阻止了麦克风访问。",
            streakDays: "天",
            planToday: "今日计划",
            lessonDone: "已完成",
            waveTitle: "波形图",
            pitchTitle: "音高轮廓 (F0)"
        },
        ru: {
            noAttempt: "Пока нет попыток.",
            recording: "Идет запись...",
            micDenied: "Доступ к микрофону отклонен. Разрешите доступ к микрофону.",
            listening: "Слушаю... произнесите целевое предложение.",
            noTranscript: "Текст распознать не удалось.",
            recognitionError: "Не удалось проанализировать речь. Попробуйте в более тихой обстановке.",
            analyzing: "Анализ...",
            tipStart: "Выберите одну фразу и повторяйте ее до плавного произношения.",
            chooseWord: "Прослушайте и выберите слово, которое услышали.",
            pairStart: "Нажмите «Минимальные пары», чтобы начать.",
            pairCorrect: "Верно. Отличная тренировка слуха.",
            pairWrong: "Не совсем. Правильный ответ:",
            engineGood: "Лучше всего: наушники и тихая обстановка.",
            engineNoRecord: "Запись не поддерживается в этом браузере.",
            engineInsecure: "Для микрофона нужен безопасный контекст (HTTPS или localhost).",
            engineNoSpeech: "Распознавание речи не поддерживается (попробуйте Chrome).",
            engineStarting: "Запрашивается доступ к микрофону...",
            micNotFound: "Микрофон не найден.",
            micBusy: "Микрофон занят в другом приложении/вкладке.",
            micSecurity: "Доступ к микрофону заблокирован настройками безопасности браузера.",
            streakDays: "дней",
            planToday: "План на сегодня",
            lessonDone: "Выполнено",
            waveTitle: "Волновая форма",
            pitchTitle: "Контур высоты (F0)"
        }
    };
    var T = I18N[locale];

    var drills = [
        {
            label: locale === "zh" ? "TH + 节奏" : (locale === "ru" ? "TH + ритм" : "TH + rhythm"),
            sentence: "I think this weather is getting better every Thursday.",
            focus: locale === "zh" ? ["TH 发音", "重音", "连读"] : (locale === "ru" ? ["звук TH", "ударение", "связная речь"] : ["TH sound", "word stress", "connected speech"]),
            ipa: "/aɪ θɪŋk ðɪs ˈwɛðər ɪz ˈɡɛtɪŋ ˈbɛtər ˈɛvri ˈθɝzdeɪ/",
            phonemes: [
                { symbol: "/θ/", patterns: ["th"] },
                { symbol: "/ð/", patterns: ["this", "weather"] },
                { symbol: "/ɝ/", patterns: ["thursday", "better"] }
            ]
        },
        {
            label: locale === "zh" ? "R/L 对比" : (locale === "ru" ? "контраст R/L" : "R / L contrast"),
            sentence: "Please bring the red ruler and the blue glass.",
            focus: locale === "zh" ? ["R/L 清晰度", "词尾辅音", "慢速精读"] : (locale === "ru" ? ["четкость R/L", "конечные согласные", "медленная точность"] : ["R/L clarity", "ending consonants", "slow precision"]),
            ipa: "/pliz brɪŋ ðə rɛd ˈrulər ænd ðə blu ɡlæs/",
            phonemes: [
                { symbol: "/r/", patterns: ["red", "ruler", "bring"] },
                { symbol: "/l/", patterns: ["please", "blue", "glass"] }
            ]
        },
        {
            label: locale === "zh" ? "V/W 对比" : (locale === "ru" ? "контраст V/W" : "V / W contrast"),
            sentence: "We will visit the village this weekend.",
            focus: locale === "zh" ? ["V/W 对比", "唇形", "速度"] : (locale === "ru" ? ["контраст V/W", "форма губ", "темп"] : ["V/W contrast", "lip shape", "smooth pacing"]),
            ipa: "/wi wɪl ˈvɪzɪt ðə ˈvɪlɪdʒ ðɪs ˈwikˌɛnd/",
            phonemes: [
                { symbol: "/v/", patterns: ["visit", "village"] },
                { symbol: "/w/", patterns: ["we", "will", "weekend"] }
            ]
        },
        {
            label: locale === "zh" ? "语调问句" : (locale === "ru" ? "интонация вопроса" : "Intonation"),
            sentence: "Could you tell me where the nearest station is?",
            focus: locale === "zh" ? ["问句旋律", "气息", "分组停顿"] : (locale === "ru" ? ["мелодика вопроса", "дыхание", "паузы"] : ["rising/falling tone", "question melody", "breath control"]),
            ipa: "/kʊd ju tɛl mi wɛr ðə ˈnɪrɪst ˈsteɪʃən ɪz/",
            phonemes: [
                { symbol: "/ʃ/", patterns: ["station"] },
                { symbol: "/ɪr/", patterns: ["nearest"] }
            ]
        },
        {
            label: locale === "zh" ? "连读流畅度" : (locale === "ru" ? "связность фразы" : "Sentence linking"),
            sentence: "I want to ask about an easier way to improve my accent.",
            focus: locale === "zh" ? ["连读", "弱读元音", "自然节奏"] : (locale === "ru" ? ["связность", "редукция гласных", "естественный ритм"] : ["linking words", "reduced vowels", "natural flow"]),
            ipa: "/aɪ wɑnt tə æsk əˈbaʊt ən ˈizjər weɪ tə ɪmˈpruv maɪ ˈækˌsɛnt/",
            phonemes: [
                { symbol: "/ə/", patterns: ["to", "about", "an"] },
                { symbol: "/æ/", patterns: ["ask", "accent"] }
            ]
        }
    ];

    var minimalPairs = [
        ["ship", "sheep"], ["live", "leave"], ["rice", "lice"],
        ["west", "vest"], ["think", "sink"], ["fan", "van"]
    ];

    var STORAGE_KEY = "accentCoachProgressV2";
    var progress = loadProgress();

    var currentDrillIndex = 0;
    var mediaRecorder = null;
    var mediaRecorderMimeType = "";
    var recordingMode = "";
    var activeStream = null;
    var fallbackAudioCtx = null;
    var fallbackSource = null;
    var fallbackProcessor = null;
    var fallbackChunks = [];
    var audioChunks = [];
    var recordedAudioUrl = null;
    var recordedAudioBlob = null;
    var recordingStartMs = 0;
    var lastRecordingDurationSec = 0;
    var lastAudioBuffer = null;

    var currentPair = null;
    var pairAnswer = null;

    var drillGrid = document.getElementById("drill-grid");
    var targetSentence = document.getElementById("target-sentence");
    var focusChips = document.getElementById("focus-chips");
    var ipaTarget = document.getElementById("ipa-target");
    var phonemeGrid = document.getElementById("phoneme-grid");
    var scoreMatch = document.getElementById("score-match");
    var scorePace = document.getElementById("score-pace");
    var scoreGrade = document.getElementById("score-grade");
    var scorePhoneme = document.getElementById("score-phoneme");
    var transcriptOutput = document.getElementById("transcript-output");
    var tipList = document.getElementById("tip-list");
    var engineNote = document.getElementById("engine-note");
    var lessonList = document.getElementById("lesson-list");
    var planDate = document.getElementById("plan-date");
    var debugLogEl = document.getElementById("debug-log");
    var clearDebugBtn = document.getElementById("clear-debug-btn");

    var waveCanvas = document.getElementById("wave-canvas");
    var pitchCanvas = document.getElementById("pitch-canvas");

    var startBtn = document.getElementById("start-record-btn");
    var stopBtn = document.getElementById("stop-record-btn");
    var playBtn = document.getElementById("play-recording-btn");
    var analyzeBtn = document.getElementById("analyze-btn");
    var playReferenceBtn = document.getElementById("play-reference-btn");

    var playPairBtn = document.getElementById("play-pair-btn");
    var pairOptionA = document.getElementById("pair-option-a");
    var pairOptionB = document.getElementById("pair-option-b");
    var pairResult = document.getElementById("pair-result");

    function init() {
        logDebug("init() start");
        localizeDynamicLabels();
        renderDrills();
        selectDrill(0);
        updateProgressUI();
        renderDailyPlan();
        wireEvents();
        renderEngineAvailability();
        transcriptOutput.textContent = T.noAttempt;
        pairResult.textContent = T.pairStart;
        tipList.innerHTML = "<li>" + T.tipStart + "</li>";
        logDebug("init() complete");
    }

    function localizeDynamicLabels() {
        var waveTitle = document.getElementById("wave-title");
        var pitchTitle = document.getElementById("pitch-title");
        var planDateLabel = document.getElementById("plan-date-label");
        if (waveTitle) waveTitle.textContent = T.waveTitle;
        if (pitchTitle) pitchTitle.textContent = T.pitchTitle;
        if (planDateLabel) planDateLabel.textContent = T.planToday + ":";
    }

    function wireEvents() {
        if (clearDebugBtn) {
            clearDebugBtn.addEventListener("click", function () {
                if (debugLogEl) debugLogEl.textContent = "(cleared)";
            });
        }
        playReferenceBtn.addEventListener("click", function () {
            logDebug("play-reference clicked");
            speakText(drills[currentDrillIndex].sentence, "en-US", 0.95);
        });
        startBtn.addEventListener("click", function () {
            logDebug("start-record clicked");
            startRecording();
        });
        stopBtn.addEventListener("click", function () {
            logDebug("stop-record clicked");
            stopRecording();
        });
        playBtn.addEventListener("click", function () {
            logDebug("play-recording clicked");
            playRecording();
        });
        analyzeBtn.addEventListener("click", function () {
            logDebug("analyze clicked");
            analyzePronunciation();
        });
        playPairBtn.addEventListener("click", function () {
            logDebug("play-pair clicked");
            newPairChallenge();
        });
        pairOptionA.addEventListener("click", function () { answerPair(pairOptionA.textContent); });
        pairOptionB.addEventListener("click", function () { answerPair(pairOptionB.textContent); });
        logDebug("event listeners attached");
    }

    function renderDrills() {
        drillGrid.innerHTML = "";
        drills.forEach(function (drill, index) {
            var btn = document.createElement("button");
            btn.className = "drill-btn";
            btn.type = "button";
            btn.innerHTML = "<strong>" + drill.label + "</strong><span>" + drill.sentence + "</span>";
            btn.addEventListener("click", function () { selectDrill(index); });
            drillGrid.appendChild(btn);
        });
    }

    function selectDrill(index) {
        currentDrillIndex = index;
        var drill = drills[index];
        targetSentence.textContent = drill.sentence;
        ipaTarget.textContent = drill.ipa;
        focusChips.innerHTML = drill.focus.map(function (f) { return "<span class=\"focus-chip\">" + f + "</span>"; }).join("");
        renderPhonemeCards(drill.phonemes, {});
        Array.prototype.forEach.call(drillGrid.children, function (node, i) {
            node.classList.toggle("active", i === index);
        });
    }

    function renderPhonemeCards(phonemes, diagnostics) {
        phonemeGrid.innerHTML = phonemes.map(function (p) {
            var ok = diagnostics[p.symbol];
            var statusClass = ok == null ? "" : (ok ? "good" : "missed");
            var statusText = ok == null ? "" : (ok ? " OK" : " Missed");
            return "<div class=\"phoneme-card " + statusClass + "\"><strong>" + p.symbol + "</strong><div>" + statusText + "</div></div>";
        }).join("");
    }

    function renderEngineAvailability() {
        var hasMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        var hasMediaRecorder = !!window.MediaRecorder;
        var hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        logDebug("engine check: secure=" + window.isSecureContext + ", hasMicAPI=" + hasMic + ", hasMediaRecorder=" + hasMediaRecorder + ", hasSpeech=" + hasSpeech);
        var parts = [];
        if (!window.isSecureContext) {
            parts.push(T.engineInsecure);
        }
        if (!hasMic) {
            parts.push(T.engineNoRecord);
            startBtn.disabled = true;
        } else if (!hasMediaRecorder) {
            // Keep recording available using Web Audio fallback.
            parts.push((locale === "zh")
                ? "当前浏览器不支持 MediaRecorder，已启用兼容录音模式。"
                : (locale === "ru")
                    ? "MediaRecorder недоступен, используется совместимый режим записи."
                    : "MediaRecorder unavailable; using compatibility recording mode.");
        }
        if (!hasSpeech) { parts.push(T.engineNoSpeech); analyzeBtn.disabled = true; }
        engineNote.textContent = parts.length ? parts.join(" ") : T.engineGood;
    }

    function startRecording() {
        logDebug("startRecording() called");
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return;
        transcriptOutput.textContent = T.engineStarting;
        logDebug("requesting getUserMedia...");
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                logDebug("getUserMedia granted");
                activeStream = stream;
                audioChunks = [];
                recordingStartMs = Date.now();
                startBtn.disabled = true;
                stopBtn.disabled = false;
                transcriptOutput.textContent = T.recording;

                if (window.MediaRecorder) {
                    recordingMode = "mediarecorder";
                    try {
                        var recorderOptions = getRecorderOptions();
                        mediaRecorder = recorderOptions
                            ? new MediaRecorder(stream, recorderOptions)
                            : new MediaRecorder(stream);
                        mediaRecorderMimeType = mediaRecorder.mimeType || (recorderOptions && recorderOptions.mimeType) || "";
                        logDebug("MediaRecorder created");
                        logDebug("MediaRecorder mimeType=" + (mediaRecorderMimeType || "unknown"));
                    } catch (err) {
                        // Some Chrome profiles/extensions can break MediaRecorder init.
                        logDebug("MediaRecorder init failed; switching to fallback: " + (err && err.name ? err.name : "unknown"));
                        recordingMode = "fallback";
                        startFallbackRecorder(stream);
                        return;
                    }

                    mediaRecorder.ondataavailable = function (event) {
                        if (event.data && event.data.size > 0) audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = function () {
                        var blobType = mediaRecorderMimeType || "audio/webm";
                        var blob = new Blob(audioChunks, { type: blobType });
                        logDebug("onstop blob type=" + blobType + ", chunks=" + audioChunks.length);
                        finalizeRecording(blob);
                    };

                    mediaRecorder.start();
                    logDebug("MediaRecorder started");
                } else {
                    recordingMode = "fallback";
                    logDebug("MediaRecorder unavailable; using fallback");
                    startFallbackRecorder(stream);
                }
            })
            .catch(function (err) {
                var msg = T.micDenied;
                if (err && err.name === "NotFoundError") msg = T.micNotFound;
                else if (err && (err.name === "NotReadableError" || err.name === "TrackStartError")) msg = T.micBusy;
                else if (err && (err.name === "SecurityError" || err.name === "NotSupportedError")) msg = T.micSecurity;
                transcriptOutput.textContent = msg;
                logDebug("getUserMedia error: " + (err && err.name ? err.name : "unknown") + " - " + (err && err.message ? err.message : ""));
                if (window.console && console.error) console.error("startRecording error:", err);
            });
    }

    function stopRecording() {
        logDebug("stopRecording() mode=" + recordingMode);
        if (recordingMode === "mediarecorder" && mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            startBtn.disabled = false;
            stopBtn.disabled = true;
            return;
        }
        if (recordingMode === "fallback") {
            stopFallbackRecorder();
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    function playRecording() {
        if (!recordedAudioUrl) {
            logDebug("playRecording: no recording URL");
            return;
        }

        var audio = playRecording._audio;
        if (!audio) {
            audio = new Audio();
            playRecording._audio = audio;
        }

        audio.pause();
        audio.src = recordedAudioUrl;
        audio.load();

        var canPlay = "";
        if (recordedAudioBlob && recordedAudioBlob.type && audio.canPlayType) {
            canPlay = audio.canPlayType(recordedAudioBlob.type);
        }
        logDebug("playRecording: blobType=" + (recordedAudioBlob ? recordedAudioBlob.type : "unknown") + ", canPlayType=" + (canPlay || "no"));

        var playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(function () {
                logDebug("playRecording: playback started");
            }).catch(function (err) {
                logDebug("playRecording error: " + (err && err.name ? err.name : "unknown") + " - " + (err && err.message ? err.message : ""));
                transcriptOutput.textContent = (locale === "zh")
                    ? "录音已生成，但浏览器无法播放该音频格式。请再录一次或切换浏览器。"
                    : (locale === "ru")
                        ? "Запись создана, но браузер не может воспроизвести этот формат. Попробуйте записать снова."
                        : "Recording exists, but this audio format could not be played. Try recording again.";
            });
        }
    }

    function decodeAndDrawAudio(blob) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx = new AudioCtx();
        blob.arrayBuffer()
            .then(function (arr) { return ctx.decodeAudioData(arr); })
            .then(function (audioBuffer) {
                lastAudioBuffer = audioBuffer;
                drawWaveform(audioBuffer, waveCanvas);
                drawPitchContour(audioBuffer, pitchCanvas);
            })
            .catch(function () {});
    }

    function finalizeRecording(blob) {
        logDebug("finalizeRecording() blob size=" + (blob ? blob.size : 0));
        lastRecordingDurationSec = Math.max(1, Math.round((Date.now() - recordingStartMs) / 1000));
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        recordedAudioBlob = blob;
        recordedAudioUrl = URL.createObjectURL(blob);
        playBtn.disabled = false;
        decodeAndDrawAudio(blob);

        if (activeStream) {
            activeStream.getTracks().forEach(function (track) { track.stop(); });
            activeStream = null;
        }
        logDebug("recording finalized; play enabled");
    }

    function startFallbackRecorder(stream) {
        logDebug("startFallbackRecorder()");
        fallbackChunks = [];
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            transcriptOutput.textContent = (locale === "zh")
                ? "当前浏览器不支持音频上下文，无法录音。"
                : (locale === "ru")
                    ? "В этом браузере нет AudioContext, запись недоступна."
                    : "AudioContext is unavailable; cannot record.";
            return;
        }

        fallbackAudioCtx = new AudioCtx();
        fallbackSource = fallbackAudioCtx.createMediaStreamSource(stream);
        // ScriptProcessor is deprecated but still widely available as a compatibility fallback.
        fallbackProcessor = fallbackAudioCtx.createScriptProcessor(4096, 1, 1);
        fallbackProcessor.onaudioprocess = function (event) {
            var input = event.inputBuffer.getChannelData(0);
            fallbackChunks.push(new Float32Array(input));
        };
        fallbackSource.connect(fallbackProcessor);
        fallbackProcessor.connect(fallbackAudioCtx.destination);
        logDebug("fallback recorder running");
    }

    function stopFallbackRecorder() {
        logDebug("stopFallbackRecorder()");
        if (!fallbackAudioCtx || !fallbackProcessor) return;

        try { fallbackProcessor.disconnect(); } catch (e) {}
        try { fallbackSource.disconnect(); } catch (e) {}
        try { fallbackAudioCtx.close(); } catch (e) {}

        var wavBlob = encodeWavFromFloat32(fallbackChunks, 44100);
        fallbackChunks = [];
        fallbackAudioCtx = null;
        fallbackSource = null;
        fallbackProcessor = null;

        finalizeRecording(wavBlob);
    }

    function encodeWavFromFloat32(chunks, sampleRate) {
        var length = 0;
        chunks.forEach(function (c) { length += c.length; });
        var buffer = new Float32Array(length);
        var offset = 0;
        chunks.forEach(function (c) {
            buffer.set(c, offset);
            offset += c.length;
        });

        var wavBuffer = new ArrayBuffer(44 + buffer.length * 2);
        var view = new DataView(wavBuffer);

        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + buffer.length * 2, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, buffer.length * 2, true);

        var idx = 44;
        for (var i = 0; i < buffer.length; i++) {
            var s = Math.max(-1, Math.min(1, buffer[i]));
            view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            idx += 2;
        }
        return new Blob([view], { type: "audio/wav" });
    }

    function writeString(view, offset, str) {
        for (var i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    function getRecorderOptions() {
        if (!window.MediaRecorder || typeof window.MediaRecorder.isTypeSupported !== "function") return null;
        var preferredTypes = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/ogg;codecs=opus"
        ];
        for (var i = 0; i < preferredTypes.length; i++) {
            if (window.MediaRecorder.isTypeSupported(preferredTypes[i])) {
                return { mimeType: preferredTypes[i] };
            }
        }
        return null;
    }

    function drawWaveform(audioBuffer, canvas) {
        var c = canvas.getContext("2d");
        var data = audioBuffer.getChannelData(0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.beginPath();
        c.lineWidth = 1.5;
        c.strokeStyle = "#4a7c59";
        var step = Math.ceil(data.length / canvas.width);
        var amp = canvas.height / 2;
        for (var i = 0; i < canvas.width; i++) {
            var min = 1.0;
            var max = -1.0;
            for (var j = 0; j < step; j++) {
                var datum = data[(i * step) + j] || 0;
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            c.moveTo(i, (1 + min) * amp);
            c.lineTo(i, (1 + max) * amp);
        }
        c.stroke();
    }

    function drawPitchContour(audioBuffer, canvas) {
        var c = canvas.getContext("2d");
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.strokeStyle = "#2563eb";
        c.lineWidth = 1.5;
        c.beginPath();
        var data = audioBuffer.getChannelData(0);
        var sampleRate = audioBuffer.sampleRate;
        var frame = 2048;
        var hop = 512;
        var points = [];
        for (var i = 0; i + frame < data.length; i += hop) {
            var slice = data.subarray(i, i + frame);
            var f0 = estimatePitch(slice, sampleRate);
            if (f0 > 70 && f0 < 350) points.push(f0);
            else points.push(null);
        }
        for (var k = 0; k < points.length; k++) {
            if (points[k] == null) continue;
            var x = (k / Math.max(1, points.length - 1)) * canvas.width;
            var y = canvas.height - ((points[k] - 70) / (350 - 70)) * canvas.height;
            if (k === 0 || points[k - 1] == null) c.moveTo(x, y);
            else c.lineTo(x, y);
        }
        c.stroke();
    }

    function estimatePitch(frameData, sampleRate) {
        var size = frameData.length;
        var maxLag = Math.floor(sampleRate / 70);
        var minLag = Math.floor(sampleRate / 350);
        var bestLag = -1;
        var bestCorr = 0;
        for (var lag = minLag; lag <= maxLag; lag++) {
            var corr = 0;
            for (var i = 0; i < size - lag; i++) corr += frameData[i] * frameData[i + lag];
            if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
        }
        if (bestLag === -1 || bestCorr < 0.01) return 0;
        return sampleRate / bestLag;
    }

    function analyzePronunciation() {
        var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;
        var recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        transcriptOutput.textContent = T.listening;
        tipList.innerHTML = "<li>" + T.analyzing + "</li>";

        recognition.onresult = function (event) {
            var transcript = (event.results[0] && event.results[0][0] && event.results[0][0].transcript) || "";
            transcriptOutput.textContent = transcript || T.noTranscript;

            var target = drills[currentDrillIndex].sentence;
            var drill = drills[currentDrillIndex];
            var matchScore = sentenceMatchScore(target, transcript);
            var paceScore = estimatePacing(target, lastRecordingDurationSec);
            var diag = phonemeDiagnostics(drill, transcript);
            var phonemeScore = diag.score;
            var grade = scoreToGrade((matchScore + paceScore + phonemeScore) / 3);

            scoreMatch.textContent = matchScore + "%";
            scorePace.textContent = estimateWordsPerSecond(target, lastRecordingDurationSec);
            scoreGrade.textContent = grade;
            scorePhoneme.textContent = phonemeScore + "%";
            renderPhonemeCards(drill.phonemes, diag.map);

            var tips = generateTips(drill, transcript, matchScore, lastRecordingDurationSec, diag.map);
            tipList.innerHTML = tips.map(function (t) { return "<li>" + t + "</li>"; }).join("");

            progress.sessions += 1;
            progress.drillsDone[target] = 1;
            updateStreak();
            applyPhonemeMisses(diag.map);
            saveProgress();
            updateProgressUI();
            renderDailyPlan();
        };

        recognition.onerror = function () {
            transcriptOutput.textContent = T.recognitionError;
            tipList.innerHTML = "<li>" + T.tipStart + "</li>";
        };
        recognition.start();
    }

    function phonemeDiagnostics(drill, transcript) {
        var heard = normalize(transcript);
        var good = 0;
        var map = {};
        drill.phonemes.forEach(function (p) {
            var ok = p.patterns.some(function (pattern) { return heard.indexOf(pattern) !== -1; });
            map[p.symbol] = ok;
            if (ok) good += 1;
        });
        var score = drill.phonemes.length ? Math.round((good / drill.phonemes.length) * 100) : 100;
        return { score: score, map: map };
    }

    function sentenceMatchScore(target, transcript) {
        var a = normalize(target).split(" ").filter(Boolean);
        var b = normalize(transcript).split(" ").filter(Boolean);
        if (!a.length || !b.length) return 0;
        var same = 0;
        a.forEach(function (word) { if (b.indexOf(word) !== -1) same += 1; });
        return Math.max(0, Math.min(100, Math.round((same / a.length) * 100)));
    }

    function estimateWordsPerSecond(target, durationSec) {
        if (!durationSec || durationSec <= 0) return "--";
        var words = normalize(target).split(" ").filter(Boolean).length;
        return (words / durationSec).toFixed(2);
    }

    function estimatePacing(target, durationSec) {
        if (!durationSec || durationSec <= 0) return 60;
        var wps = parseFloat(estimateWordsPerSecond(target, durationSec));
        if (wps >= 1.8 && wps <= 3.2) return 90;
        if (wps >= 1.5 && wps <= 3.8) return 75;
        return 60;
    }

    function scoreToGrade(score) {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "E";
    }

    function generateTips(drill, transcript, matchScore, durationSec, phonemeMap) {
        var tips = [];
        var targetText = normalize(drill.sentence);
        var heardText = normalize(transcript);

        if (matchScore < 70) tips.push(locale === "zh" ? "先放慢语速，把每个关键词清晰说出来，再连成整句。" : (locale === "ru" ? "Сначала замедлитесь и четко произносите ключевые слова, затем соединяйте их в фразу." : "Slow down and over-pronounce each keyword first, then reconnect the sentence."));
        else tips.push(locale === "zh" ? "识别准确度不错，下一步是让节奏更自然。" : (locale === "ru" ? "Хорошая точность. Теперь делайте ритм более естественным." : "Good accuracy. Keep that clarity and make the sentence flow smoother."));

        Object.keys(phonemeMap).forEach(function (symbol) {
            if (phonemeMap[symbol]) return;
            if (symbol === "/θ/") tips.push(locale === "zh" ? "练习 /θ/：舌尖轻触上下齿之间，再送气。" : (locale === "ru" ? "Тренируйте /θ/: кончик языка между зубами и мягкий выдох." : "Practice /θ/: place tongue lightly between teeth."));
            else if (symbol === "/ð/") tips.push(locale === "zh" ? "练习 /ð/：保持舌尖位置不变，并加上声带振动。" : (locale === "ru" ? "Тренируйте /ð/: то же положение, но с голосом." : "Practice /ð/: same tongue position as /θ/ with voicing."));
            else if (symbol === "/r/") tips.push(locale === "zh" ? "练习 /r/：舌头不触上颚，嘴唇轻微圆拢。" : (locale === "ru" ? "Тренируйте /r/: язык не касается нёба, губы слегка округлены." : "Strengthen /r/: tongue stays off the roof, lips slightly rounded."));
            else if (symbol === "/l/") tips.push(locale === "zh" ? "练习 /l/：舌尖触上齿龈，声音更明亮。" : (locale === "ru" ? "Тренируйте /l/: кончик языка касается альвеол." : "Practice /l/: tongue tip touches alveolar ridge."));
            else if (symbol === "/v/") tips.push(locale === "zh" ? "练习 /v/：上齿轻触下唇并振动发声。" : (locale === "ru" ? "Тренируйте /v/: верхние зубы касаются нижней губы с вибрацией." : "For /v/, top teeth touch lower lip with voicing."));
        });

        if (durationSec > 0) {
            var wps = parseFloat(estimateWordsPerSecond(drill.sentence, durationSec));
            if (wps < 1.4) tips.push(locale === "zh" ? "语速稍慢，可在保持清晰的前提下提速10%-15%。" : (locale === "ru" ? "Темп немного медленный; ускорьтесь на 10-15%, сохраняя четкость." : "Pace is a bit slow. Try speaking 10-15% faster while staying clear."));
            if (wps > 3.8) tips.push(locale === "zh" ? "语速偏快，按重读组做短停顿。" : (locale === "ru" ? "Темп слишком быстрый. Делайте короткие паузы между смысловыми группами." : "Pace is fast. Pause slightly between stress groups."));
        }
        if (/th/.test(targetText) && !/th/.test(heardText)) {
            tips.push(locale === "zh" ? "句中 TH 仍有遗漏，建议单独做 think/this 对比练习。" : (locale === "ru" ? "TH все еще пропускается; потренируйте пары think/this отдельно." : "TH is still being missed. Drill think/this in isolation."));
        }
        if (tips.length < 2) tips.push(T.tipStart);
        return tips.slice(0, 5);
    }

    function applyPhonemeMisses(map) {
        Object.keys(map).forEach(function (symbol) {
            if (!map[symbol]) progress.phonemeMisses[symbol] = (progress.phonemeMisses[symbol] || 0) + 1;
        });
    }

    function newPairChallenge() {
        resetPairUI();
        currentPair = minimalPairs[Math.floor(Math.random() * minimalPairs.length)];
        pairAnswer = currentPair[Math.floor(Math.random() * currentPair.length)];
        pairOptionA.textContent = currentPair[0];
        pairOptionB.textContent = currentPair[1];
        pairResult.textContent = T.chooseWord;
        speakText(pairAnswer, "en-US", 0.85);
    }

    function answerPair(selected) {
        if (!currentPair || !pairAnswer) return;
        progress.pairAttempts += 1;
        if (selected === pairAnswer) {
            progress.pairCorrect += 1;
            pairResult.textContent = T.pairCorrect;
            markPairButton(selected, true);
        } else {
            pairResult.textContent = T.pairWrong + " " + pairAnswer;
            markPairButton(selected, false);
        }
        saveProgress();
        updateProgressUI();
    }

    function markPairButton(selected, isCorrect) {
        [pairOptionA, pairOptionB].forEach(function (btn) {
            btn.classList.remove("correct", "wrong");
            if (btn.textContent === pairAnswer) btn.classList.add("correct");
            if (!isCorrect && btn.textContent === selected) btn.classList.add("wrong");
        });
    }

    function resetPairUI() {
        [pairOptionA, pairOptionB].forEach(function (btn) { btn.classList.remove("correct", "wrong"); });
    }

    function renderDailyPlan() {
        var today = getDateKey();
        if (!progress.lessonPlans[today]) {
            progress.lessonPlans[today] = buildLessonPlan();
            saveProgress();
        }
        planDate.textContent = today;
        var items = progress.lessonPlans[today];
        lessonList.innerHTML = items.map(function (item, idx) {
            var checked = item.done ? "checked" : "";
            var cls = item.done ? "lesson-item done" : "lesson-item";
            return "<label class=\"" + cls + "\"><input data-lesson-idx=\"" + idx + "\" type=\"checkbox\" " + checked + "> " + item.text + "</label>";
        }).join("");

        lessonList.querySelectorAll("input[type=checkbox]").forEach(function (box) {
            box.addEventListener("change", function () {
                var i = Number(box.getAttribute("data-lesson-idx"));
                progress.lessonPlans[today][i].done = box.checked;
                saveProgress();
                renderDailyPlan();
            });
        });
    }

    function buildLessonPlan() {
        var weak = getWeakestPhoneme();
        var weakText = weak ? ("Focus: " + weak + " (10 reps)") : (locale === "zh" ? "重点：任意难点音（10次）" : (locale === "ru" ? "Фокус: сложный звук (10 повторов)" : "Focus: your hardest sound (10 reps)"));
        return [
            { text: locale === "zh" ? "做 1 轮最小对立听辨（至少 5 题）" : (locale === "ru" ? "Сделайте 1 раунд минимальных пар (минимум 5 заданий)" : "Do one minimal-pairs round (at least 5 items)"), done: false },
            { text: weakText, done: false },
            { text: locale === "zh" ? "完成任意 2 个句子朗读并分析" : (locale === "ru" ? "Выполните анализ для 2 фраз" : "Complete analysis on 2 drill sentences"), done: false },
            { text: locale === "zh" ? "用较慢语速再录一遍最佳句子" : (locale === "ru" ? "Перезапишите лучшую фразу в более медленном темпе" : "Re-record your best sentence at a slightly slower pace"), done: false }
        ];
    }

    function getWeakestPhoneme() {
        var entries = Object.entries(progress.phonemeMisses || {});
        if (!entries.length) return "";
        entries.sort(function (a, b) { return b[1] - a[1]; });
        return entries[0][0];
    }

    function updateStreak() {
        var today = getDateKey();
        if (!progress.lastPracticeDate) {
            progress.lastPracticeDate = today;
            progress.streakDays = 1;
            return;
        }
        if (progress.lastPracticeDate === today) return;
        var delta = dayDiff(progress.lastPracticeDate, today);
        if (delta === 1) progress.streakDays += 1;
        else progress.streakDays = 1;
        progress.lastPracticeDate = today;
    }

    function dayDiff(fromDate, toDate) {
        var a = new Date(fromDate + "T00:00:00Z").getTime();
        var b = new Date(toDate + "T00:00:00Z").getTime();
        return Math.round((b - a) / 86400000);
    }

    function getDateKey() {
        var now = new Date();
        return now.toISOString().slice(0, 10);
    }

    function normalize(text) {
        return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    }

    function speakText(text, lang, rate) {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang || "en-US";
        u.rate = rate || 1.0;
        window.speechSynthesis.speak(u);
    }

    function loadProgress() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) throw new Error("empty");
            var parsed = JSON.parse(raw);
            return {
                sessions: parsed.sessions || 0,
                drillsDone: parsed.drillsDone || {},
                pairAttempts: parsed.pairAttempts || 0,
                pairCorrect: parsed.pairCorrect || 0,
                streakDays: parsed.streakDays || 0,
                lastPracticeDate: parsed.lastPracticeDate || "",
                phonemeMisses: parsed.phonemeMisses || {},
                lessonPlans: parsed.lessonPlans || {}
            };
        } catch (e) {
            return {
                sessions: 0,
                drillsDone: {},
                pairAttempts: 0,
                pairCorrect: 0,
                streakDays: 0,
                lastPracticeDate: "",
                phonemeMisses: {},
                lessonPlans: {}
            };
        }
    }

    function saveProgress() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    function updateProgressUI() {
        var sessionEl = document.getElementById("session-count");
        var drillEl = document.getElementById("drill-count");
        var pairEl = document.getElementById("pair-accuracy");
        var streakEl = document.getElementById("streak-count");
        sessionEl.textContent = String(progress.sessions);
        drillEl.textContent = String(Object.keys(progress.drillsDone).length);
        var acc = progress.pairAttempts > 0 ? Math.round((progress.pairCorrect / progress.pairAttempts) * 100) : 0;
        pairEl.textContent = acc + "%";
        streakEl.textContent = progress.streakDays + " " + T.streakDays;
    }

    function logDebug(msg) {
        if (!debugLogEl) return;
        var stamp = new Date().toLocaleTimeString();
        var line = "[" + stamp + "] " + msg;
        if (!debugLogEl.textContent || debugLogEl.textContent === "(waiting for events...)" || debugLogEl.textContent === "（等待事件...）" || debugLogEl.textContent === "(ожидание событий...)" || debugLogEl.textContent === "(cleared)") {
            debugLogEl.textContent = line;
        } else {
            debugLogEl.textContent += "\n" + line;
        }
        debugLogEl.scrollTop = debugLogEl.scrollHeight;
    }

    init();
}());
