import SwiftUI
import Speech
import AVFoundation
import Combine

struct EnglishReadingCoachView: View {
    @State private var storyText = ""
    @State private var started = false
    @State private var sentences: [String] = []
    @State private var currentIndex = 0
    @State private var transcript = ""
    @State private var lastScore: Double?
    @State private var statusMessage = "Paste or generate a short story to begin."
    @State private var autoAdvance = true
    @State private var matchThreshold = 70.0
    @State private var failedSentenceIndexes = Set<Int>()
    @State private var liveScore: Double?
    @State private var autoAdvancedThisSentence = false
    @StateObject private var speech = SpeechPracticeCoordinator()

    @AppStorage("geminiApiKey") private var geminiApiKey = ""
    @State private var storyTopic = "daily life"
    @State private var isGenerating = false
    @State private var generationMessage = ""
    @State private var showAPIKeyEditor = false
    @State private var showPronunciationCues = true
    @State private var autoListenWatchdogToken = UUID()

    private let maxWords = 500

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if started {
                        practiceSection
                    } else {
                        setupSection
                    }
                }
                .padding()
            }
            .navigationTitle("Reading Coach")
            .onDisappear { speech.stopListening() }
            .task { await speech.requestPermissionsIfNeeded() }
            .alert("Speech Error", isPresented: $speech.showErrorAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(speech.errorMessage)
            }
        }
    }

    private var setupSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI Story Generator")
                .font(.headline)

            DisclosureGroup(isExpanded: $showAPIKeyEditor) {
                SecureField("Gemini API key (free tier)", text: $geminiApiKey)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(10)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(10)
                    .padding(.top, 4)
            } label: {
                let hasKey = !geminiApiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                HStack {
                    Text("API Key")
                    Spacer()
                    Text(hasKey ? "Saved" : "Not set")
                        .font(.caption)
                        .foregroundColor(hasKey ? .green : .secondary)
                }
            }

            TextField("Topic (e.g. daily life)", text: $storyTopic)
                .textInputAutocapitalization(.never)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)

            Toggle("Show pronunciation cues", isOn: $showPronunciationCues)

            Button(isGenerating ? "Generating..." : "Generate Story") {
                Task { await generateStory() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isGenerating || geminiApiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

            if !generationMessage.isEmpty {
                Text(generationMessage)
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }

            Divider()

            Text("Story Input")
                .font(.headline)

            TextEditor(text: $storyText)
                .frame(minHeight: 220)
                .padding(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            Text("\(wordCount(storyText)) / \(maxWords) words")
                .font(.caption)
                .foregroundColor(wordCount(storyText) <= maxWords ? .secondary : .red)

            VStack(alignment: .leading, spacing: 4) {
                Text("Match Threshold: \(Int(matchThreshold))%")
                    .font(.subheadline)
                Slider(value: $matchThreshold, in: 50...95, step: 1)
                Text("Short sentences use a slightly lower pass bar automatically.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Button("Start Reading") { startReading() }
                .buttonStyle(.borderedProminent)
                .disabled(!canStart || isGenerating)
        }
    }

    private var practiceSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Sentence \(currentIndex + 1) of \(sentences.count)")
                .font(.headline)

            ForEach(Array(sentences.enumerated()), id: \.offset) { index, sentence in
                let isCurrent = index == currentIndex
                let failed = failedSentenceIndexes.contains(index)
                Text("\(index + 1). \(sentence)")
                    .font(.footnote)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(backgroundColor(isCurrent: isCurrent, failed: failed))
                    .cornerRadius(8)
            }

            Text("Current Sentence")
                .font(.subheadline)
                .foregroundColor(.secondary)
            VStack(alignment: .leading, spacing: 6) {
                if showPronunciationCues {
                    let cue = intonationCue(for: currentSentence)
                    Text("Intonation: \(cue.symbol) \(cue.hint)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Text(styledCurrentSentence())
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(10)

            Text("Transcript")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text(transcript.isEmpty ? "Start speaking..." : transcript)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(10)

            HStack(spacing: 10) {
                Button(speech.isListening ? "Stop Listening" : "Start Listening") {
                    if speech.isListening {
                        speech.stopListening(suppressExpectedError: true)
                        evaluateUsingCurrentTranscriptIfPossible()
                    } else {
                        beginListeningForCurrentSentence()
                    }
                }
                .buttonStyle(.borderedProminent)

                Button("Hear Sentence") { speech.readAloud(currentSentence) }
                    .buttonStyle(.bordered)
            }

            Toggle("Auto move to next sentence on pass", isOn: $autoAdvance)

            if speech.isListening, let liveScore {
                Text("Live score: \(Int(liveScore))%")
                    .foregroundColor(liveScore >= matchThreshold ? .green : .secondary)
            }

            if let score = lastScore {
                Text("Last match score: \(Int(score))%")
                    .foregroundColor(score >= effectiveThreshold(for: currentSentence) ? .green : .orange)
            }

            if showPronunciationCues {
                Text("Cue guide: bold = strong words, light = weak words.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(statusMessage)
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack {
                if let score = lastScore, score < effectiveThreshold(for: currentSentence) {
                    Button("Repeat Sentence") {
                        transcript = ""
                        liveScore = nil
                        beginListeningForCurrentSentence()
                    }
                    .buttonStyle(.borderedProminent)
                }

                Button("Next Sentence") { goToNextSentence() }
                    .buttonStyle(.bordered)
                    .disabled(isLastSentence)
            }

            Button("Use New Story") { resetStoryFlow() }
                .buttonStyle(.plain)
                .foregroundColor(.teal)
        }
    }

    @MainActor
    private func generateStory() async {
        let key = geminiApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else {
            generationMessage = "Please enter a Gemini API key."
            return
        }

        isGenerating = true
        generationMessage = "Generating..."
        defer { isGenerating = false }

        do {
            let generated = try await GeminiStoryGenerator().generateStory(apiKey: key, topic: storyTopic)
            storyText = generated
            generationMessage = "Story generated. Tap Start Reading."
        } catch {
            generationMessage = "Generation failed: \(error.localizedDescription)"
        }
    }

    private var canStart: Bool {
        let words = wordCount(storyText)
        return !storyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && words <= maxWords
    }

    private var currentSentence: String {
        guard sentences.indices.contains(currentIndex) else { return "" }
        return sentences[currentIndex]
    }

    private var isLastSentence: Bool {
        currentIndex >= sentences.count - 1
    }

    private func startReading() {
        let parsed = sentenceSplit(from: storyText)
        guard !parsed.isEmpty else {
            statusMessage = "No valid sentence found."
            return
        }
        sentences = parsed
        currentIndex = 0
        transcript = ""
        lastScore = nil
        failedSentenceIndexes.removeAll()
        started = true
        statusMessage = "Mic is ready. Read sentence 1 aloud."
        beginListeningForCurrentSentence()
    }

    private func beginListeningForCurrentSentence() {
        transcript = ""
        liveScore = nil
        autoAdvancedThisSentence = false
        statusMessage = "Listening... read the sentence aloud."
        let started = speech.startListening(
            onTranscript: { text in
                transcript = text
                evaluateLiveProgress(transcriptText: text)
            },
            onFinalResult: { evaluateCurrentAttempt(transcriptText: $0) }
        )
        if !started {
            statusMessage = "Could not start listening. Tap Start Listening to try again."
        }
    }

    private func beginListeningForCurrentSentenceAutomatically(attempt: Int = 0) {
        transcript = ""
        liveScore = nil
        autoAdvancedThisSentence = false
        statusMessage = "Starting microphone..."

        let shouldShowErrors = attempt >= 2
        let started = speech.startListening(
            onTranscript: { text in
                transcript = text
                evaluateLiveProgress(transcriptText: text)
            },
            onFinalResult: { evaluateCurrentAttempt(transcriptText: $0) },
            showErrors: shouldShowErrors
        )

        if started {
            statusMessage = "Listening... read the sentence aloud."
            return
        }

        guard attempt < 2 else {
            statusMessage = "Auto start failed. Tap Start Listening to continue."
            return
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            beginListeningForCurrentSentenceAutomatically(attempt: attempt + 1)
        }
    }

    private func evaluateUsingCurrentTranscriptIfPossible() {
        let spoken = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !spoken.isEmpty else {
            statusMessage = "No speech captured. Please speak and try again."
            return
        }
        evaluateCurrentAttempt(transcriptText: spoken)
    }

    private func evaluateCurrentAttempt(transcriptText: String) {
        guard !autoAdvancedThisSentence else { return }

        let cleanedTranscript = transcriptText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedTranscript.isEmpty else {
            statusMessage = "No speech captured. Please speak and try again."
            return
        }

        let score = SentenceMatcher.score(expected: currentSentence, spoken: transcriptText)
        let passThreshold = effectiveThreshold(for: currentSentence)
        lastScore = score
        if score < passThreshold {
            failedSentenceIndexes.insert(currentIndex)
            statusMessage = "Score \(Int(score))% is below \(Int(passThreshold))%. Try again."
            speech.readAloud(currentSentence)
        } else {
            failedSentenceIndexes.remove(currentIndex)
            statusMessage = "Great. Passed with \(Int(score))% (target \(Int(passThreshold))%)."
            if autoAdvance { goToNextSentence(autoStarted: true) }
        }
    }

    private func evaluateLiveProgress(transcriptText: String) {
        guard speech.isListening, autoAdvance, !autoAdvancedThisSentence else { return }

        let cleanedTranscript = transcriptText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedTranscript.isEmpty else { return }

        let score = SentenceMatcher.score(expected: currentSentence, spoken: cleanedTranscript)
        let passThreshold = effectiveThreshold(for: currentSentence)
        liveScore = score

        guard score >= passThreshold else { return }

        autoAdvancedThisSentence = true
        lastScore = score
        failedSentenceIndexes.remove(currentIndex)
        statusMessage = "Passed live threshold (\(Int(score))% / \(Int(passThreshold))%). Moving to next sentence..."
        speech.stopListening(suppressExpectedError: true)
        goToNextSentence(autoStarted: true)
    }

    private func goToNextSentence(autoStarted: Bool = false) {
        guard !isLastSentence else {
            statusMessage = "Finished all sentences. Nice work."
            speech.stopListening()
            return
        }
        currentIndex += 1
        transcript = ""
        liveScore = nil
        if autoStarted || autoAdvance {
            let token = UUID()
            autoListenWatchdogToken = token
            beginListeningForCurrentSentenceAutomatically()
            scheduleAutoListenWatchdog(token: token)
        }
    }

    private func resetStoryFlow() {
        autoListenWatchdogToken = UUID() // cancel pending watchdog retries
        speech.stopListening()
        started = false
        sentences = []
        currentIndex = 0
        transcript = ""
        lastScore = nil
        liveScore = nil
        failedSentenceIndexes.removeAll()
        statusMessage = "Paste or generate a short story to begin."
    }

    private func sentenceSplit(from text: String) -> [String] {
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        let pattern = #"[^.!?]+[.!?]?"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let fullRange = NSRange(cleaned.startIndex..., in: cleaned)

        return regex.matches(in: cleaned, range: fullRange)
            .compactMap { Range($0.range, in: cleaned).map { String(cleaned[$0]) } }
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    private func wordCount(_ text: String) -> Int {
        text.split { $0.isWhitespace || $0.isNewline }.count
    }

    private func effectiveThreshold(for sentence: String) -> Double {
        let tokenCount = sentence
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9\\s]", with: " ", options: .regularExpression)
            .split(separator: " ")
            .count

        let adjustment: Double
        switch tokenCount {
        case 0...2:
            adjustment = 20
        case 3:
            adjustment = 15
        case 4:
            adjustment = 10
        case 5:
            adjustment = 5
        default:
            adjustment = 0
        }

        return max(50, matchThreshold - adjustment)
    }

    private func backgroundColor(isCurrent: Bool, failed: Bool) -> Color {
        if isCurrent && failed { return .red.opacity(0.25) }
        if isCurrent { return .blue.opacity(0.15) }
        if failed { return .red.opacity(0.15) }
        return Color(.secondarySystemBackground)
    }

    private func styledCurrentSentence() -> AttributedString {
        guard showPronunciationCues else { return AttributedString(currentSentence) }

        let words = currentSentence.split(separator: " ", omittingEmptySubsequences: true)
        var result = AttributedString()

        for (index, rawWord) in words.enumerated() {
            let word = String(rawWord)
            var chunk = AttributedString(word)
            if isWeakWord(word) {
                chunk.foregroundColor = .secondary
            } else {
                chunk.font = .system(size: 19, weight: .semibold)
            }
            result.append(chunk)
            if index < words.count - 1 {
                result.append(AttributedString(" "))
            }
        }

        return result
    }

    private func isWeakWord(_ word: String) -> Bool {
        let cleaned = word
            .lowercased()
            .replacingOccurrences(of: "[^a-z']", with: "", options: .regularExpression)

        let weakWords: Set<String> = [
            "a", "an", "the", "to", "of", "in", "on", "at", "for", "from", "with", "by",
            "and", "or", "but", "so", "if", "than", "as", "that", "this", "these", "those",
            "is", "am", "are", "was", "were", "be", "been", "being", "do", "does", "did",
            "have", "has", "had", "will", "would", "can", "could", "shall", "should",
            "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
            "my", "your", "his", "its", "our", "their"
        ]

        return weakWords.contains(cleaned)
    }

    private func intonationCue(for sentence: String) -> (symbol: String, hint: String) {
        let trimmed = sentence.trimmingCharacters(in: .whitespacesAndNewlines)
        let lower = trimmed.lowercased()

        if trimmed.hasSuffix("?") {
            return ("↗", "Rise at the end (question)")
        }

        let questionStarts = ["who", "what", "when", "where", "why", "how", "do", "does", "did", "is", "are", "can", "could", "will", "would"]
        if let first = lower.split(separator: " ").first, questionStarts.contains(String(first)) {
            return ("↗", "Likely question rise")
        }

        if lower.contains(",") || lower.hasPrefix("and ") || lower.hasPrefix("but ") {
            return ("→", "Keep it connected")
        }

        return ("↘", "Fall at the end (statement)")
    }

    private func scheduleAutoListenWatchdog(attempt: Int = 0, token: UUID) {
        guard token == autoListenWatchdogToken else { return }
        guard started, autoAdvance, !isLastSentence else { return }
        if speech.isListening { return }

        guard attempt < 5 else {
            statusMessage = "Auto start paused. Tap Start Listening to continue."
            return
        }

        beginListeningForCurrentSentenceAutomatically()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
            scheduleAutoListenWatchdog(attempt: attempt + 1, token: token)
        }
    }
}

private struct GeminiStoryGenerator {
    func generateStory(apiKey: String, topic: String) async throws -> String {
        guard let url = URL(
            string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\(apiKey)"
        ) else {
            throw URLError(.badURL)
        }

        let prompt = """
        Create one short English story for reading practice.
        Level: A2
        Length: 120-180 words, under 500 words.
        Topic: \(topic)
        Use short clear sentences and avoid slang.
        Output only the story text.
        """

        let body = GenerateContentRequest(
            contents: [.init(parts: [.init(text: prompt)])]
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        let decoded = try JSONDecoder().decode(GenerateContentResponse.self, from: data)
        let text = decoded.candidates?
            .compactMap { $0.content.parts?.compactMap(\.text).joined(separator: "\n") }
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let text, !text.isEmpty else {
            throw URLError(.cannotParseResponse)
        }
        return text
    }
}

private struct GenerateContentRequest: Encodable {
    let contents: [RequestContent]
}

private struct RequestContent: Encodable {
    let parts: [RequestPart]
}

private struct RequestPart: Encodable {
    let text: String
}

private struct GenerateContentResponse: Decodable {
    let candidates: [Candidate]?
}

private struct Candidate: Decodable {
    let content: ResponseContent
}

private struct ResponseContent: Decodable {
    let parts: [ResponsePart]?
}

private struct ResponsePart: Decodable {
    let text: String?
}

private enum SentenceMatcher {
    static func score(expected: String, spoken: String) -> Double {
        let expectedTokens = normalize(expected)
        let spokenTokens = normalize(spoken)
        guard !expectedTokens.isEmpty else { return 0 }

        let tokenSimilarity = similarityFromDistance(
            distance: levenshtein(expectedTokens, spokenTokens),
            maxLen: max(expectedTokens.count, spokenTokens.count)
        )

        // For very short sentences, blend token and character similarity.
        if max(expectedTokens.count, spokenTokens.count) <= 3 {
            let expectedText = expectedTokens.joined(separator: " ")
            let spokenText = spokenTokens.joined(separator: " ")
            let expectedChars = Array(expectedText)
            let spokenChars = Array(spokenText)
            let charSimilarity = similarityFromDistance(
                distance: levenshteinChars(expectedChars, spokenChars),
                maxLen: max(expectedChars.count, spokenChars.count)
            )
            let blended = (tokenSimilarity * 0.6) + (charSimilarity * 0.4)
            return max(0, min(100, blended * 100))
        }

        return max(0, min(100, tokenSimilarity * 100))
    }

    private static func normalize(_ sentence: String) -> [String] {
        sentence
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9\\s]", with: "", options: .regularExpression)
            .split(separator: " ")
            .map { stem(String($0)) }
    }

    private static func stem(_ token: String) -> String {
        if token.count > 4 && token.hasSuffix("ing") {
            return String(token.dropLast(3))
        }
        if token.count > 3 && token.hasSuffix("ed") {
            return String(token.dropLast(2))
        }
        if token.count > 3 && token.hasSuffix("es") {
            return String(token.dropLast(2))
        }
        if token.count > 2 && token.hasSuffix("s") {
            return String(token.dropLast(1))
        }
        return token
    }

    private static func similarityFromDistance(distance: Int, maxLen: Int) -> Double {
        if maxLen == 0 { return 1.0 }
        return 1.0 - (Double(distance) / Double(maxLen))
    }

    private static func levenshtein(_ lhs: [String], _ rhs: [String]) -> Int {
        let m = lhs.count
        let n = rhs.count
        if m == 0 { return n }
        if n == 0 { return m }

        var dp = Array(repeating: Array(repeating: 0, count: n + 1), count: m + 1)
        for i in 0...m { dp[i][0] = i }
        for j in 0...n { dp[0][j] = j }

        for i in 1...m {
            for j in 1...n {
                let cost = lhs[i - 1] == rhs[j - 1] ? 0 : 1
                dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
            }
        }
        return dp[m][n]
    }

    private static func levenshteinChars(_ lhs: [Character], _ rhs: [Character]) -> Int {
        let m = lhs.count
        let n = rhs.count
        if m == 0 { return n }
        if n == 0 { return m }

        var dp = Array(repeating: Array(repeating: 0, count: n + 1), count: m + 1)
        for i in 0...m { dp[i][0] = i }
        for j in 0...n { dp[0][j] = j }

        for i in 1...m {
            for j in 1...n {
                let cost = lhs[i - 1] == rhs[j - 1] ? 0 : 1
                dp[i][j] = min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                )
            }
        }

        return dp[m][n]
    }
}

final class SpeechPracticeCoordinator: NSObject, ObservableObject {
    @Published var isListening = false
    @Published var showErrorAlert = false
    @Published var errorMessage = ""

    private let synthesizer = AVSpeechSynthesizer()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    private var onTranscript: ((String) -> Void)?
    private var onFinalResult: ((String) -> Void)?
    private var ignoreNextRecognitionError = false
    private var activeSessionToken = UUID()

    func requestPermissionsIfNeeded() async {
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        let micGranted = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        if speechStatus != .authorized || !micGranted {
            showError("Speech or microphone permission was denied.")
        }
    }

    @discardableResult
    func startListening(
        onTranscript: @escaping (String) -> Void,
        onFinalResult: @escaping (String) -> Void,
        showErrors: Bool = true
    ) -> Bool {
        stopListening(suppressExpectedError: true)
        self.onTranscript = onTranscript
        self.onFinalResult = onFinalResult
        let sessionToken = UUID()
        activeSessionToken = sessionToken

        guard permissionIssue() == nil else {
            if showErrors {
                showError(permissionIssue() ?? "Microphone or speech permission is missing.")
            }
            return false
        }

        guard let recognizer, recognizer.isAvailable else {
            if showErrors {
                showError("Speech recognizer is unavailable.")
            }
            return false
        }

        do {
            ignoreNextRecognitionError = false
            try configureAudioSession()
            request = SFSpeechAudioBufferRecognitionRequest()
            guard let request else {
                if showErrors {
                    showError("Could not create speech request.")
                }
                return false
            }

            request.shouldReportPartialResults = true

            let inputNode = audioEngine.inputNode
            let format = inputNode.outputFormat(forBus: 0)
            inputNode.removeTap(onBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                self?.request?.append(buffer)
            }

            audioEngine.prepare()
            try audioEngine.start()
            isListening = true

            task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }
                guard self.activeSessionToken == sessionToken else { return }
                if let result {
                    let text = result.bestTranscription.formattedString
                    self.onTranscript?(text)
                    if result.isFinal {
                        self.stopListening(suppressExpectedError: true)
                        self.onFinalResult?(text)
                    }
                }
                if let error {
                    if self.shouldSuppressRecognitionError(error) {
                        return
                    }
                    self.stopListening(suppressExpectedError: true)
                    if showErrors {
                        self.showError("Speech recognition failed: \(error.localizedDescription)")
                    }
                }
            }
            return true
        } catch {
            stopListening(suppressExpectedError: true)
            if showErrors {
                showError("Unable to start listening: \(error.localizedDescription)")
            }
            return false
        }
    }

    func stopListening(suppressExpectedError: Bool = true) {
        activeSessionToken = UUID() // invalidate callbacks from old tasks
        if suppressExpectedError {
            ignoreNextRecognitionError = true
        }
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        request = nil
        task?.cancel()
        task = nil
        isListening = false
    }

    func readAloud(_ sentence: String) {
        if isListening { stopListening() }
        let utterance = AVSpeechUtterance(string: sentence)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.45
        synthesizer.speak(utterance)
    }

    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)
    }

    private func showError(_ message: String) {
        errorMessage = message
        showErrorAlert = true
    }

    private func shouldSuppressRecognitionError(_ error: Error) -> Bool {
        if ignoreNextRecognitionError {
            return true
        }

        let nsError = error as NSError
        let message = nsError.localizedDescription.lowercased()
        let isNoSpeechDetected = message.contains("no speech detected")

        // iOS speech APIs may emit "no speech detected" after we manually stop.
        if isNoSpeechDetected {
            return true
        }

        return false
    }

    private func permissionIssue() -> String? {
        let speechStatus = SFSpeechRecognizer.authorizationStatus()
        if speechStatus != .authorized {
            return "Speech permission is not granted. Go to Settings > Privacy & Security > Speech Recognition and enable this app."
        }

        let micStatus = AVAudioSession.sharedInstance().recordPermission
        if micStatus != .granted {
            return "Microphone permission is not granted. Go to Settings > Privacy & Security > Microphone and enable this app."
        }

        return nil
    }
}
