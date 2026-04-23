# AGENTS.md — ReadingImproverAndroid

> This file is for AI coding agents. It describes the project structure, build process, conventions, and known caveats. All documentation and code comments are in English.

---

## Project Overview

ReadingImproverAndroid is a native Android app that helps users practice reading aloud. The user pastes a short story (≤ 500 words), the app splits it into sentences, and then listens to the user read each sentence via speech-to-text. It scores the spoken text against the target sentence in real time and can auto-advance when the score passes a configurable threshold. The app also supports text-to-speech playback of the current sentence.

**Package:** `com.mindfulness.readingimprover`

**Current scope:**
- Paste story text, split into sentences
- Start/stop listening for speech
- Live + final sentence score based on Levenshtein distance with token normalization and stemming
- Effective threshold lowered automatically for short sentences (≤ 5 tokens)
- Auto-advance on pass
- TTS playback with sentence repeat flow
- Offline STT fallback via Vosk

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | Kotlin 2.0.21 |
| UI | Jetpack Compose (BOM 2025.01.01), Material3 |
| Build System | Gradle 9.0.0 (Kotlin DSL) |
| Android Gradle Plugin | 8.7.2 |
| Compile SDK | 35 |
| Min SDK | 26 |
| Target SDK | 35 |
| JVM Target | 17 |

**Key dependencies:**
- `androidx.compose:compose-bom:2025.01.01`
- `androidx.activity:activity-compose:1.10.0`
- `androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7`
- `com.alphacephei:vosk-android:0.3.75` (offline speech recognition)
- `junit:junit:4.13.2` (tests)
- `org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.1` (tests)

---

## Project Structure

```
ReadingImproverAndroid/
├── app/
│   ├── build.gradle.kts              # App-level build config
│   ├── proguard-rules.pro            # Empty / no custom rules
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml   # RECORD_AUDIO + INTERNET permissions
│       │   ├── java/com/mindfulness/readingimprover/
│       │   │   └── MainActivity.kt   # Entire app: UI, controllers, scoring logic
│       │   └── res/values/themes.xml # Theme.Material3.DayNight.NoActionBar
│       └── test/java/com/mindfulness/readingimprover/
│           └── ReadingLogicTest.kt   # Unit tests for pure functions
├── build.gradle.kts                  # Root build script (plugins only)
├── settings.gradle.kts               # Project name + repositories
├── gradle.properties                 # JVM args, AndroidX, Kotlin code style
├── gradle/wrapper/gradle-wrapper.properties
├── local.properties                  # Android SDK path (local)
├── local.secrets.properties          # DEEPSEEK_API_KEY for future API use
└── README.md                         # Human-facing quick start
```

**Important:** The app is currently a single-file codebase. All Composable UI, speech controllers, TTS controller, scoring logic, and model-download logic live in `MainActivity.kt` (~1,460 lines). The README lists "Move logic into ViewModel + repository layers" as an explicit next step.

---

## Build and Test Commands

> Requires a Java 17+ runtime and the Android SDK.

```bash
# Debug APK
./gradlew assembleDebug

# Run unit tests
./gradlew test

# Install on connected device
./gradlew installDebug
```

**Note:** `./gradlew` uses the wrapper at `gradle/wrapper/gradle-wrapper.jar`.

---

## Code Organization & Architecture

### Main Components (all in `MainActivity.kt`)

1. **`MainActivity`** — Entry point. Initializes speech and TTS controllers, requests `RECORD_AUDIO` permission, and hosts the Compose UI.
2. **`ReadingImproverApp`** — Root `@Composable`. Manages all UI state (`remember` / `mutableStateOf`) and wires controllers to callbacks.
3. **Speech stack**
   - `SpeechEvents` — Callback interface (listening started, partial result, final result, error, ended).
   - `SpeechEngineController` — Common controller interface.
   - `AndroidSpeechController` — Wraps Android `SpeechRecognizer` (cloud/on-device).
   - `VoskSpeechController` — Wraps Vosk offline recognizer (`com.alphacephei:vosk-android`).
   - `AdaptiveSpeechController` — Prefers Android SpeechRecognizer; auto-falls back to Vosk on error if the offline model is installed.
4. **TTS stack**
   - `AndroidTtsController` — Wraps `TextToSpeech` with engine fallback logic. Preferred engine: `com.nekospeak.tts`, then system default, then Google/Samsung/Pico.
   - `TtsSpeakResult` — Enum: `SUCCESS`, `INITIALIZING`, `NEEDS_VOICE_DATA`, `ERROR`.
   - `TtsDiagnostics` — Data class exposing engine/voice state for on-screen diagnostics.
