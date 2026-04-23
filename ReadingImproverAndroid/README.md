# Reading Improver Android (Native)

Native Android implementation using:

- Kotlin + Jetpack Compose UI
- `SpeechRecognizer` for speech-to-text
- `TextToSpeech` for replaying sentence audio
- On-device sentence scoring and threshold logic

## Open and run

1. Open Android Studio.
2. Click **Open** and select `ReadingImproverAndroid`.
3. Let Gradle sync.
4. Connect an Android phone (or use emulator), then Run.

## Current scope

- Paste story text (`<= 500` words)
- Split into sentences
- Start/stop listening
- Live + final sentence score
- Effective threshold for short sentences
- Auto advance on pass
- Repeat sentence flow + TTS playback

## Next steps (optional)

- Persist settings/story with `DataStore`
- Add local/offline story generation model later
- Move logic into ViewModel + repository layers
- Add Gemini API generation screen

## Speech fallback behavior

- Primary engine: Android `SpeechRecognizer` (if available)
- Offline fallback: Vosk model download + runtime loading
- Manual fallback: `Type Attempt` button for scoring without STT

### Offline model setup

1. Open setup screen in app.
2. Tap `Download Offline Model (~40MB)`.
3. Wait for download + unzip completion.
4. App auto-switches to Vosk if Android speech service is unavailable.

Current model URL:

- `https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip`
