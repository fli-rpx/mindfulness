import SwiftUI
import Speech
import AVFoundation

struct EnglishReadingCoachView: View {
    @State private var storyText = ""
    @State private var selectedSample: StorySample = .none
    @State private var started = false
    @State private var sentences: [String] = []
    @State private var currentIndex = 0
    @State private var transcript = ""
    @State private var lastScore: Double?
    @State private var statusMessage = "Paste or select a short story to begin."
    @State private var autoAdvance = true
    @State private var matchThreshold = 70.0
    @State private var failedSentenceIndexes = Set<Int>()
    @StateObject private var speech = SpeechPracticeCoordinator()
    @AppStorage("geminiApiKey") private var geminiApiKey = ""
    @State private var cefrLevel: CEFRLevel = .a2
    @State private var storyTopic = "daily life"
    @State private var desiredWordCount = 140.0
    @State private var targetWordsInput = ""
    @State private var isGeneratingStory = false
    @State private var generationMessage = ""

    private let maxWords = 500

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if !started {
                        setupSection
                    } else {
                        practiceSection
                    }
                }
                .padding()
            }
            .navigationTitle("Reading Coach")
            .onDisappear {
                speech.stopListening()
            }
            .task {
                await speech.requestPermissionsIfNeeded()
            }
            .alert("Speech Error", isPresented: $speech.showErrorAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(speech.errorMessage)
            }
        }
    }

    private var setupSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            generatorSection

            Divider()

            Text("Story Input")
                .font(.headline)

            Picker("Sample Story", selection: $selectedSample) {
                ForEach(StorySample.allCases) { sample in
                    Text(sample.title).tag(sample)
                }
            }
            .onChange(of: selectedSample) { sample in
                if sample != .none {
                    storyText = sample.text
                }
            }

            TextEditor(text: $storyText)
                .frame(minHeight: 220)
                .padding(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            HStack {
                Text("\(wordCount(storyText)) / \(maxWords) words")
                    .font(.caption)
                    .foregroundColor(wordCount(storyText) <= maxWords ? .secondary : .red)
                Spacer()
            }

            thresholdControl

            Button("Start Reading") {
                startReading()
            }
            .buttonStyle(.borderedProminent)
            .disabled(!canStart || isGeneratingStory)
        }
    }

    private var generatorSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("AI Story Generator")
                .font(.headline)

            SecureField("Gemini API key (free tier)", text: $geminiApiKey)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)

            Picker("Level", selection: $cefrLevel) {
                ForEach(CEFRLevel.allCases) { level in
                    Text(level.rawValue).tag(level)
                }
            }
            .pickerStyle(.segmented)

            TextField("Topic (e.g. daily life, school, travel)", text: $storyTopic)
                .textInputAutocapitalization(.never)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)

            TextField("Target words (comma separated, optional)", text: $targetWordsInput)
                .textInputAutocapitalization(.never)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 4) {
                Text("Story Length: \(Int(desiredWordCount)) words")
                    .font(.subheadline)
                Slider(value: $desiredWordCount, in: 90...260, step: 10)
            }

            Button(isGeneratingStory ? "Generating..." : "Generate Story") {
                Task {
                    await generateStory()
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isGeneratingStory || geminiApiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

            if !generationMessage.isEmpty {
                Text(generationMessage)
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var practiceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Sentence \(currentIndex + 1) of \(sentences.count)")
                .font(.headline)

            sentenceList

            VStack(alignment: .leading, spacing: 8) {
                Text("Current Sentence")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(currentSentence)
                    .font(.title3)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Transcript")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(transcript.isEmpty ? "Start speaking..." : transcript)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.tertiarySystemBackground))
                    .cornerRadius(12)
            }

            HStack(spacing: 10) {
                Button(speech.isListening ? "Stop Listening" : "Start Listening") {
                    if speech.isListening {
                        speech.stopListening()
                    } else {
                        beginListeningForCurrentSentence()
                    }
                }
                .buttonStyle(.borderedProminent)

                Button("Hear Sentence") {
                    speech.readAloud(currentSentence)
                }
                .buttonStyle(.bordered)
            }

            Toggle("Auto move to next sentence on pass", isOn: $autoAdvance)
            thresholdControl

            if let score = lastScore {
                Text("Last match score: \(Int(score))%")
                    .font(.subheadline)
                    .foregroundColor(score >= matchThreshold ? .green : .orange)
            }

            Text(statusMessage)
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack(spacing: 10) {
                Button("Retry Sentence") {
                    transcript = ""
                    beginListeningForCurrentSentence()
                }
                .buttonStyle(.bordered)

                Button("Next Sentence") {
                    goToNextSentence()
                }
                .buttonStyle(.bordered)
                .disabled(isLastSentence)
            }

            Button("Use New Story") {
                resetStoryFlow()
            }
            .buttonStyle(.plain)
            .foregroundColor(.teal)
            .padding(.top, 8)
        }
    }

    private var sentenceList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Story Sentences")
                .font(.subheadline)
                .foregroundColor(.secondary)

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
        }
    }

    private var thresholdControl: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Match Threshold: \(Int(matchThreshold))%")
                .font(.subheadline)
            Slider(value: $matchThreshold, in: 50...95, step: 1)
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
            statusMessage = "No valid sentence found. Please provide a short story."
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
        speech.startListening(
            onTranscript: { text in
                transcript = text
            },
            onFinalResult: { text in
                evaluateCurrentAttempt(transcriptText: text)
            }
        )
    }

    private func evaluateCurrentAttempt(transcriptText: String) {
        let score = SentenceMatcher.score(expected: currentSentence, spoken: transcriptText)
        lastScore = score

        if score < matchThreshold {
            failedSentenceIndexes.insert(currentIndex)
            statusMessage = "Score \(Int(score))% is below threshold. Try this sentence again."
            speech.readAloud(currentSentence)
        } else {
            failedSentenceIndexes.remove(currentIndex)
            statusMessage = "Great. Sentence passed with \(Int(score))%."
            if autoAdvance {
                goToNextSentence(autoStarted: true)
            }
        }
    }

    private func goToNextSentence(autoStarted: Bool = false) {
        guard !isLastSentence else {
            statusMessage = "Finished all sentences. Nice work."
            speech.stopListening()
            return
        }
        currentIndex += 1
        transcript = ""
        if autoStarted || autoAdvance {
            beginListeningForCurrentSentence()
        } else {
            statusMessage = "Moved to sentence \(currentIndex + 1). Tap Start Listening when ready."
        }
    }

    private func resetStoryFlow() {
        speech.stopListening()
        started = false
        sentences = []
        currentIndex = 0
        transcript = ""
        lastScore = nil
        statusMessage = "Paste or select a short story to begin."
        failedSentenceIndexes.removeAll()
    }

    @MainActor
    private func generateStory() async {
        let cleanedKey = geminiApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedKey.isEmpty else {
            generationMessage = "Please add your Gemini API key first."
            return
        }

        isGeneratingStory = true
        generationMessage = "Generating story..."
        defer { isGeneratingStory = false }

        do {
            let request = StoryGenerationRequest(
                level: cefrLevel.rawValue,
                topic: storyTopic.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "daily life" : storyTopic,
                targetWordCount: Int(desiredWordCount),
                targetWords: parsedTargetWords(from: targetWordsInput)
            )

            let generated = try await GeminiStoryGenerator().generateStory(apiKey: cleanedKey, request: request)
            storyText = generated
            selectedSample = .none
            generationMessage = "Story ready. Review it, then tap Start Reading."
            statusMessage = "AI story generated successfully."
        } catch let error as StoryGeneratorError {
            generationMessage = error.localizedDescription
        } catch {
            generationMessage = "Could not generate story: \(error.localizedDescription)"
        }
    }

    private func parsedTargetWords(from input: String) -> [String] {
        input
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    private func sentenceSplit(from text: String) -> [String] {
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        let parts = cleaned.components(separatedBy: CharacterSet(charactersIn: ".!?"))
        let sentences = parts
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        return sentences
    }

    private func wordCount(_ text: String) -> Int {
        text.split { $0.isWhitespace || $0.isNewline }.count
    }

    private func backgroundColor(isCurrent: Bool, failed: Bool) -> Color {
        if isCurrent && failed { return .red.opacity(0.25) }
        if isCurrent { return .blue.opacity(0.15) }
        if failed { return .red.opacity(0.15) }
        return Color(.secondarySystemBackground)
    }
}