5. **Scoring logic (pure functions)**
   - `splitSentences(String): List<String>` — Splits on sentence terminators.
   - `wordCount(String): Int`
   - `normalizeTokens(String): List<String>` — Lowercases, strips punctuation, applies rudimentary stemming (`ing`, `ed`, `es`, `s`).
   - `sentenceScore(expected, spoken): Float` — Token-level Levenshtein similarity; for short sentences (≤ 3 tokens) blends in character-level similarity.
   - `effectiveThreshold(sentence, base): Float` — Lowers threshold for short sentences (2 words → ‑20, 3 → ‑15, 4 → ‑10, 5 → ‑5).
   - `levenshtein(List<T>, List<T>): Int` — Standard DP implementation.
6. **Model download**
   - `downloadAndInstallVoskModel(context, onProgress): Boolean` — Downloads `vosk-model-small-en-us-0.15.zip` (~40 MB) to `context.filesDir/vosk/`, unzips, verifies `conf/model.conf` exists.

### State Management

All UI state lives inside `ReadingImproverApp` as `remember { mutableStateOf(...) }`. There is no `ViewModel`, `StateFlow`, or repository layer yet. If you add new screens or significant state, the README explicitly suggests migrating to `ViewModel` + repository.

---

## Testing Strategy

- **Framework:** JUnit 4
- **Test file:** `app/src/test/java/com/mindfulness/readingimprover/ReadingLogicTest.kt`
- **Scope:** Only pure utility functions are tested (no Compose or Android framework tests).

Current tests:
1. `splitSentences_parsesBasicPunctuation`
2. `sentenceScore_exactMatch_isHundred`
3. `sentenceScore_smallVariation_staysHigh`
4. `effectiveThreshold_shortSentence_isLowered`
5. `buildProsodyHints_question_endsUpward`
6. `buildProsodyHints_functionWords_areWeak`

> ⚠️ **Known issue:** Tests 5 and 6 reference a function `buildProsodyHints` that does **not** exist in `MainActivity.kt`. As a result, the test source does not compile in its current state. If you are modifying tests or adding the prosody feature, you must either implement `buildProsodyHints` or remove those tests.

There are no instrumentation tests (no `androidTest` source set).

---

## Code Style Guidelines

- Kotlin official code style is enabled (`kotlin.code.style=official` in `gradle.properties`).
- Use Compose Material3 components and theme values; avoid hard-coded colors except for one-off status backgrounds (e.g., `Color(0xFFFFE3E3)` for failed sentences).
- Composables are named in `PascalCase` and are `private` when screen-internal.
- Pure logic functions are `private` top-level functions in `MainActivity.kt`.
- Controllers hold a reference to `events: SpeechEvents?` and delegate callbacks upward.
- Prefer `mutableStateOf` over `StateFlow` for now (matches existing convention).

---

## Security Considerations

- **Secrets:** `DEEPSEEK_API_KEY` is read from `local.secrets.properties` at build time and injected as a `BuildConfig` field. Never commit `local.secrets.properties` to version control.
- **Network:** The app downloads the Vosk model over plain HTTPS (`alphacephei.com`). Download logic uses `HttpURLConnection` with 15s connect and 60s read timeouts.
- **Permissions:** `RECORD_AUDIO` and `INTERNET` are declared in `AndroidManifest.xml`. Microphone permission is requested at runtime before listening.
- **File storage:** The Vosk model is stored in `context.filesDir/vosk/`, which is private app storage.

---

## Agent Notes

- **If adding new screens:** Consider extracting UI into separate `@Composable` files under `ui/` and moving state into a `ViewModel` (this is an acknowledged next step in the README).
- **If adding tests:** Add tests for pure functions in `ReadingLogicTest.kt`. Do not add Android-instrumentation tests unless you also create the `androidTest` source set and add the required dependencies (`androidx.compose.ui:ui-test-junit4`, etc.).
- **If modifying scoring:** `sentenceScore` and `effectiveThreshold` are tightly coupled to the UX (auto-advance, color coding). Changing thresholds or scoring weights will directly affect user-facing pass/fail behavior.
- **If modifying speech engines:** `AdaptiveSpeechController` handles engine switching; make sure both `AndroidSpeechController` and `VoskSpeechController` implement `SpeechEngineController` and correctly propagate `SpeechEvents`.