enum CEFRLevel: String, CaseIterable, Identifiable {
    case a1 = "A1"
    case a2 = "A2"
    case b1 = "B1"
    case b2 = "B2"

    var id: String { rawValue }
}

struct StoryGenerationRequest {
    let level: String
    let topic: String
    let targetWordCount: Int
    let targetWords: [String]
}

enum StoryGeneratorError: LocalizedError {
    case badResponse
    case noText
    case apiError(String)

    var errorDescription: String? {
        switch self {
        case .badResponse:
            return "Invalid response from Gemini API."
        case .noText:
            return "Gemini returned no story text. Try again."
        case .apiError(let message):
            return "Gemini API error: \(message)"
        }
    }
}

struct GeminiStoryGenerator {
    func generateStory(apiKey: String, request: StoryGenerationRequest) async throws -> String {
        guard let url = URL(
            string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\(apiKey)"
        ) else {
            throw StoryGeneratorError.badResponse
        }

        let prompt = makePrompt(request: request)
        let body = GenerateContentRequest(
            contents: [
                .init(parts: [.init(text: prompt)])
            ],
            generationConfig: .init(temperature: 0.8, maxOutputTokens: 700)
        )

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw StoryGeneratorError.badResponse
        }

        if !(200...299).contains(httpResponse.statusCode) {
            if let errorPayload = try? JSONDecoder().decode(GeminiAPIErrorResponse.self, from: data) {
                throw StoryGeneratorError.apiError(errorPayload.error.message)
            }
            throw StoryGeneratorError.apiError("HTTP \(httpResponse.statusCode)")
        }

        let decoded = try JSONDecoder().decode(GenerateContentResponse.self, from: data)
        let fullText = decoded.candidates?
            .compactMap { $0.content.parts?.compactMap(\.text).joined(separator: "\n") }
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let fullText, !fullText.isEmpty else {
            throw StoryGeneratorError.noText
        }

        return fullText
    }

    private func makePrompt(request: StoryGenerationRequest) -> String {
        let wordsLine: String
        if request.targetWords.isEmpty {
            wordsLine = "- Target words: none required"
        } else {
            wordsLine = "- Include these words naturally: \(request.targetWords.joined(separator: ", "))"
        }

        return """
        Create one short English reading story for language learners.
        Requirements:
        - CEFR level: \(request.level)
        - Topic: \(request.topic)
        - Length: approximately \(request.targetWordCount) words, and never above 500 words
        - Use clear, short sentences
        - Avoid slang and difficult idioms
        \(wordsLine)
        Output only the story text. Do not include headings, explanations, or bullet points.
        """
    }
}

private struct GenerateContentRequest: Encodable {
    let contents: [RequestContent]
    let generationConfig: GenerationConfig?
}

private struct RequestContent: Encodable {
    let parts: [RequestPart]
}

private struct RequestPart: Encodable {
    let text: String
}

private struct GenerationConfig: Encodable {
    let temperature: Double?
    let maxOutputTokens: Int?
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

private struct GeminiAPIErrorResponse: Decodable {
    struct APIError: Decodable {
        let message: String
    }

    let error: APIError
}

enum StorySample: String, CaseIterable, Identifiable {
    case none
    case morningWalk
    case libraryVisit

    var id: String { rawValue }

    var title: String {
        switch self {
        case .none: return "None"
        case .morningWalk: return "Morning Walk"
        case .libraryVisit: return "Library Visit"
        }
    }

    var text: String {
        switch self {
        case .none:
            return ""
        case .morningWalk:
            return "Every morning, Emma walks to the park before breakfast. She listens to the birds and watches the sky change color. The fresh air helps her feel calm and focused for the day."
        case .libraryVisit:
            return "After school, Leo goes to the library to study English. He reads one short story and writes down five new words. Then he practices saying each sentence out loud."
        }
    }
}

enum SentenceMatcher {
    static func score(expected: String, spoken: String) -> Double {
        let expectedTokens = normalize(expected)
        let spokenTokens = normalize(spoken)

        guard !expectedTokens.isEmpty else { return 0 }

        let distance = levenshtein(expectedTokens, spokenTokens)
        let maxLen = max(expectedTokens.count, spokenTokens.count)
        if maxLen == 0 { return 100 }
        let similarity = 1.0 - (Double(distance) / Double(maxLen))
        return max(0, min(100, similarity * 100))
    }

    private static func normalize(_ sentence: String) -> [String] {
        sentence
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9\\s]", with: "", options: .regularExpression)
            .split(separator: " ")
            .map(String.init)
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

    func startListening(
        onTranscript: @escaping (String) -> Void,
        onFinalResult: @escaping (String) -> Void
    ) {
        stopListening()
        self.onTranscript = onTranscript
        self.onFinalResult = onFinalResult

        guard let recognizer, recognizer.isAvailable else {
            showError("Speech recognizer is unavailable.")
            return
        }

        do {
            try configureAudioSession()
            request = SFSpeechAudioBufferRecognitionRequest()
            guard let request else {
                showError("Could not create speech request.")
                return
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

                if let result {
                    let text = result.bestTranscription.formattedString
                    self.onTranscript?(text)
                    if result.isFinal {
                        self.stopListening()
                        self.onFinalResult?(text)
                    }
                }

                if let error {
                    self.stopListening()
                    self.showError("Speech recognition failed: \(error.localizedDescription)")
                }
            }
        } catch {
            stopListening()
            showError("Unable to start listening: \(error.localizedDescription)")
        }
    }

    func stopListening() {
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
        if isListening {
            stopListening()
        }
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
}
