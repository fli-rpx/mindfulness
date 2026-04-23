package com.mindfulness.readingimprover

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.SpeechService
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.zip.ZipInputStream
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import android.speech.RecognitionListener as AndroidRecognitionListener
import org.vosk.android.RecognitionListener as VoskRecognitionListener

private const val VOSK_MODEL_URL =
    "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
private const val VOSK_MODEL_DIR_NAME = "vosk-model-small-en-us-0.15"
private const val NEKOSPEAK_RELEASES_URL = "https://github.com/siva-sub/NekoSpeak/releases"

class MainActivity : ComponentActivity() {
    private lateinit var speechController: AdaptiveSpeechController
    private lateinit var voskSpeechController: VoskSpeechController
    private lateinit var ttsController: AndroidTtsController
    private var micPermissionGranted by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val androidSpeechController = AndroidSpeechController(this)
        voskSpeechController = VoskSpeechController(this)
        speechController = AdaptiveSpeechController(androidSpeechController, voskSpeechController)
        ttsController = AndroidTtsController(this)
        micPermissionGranted = hasRecordAudioPermission()

        val permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { granted ->
            micPermissionGranted = granted
            speechController.onPermissionResult(granted)
        }

        setContent {
            MaterialTheme {
                ReadingImproverApp(
                    speechController = speechController,
                    voskSpeechController = voskSpeechController,
                    ttsController = ttsController,
                    hasRecordAudioPermission = micPermissionGranted,
                    onRequestMicPermission = {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        micPermissionGranted = hasRecordAudioPermission()
    }

    private fun hasRecordAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    override fun onDestroy() {
        super.onDestroy()
        speechController.release()
        ttsController.release()
    }
}

@Composable
fun ReadingImproverApp(
    speechController: AdaptiveSpeechController,
    voskSpeechController: VoskSpeechController,
    ttsController: AndroidTtsController,
    hasRecordAudioPermission: Boolean,
    onRequestMicPermission: () -> Unit
) {
    val requestMicPermission by rememberUpdatedState(onRequestMicPermission)
    val scope = rememberCoroutineScope()

    var storyText by remember { mutableStateOf("") }
    var sentences by remember { mutableStateOf(emptyList<String>()) }
    var currentIndex by remember { mutableStateOf(0) }
    var transcript by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Paste a short story to begin.") }
    var threshold by remember { mutableStateOf(70f) }
    var autoAdvance by remember { mutableStateOf(true) }
    var listening by remember { mutableStateOf(false) }
    var liveScore by remember { mutableStateOf<Float?>(null) }
    var lastScore by remember { mutableStateOf<Float?>(null) }
    var failedIndexes by remember { mutableStateOf(setOf<Int>()) }
    var started by remember { mutableStateOf(false) }
    var modelInstalled by remember { mutableStateOf(voskSpeechController.isModelInstalled()) }
    var modelDownloadProgress by remember { mutableStateOf(0) }
    var modelDownloadInProgress by remember { mutableStateOf(false) }
    var ttsDiagnosticsText by remember { mutableStateOf(buildTtsDiagnosticsText(ttsController.diagnostics())) }

    val currentSentence = sentences.getOrNull(currentIndex).orEmpty()
    val effectiveThreshold = remember(currentSentence, threshold) {
        effectiveThreshold(currentSentence, threshold)
    }
    val latestCurrentSentence by rememberUpdatedState(currentSentence)
    val latestEffectiveThreshold by rememberUpdatedState(effectiveThreshold)
    val latestAutoAdvance by rememberUpdatedState(autoAdvance)
    val latestSentences by rememberUpdatedState(sentences)
    val latestCurrentIndex by rememberUpdatedState(currentIndex)

    LaunchedEffect(modelInstalled) {
        speechController.refresh()
    }

    LaunchedEffect(Unit) {
        ttsDiagnosticsText = buildTtsDiagnosticsText(ttsController.diagnostics())
    }

    LaunchedEffect(Unit) {
        speechController.events = object : SpeechEvents {
            override fun onListeningStarted() {
                listening = true
                status = "Listening... read the sentence aloud."
            }

            override fun onPartialResult(text: String) {
                transcript = text
                if (text.isBlank()) return
                val sentence = latestCurrentSentence
                if (sentence.isBlank()) return
                val score = sentenceScore(sentence, text)
                liveScore = score
                if (latestAutoAdvance && score >= latestEffectiveThreshold && latestSentences.isNotEmpty()) {
                    val index = latestCurrentIndex
                    lastScore = score
                    failedIndexes = failedIndexes - index
                    listening = false
                    speechController.stopListening()
                    if (index < latestSentences.lastIndex) {
                        currentIndex = index + 1
                        transcript = ""
                        liveScore = null
                        lastScore = null
                        status = "Passed live threshold. Moving to next sentence."
                        speechController.startListening()
                    } else {
                        status = "Finished all sentences. Nice work."
                    }
                }
            }

            override fun onFinalResult(text: String) {
                if (text.isNotBlank()) {
                    transcript = text
                    val sentence = latestCurrentSentence
                    if (sentence.isNotBlank()) {
                        liveScore = sentenceScore(sentence, text)
                    }
                }
            }

            override fun onError(message: String) {
                listening = false
                status = message
            }

            override fun onListeningEnded() {
                listening = false
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            speechController.stopListening()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        if (!started) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.Top
            ) {
                Text(
                    text = "Reading Improver",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = storyText,
                    onValueChange = { storyText = it },
                    label = { Text("Story text (<= 500 words)") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences)
                )

                Spacer(modifier = Modifier.height(10.dp))
                Text(text = "Match threshold: ${threshold.roundToInt()}%")
                Slider(
                    value = threshold,
                    onValueChange = { threshold = it },
                    valueRange = 50f..95f
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = autoAdvance, onCheckedChange = { autoAdvance = it })
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Auto move to next sentence on pass")
                }

                Spacer(modifier = Modifier.height(10.dp))
                if (!modelInstalled) {
                    Button(
                        onClick = {
                            modelDownloadInProgress = true
                            modelDownloadProgress = 0
                            status = "Downloading offline speech model..."
                            scope.launch {
                                val success = downloadAndInstallVoskModel(
                                    context = voskSpeechController.context,
                                    onProgress = { progress ->
                                        modelDownloadProgress = progress
                                    }
                                )
                                modelDownloadInProgress = false
                                if (success) {
                                    modelInstalled = true
                                    status = "Offline model installed. Vosk is now available."
                                } else {
                                    status = "Offline model download failed. Check connection and try again."
                                }
                            }
                        },
                        enabled = !modelDownloadInProgress,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (modelDownloadInProgress) {
                                "Downloading model... ${modelDownloadProgress}%"
                            } else {
                                "Download Offline Model (~40MB)"
                            }
                        )
                    }
                } else {
                    Text(
                        text = "Offline model installed: $VOSK_MODEL_DIR_NAME",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = {
                            val opened = ttsController.openNekoSpeakDownloadPage()
                            status = if (opened) {
                                "Opened NekoSpeak releases page. Install APK, then set it as preferred TTS engine."
                            } else {
                                "Could not open NekoSpeak download page."
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Install NekoSpeak TTS")
                    }
                    Button(
                        onClick = {
                            val opened = ttsController.openTtsEngineSettings()
                            status = if (opened) {
                                "Opened TTS settings. Select NekoSpeak as preferred engine."
                            } else {
                                "Could not open TTS engine settings."
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Open TTS Settings")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        val wc = wordCount(storyText)
                        if (storyText.isBlank()) {
                            status = "Please paste a story first."
                            return@Button
                        }
                        if (wc > 500) {
                            status = "Story too long. Keep it under 500 words."
                            return@Button
                        }
                        val parsed = splitSentences(storyText)
                        if (parsed.isEmpty()) {
                            status = "No valid sentence found."
                            return@Button
                        }
                        sentences = parsed
                        currentIndex = 0
                        transcript = ""
                        liveScore = null
                        lastScore = null
                        failedIndexes = emptySet()
                        started = true
                        status = "Story loaded. Tap Start Listening."
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Start Reading")
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(text = status, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Speech engine: ${speechController.engineName}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = ttsDiagnosticsText,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            return@Box
        }

        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Sentence ${currentIndex + 1} of ${sentences.size}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(modifier = Modifier.height(140.dp)) {
                itemsIndexed(sentences) { index, sentence ->
                    val isCurrent = index == currentIndex
                    val isFailed = failedIndexes.contains(index)
                    val background = when {
                        isCurrent && isFailed -> Color(0xFFFFE3E3)
                        isCurrent -> Color(0xFFE7F0FF)
                        isFailed -> Color(0xFFFFF2F2)
                        else -> Color(0xFFF7F7F7)
                    }
                    Text(
                        text = "${index + 1}. $sentence",
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .background(background, RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            InfoCard(title = "Current Sentence", body = currentSentence)
            Spacer(modifier = Modifier.height(8.dp))
            InfoCard(title = "Transcript", body = if (transcript.isBlank()) "Start speaking..." else transcript)
            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = {
                        if (!hasRecordAudioPermission) {
                            requestMicPermission()
                            status = "Mic permission requested."
                            return@Button
                        }
                        if (listening) {
                            speechController.stopListening()
                            listening = false
                            val cleaned = transcript.trim()
                            if (cleaned.isBlank()) {
                                status = "No speech captured. Please try again."
                            } else {
                                val score = sentenceScore(currentSentence, cleaned)
                                liveScore = score
                                lastScore = score
                                if (score >= effectiveThreshold) {
                                    failedIndexes = failedIndexes - currentIndex
                                    status = "Great. Passed with ${score.roundToInt()}%."
                                    if (autoAdvance && currentIndex < sentences.lastIndex) {
                                        currentIndex += 1
                                        transcript = ""
                                        liveScore = null
                                        lastScore = null
                                    }
                                } else {
                                    failedIndexes = failedIndexes + currentIndex
                                    status = "Score ${score.roundToInt()}% below ${effectiveThreshold.roundToInt()}%. Repeat this sentence."
                                    ttsController.speak(currentSentence)
                                }
                            }
                        } else {
                            speechController.startListening()
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (listening) "Stop Listening" else "Start Listening")
                }

                Button(
                    onClick = {
                        if (currentSentence.isBlank()) {
                            status = "No sentence available yet."
                            return@Button
                        }
                        when (ttsController.speak(currentSentence)) {
                            TtsSpeakResult.SUCCESS -> {
                                status = if (ttsController.isMediaVolumeLow()) {
                                    "Playing sentence audio. Media volume is very low; raise phone media volume."
                                } else {
                                    "Playing sentence audio."
                                }
                            }
                            TtsSpeakResult.INITIALIZING -> {
                                status = "TTS is initializing. Try Hear Sentence again in a moment."
                            }
                            TtsSpeakResult.NEEDS_VOICE_DATA -> {
                                val opened = ttsController.openVoiceDataSettings()
                                status = if (opened) {
                                    "Voice data still missing for this TTS engine. Install/enable English voice, then return."
                                } else {
                                    "TTS needs voice data, but settings could not be opened automatically."
                                }
                            }
                            TtsSpeakResult.ERROR -> {
                                status = "TTS engine did not respond. Retrying initialization; tap Hear Sentence again."
                            }
                        }
                        ttsDiagnosticsText = buildTtsDiagnosticsText(ttsController.diagnostics())
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Hear Sentence")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = {
                        if (currentIndex < sentences.lastIndex) {
                            currentIndex += 1
                            transcript = ""
                            liveScore = null
                            lastScore = null
                            status = "Moved to next sentence."
                            if (autoAdvance) {
                                speechController.startListening()
                            }
                        } else {
                            status = "Already at last sentence."
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Next Sentence")
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            ScoreRow("Live Score", liveScore)
            ScoreRow("Last Match Score", lastScore)
            ScoreRow("Effective Threshold", effectiveThreshold)

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = status,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Start
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Speech engine: ${speechController.engineName}",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = ttsDiagnosticsText,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = {
                    speechController.stopListening()
                    started = false
                    listening = false
                    sentences = emptyList()
                    status = "Paste a short story to begin."
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Use New Story")
            }
        }
    }
}

@Composable
private fun InfoCard(title: String, body: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = body)
        }
    }
}

@Composable
private fun ScoreRow(label: String, value: Float?) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            text = value?.let { "${it.roundToInt()}%" } ?: "--",
            fontWeight = FontWeight.Bold
        )
    }
    Spacer(modifier = Modifier.height(6.dp))
}

private suspend fun downloadAndInstallVoskModel(
    context: Context,
    onProgress: suspend (Int) -> Unit
): Boolean = withContext(Dispatchers.IO) {
    try {
        val storageRoot = File(context.filesDir, "vosk")
        if (!storageRoot.exists()) {
            storageRoot.mkdirs()
        }

        val zipFile = File(storageRoot, "$VOSK_MODEL_DIR_NAME.zip")
        val connection = URL(VOSK_MODEL_URL).openConnection() as HttpURLConnection
        connection.connectTimeout = 15_000
        connection.readTimeout = 60_000
        connection.requestMethod = "GET"
        connection.connect()

        if (connection.responseCode !in 200..299) {
            return@withContext false
        }

        val contentLength = connection.contentLengthLong
        connection.inputStream.use { input ->
            FileOutputStream(zipFile).use { output ->
                val buffer = ByteArray(8 * 1024)
                var bytesRead: Int
                var totalRead = 0L
                var lastProgress = -1
                while (input.read(buffer).also { bytesRead = it } >= 0) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                    if (contentLength > 0) {
                        val progress = ((totalRead * 100) / contentLength).toInt().coerceIn(0, 100)
                        if (progress != lastProgress) {
                            lastProgress = progress
                            withContext(Dispatchers.Main) { onProgress(progress) }
                        }
                    }
                }
            }
        }
        connection.disconnect()

        val targetDir = File(storageRoot, VOSK_MODEL_DIR_NAME)
        if (targetDir.exists()) {
            targetDir.deleteRecursively()
        }

        unzip(zipFile, storageRoot)
        zipFile.delete()
        File(targetDir, "conf/model.conf").exists()
    } catch (_: Exception) {
        false
    }
}

private fun unzip(zipFile: File, destinationDir: File) {
    ZipInputStream(zipFile.inputStream().buffered()).use { zip ->
        var entry = zip.nextEntry
        while (entry != null) {
            val outFile = File(destinationDir, entry.name)
            if (entry.isDirectory) {
                outFile.mkdirs()
            } else {
                outFile.parentFile?.mkdirs()
                FileOutputStream(outFile).use { output ->
                    zip.copyTo(output)
                }
            }
            zip.closeEntry()
            entry = zip.nextEntry
        }
    }
}

private fun splitSentences(text: String): List<String> {
    val cleaned = text.replace(Regex("\\s+"), " ").trim()
    if (cleaned.isBlank()) return emptyList()
    return Regex("[^.!?]+[.!?]?").findAll(cleaned).map { it.value.trim() }.filter { it.isNotEmpty() }.toList()
}

private fun wordCount(text: String): Int = Regex("\\S+").findAll(text.trim()).count()

private fun normalizeTokens(text: String): List<String> {
    return text.lowercase(Locale.US)
        .replace(Regex("[^a-z0-9\\s]"), " ")
        .split(Regex("\\s+"))
        .filter { it.isNotBlank() }
        .map(::stem)
}

private fun stem(token: String): String {
    return when {
        token.length > 4 && token.endsWith("ing") -> token.dropLast(3)
        token.length > 3 && token.endsWith("ed") -> token.dropLast(2)
        token.length > 3 && token.endsWith("es") -> token.dropLast(2)
        token.length > 2 && token.endsWith("s") -> token.dropLast(1)
        else -> token
    }
}

private fun sentenceScore(expected: String, spoken: String): Float {
    val expectedTokens = normalizeTokens(expected)
    val spokenTokens = normalizeTokens(spoken)
    if (expectedTokens.isEmpty()) return 0f

    val tokenSim = distanceSimilarity(
        levenshtein(expectedTokens, spokenTokens),
        max(expectedTokens.size, spokenTokens.size)
    )

    if (max(expectedTokens.size, spokenTokens.size) <= 3) {
        val expectedChars = expectedTokens.joinToString(" ").toList()
        val spokenChars = spokenTokens.joinToString(" ").toList()
        val charSim = distanceSimilarity(
            levenshtein(expectedChars, spokenChars),
            max(expectedChars.size, spokenChars.size)
        )
        return ((tokenSim * 0.6f + charSim * 0.4f) * 100f).coerceIn(0f, 100f)
    }
    return (tokenSim * 100f).coerceIn(0f, 100f)
}

private fun effectiveThreshold(sentence: String, base: Float): Float {
    val count = normalizeTokens(sentence).size
    val adjustment = when {
        count <= 2 -> 20f
        count == 3 -> 15f
        count == 4 -> 10f
        count == 5 -> 5f
        else -> 0f
    }
    return max(50f, base - adjustment)
}

private fun distanceSimilarity(distance: Int, maxLen: Int): Float {
    if (maxLen == 0) return 1f
    return 1f - distance.toFloat() / maxLen.toFloat()
}

private fun <T> levenshtein(a: List<T>, b: List<T>): Int {
    if (a.isEmpty()) return b.size
    if (b.isEmpty()) return a.size
    val dp = Array(a.size + 1) { IntArray(b.size + 1) }
    for (i in a.indices) dp[i + 1][0] = i + 1
    for (j in b.indices) dp[0][j + 1] = j + 1
    for (i in a.indices) {
        for (j in b.indices) {
            val cost = if (a[i] == b[j]) 0 else 1
            dp[i + 1][j + 1] = min(
                min(dp[i][j + 1] + 1, dp[i + 1][j] + 1),
                dp[i][j] + cost
            )
        }
    }
    return dp[a.size][b.size]
}

interface SpeechEvents {
    fun onListeningStarted()
    fun onPartialResult(text: String)
    fun onFinalResult(text: String)
    fun onError(message: String)
    fun onListeningEnded()
}

interface SpeechEngineController {
    val engineName: String
    var events: SpeechEvents?
    fun isAvailable(): Boolean
    fun startListening()
    fun stopListening()
    fun onPermissionResult(granted: Boolean)
    fun release()
}

class AdaptiveSpeechController(
    private val androidController: AndroidSpeechController,
    private val voskController: VoskSpeechController
) : SpeechEngineController {
    private enum class Engine {
        ANDROID, VOSK, NONE
    }

    private var activeEngine: Engine = Engine.NONE
    private var isSwitchingToVosk = false

    override var events: SpeechEvents? = null
        set(value) {
            field = value
            bindControllerCallbacks()
        }

    override val engineName: String
        get() = when (activeEngine) {
            Engine.ANDROID -> androidController.engineName
            Engine.VOSK -> voskController.engineName
            Engine.NONE -> when {
                androidController.isAvailable() -> androidController.engineName
                voskController.isAvailable() -> voskController.engineName
                else -> "No speech engine available"
            }
        }

    private fun bindControllerCallbacks() {
        androidController.events = object : SpeechEvents {
            override fun onListeningStarted() {
                activeEngine = Engine.ANDROID
                isSwitchingToVosk = false
                events?.onListeningStarted()
            }

            override fun onPartialResult(text: String) {
                events?.onPartialResult(text)
            }

            override fun onFinalResult(text: String) {
                events?.onFinalResult(text)
            }

            override fun onError(message: String) {
                if (!isSwitchingToVosk && voskController.isAvailable()) {
                    isSwitchingToVosk = true
                    activeEngine = Engine.VOSK
                    androidController.stopListening()
                    events?.onError("$message Switching to offline Vosk.")
                    voskController.startListening()
                    return
                }
                isSwitchingToVosk = false
                events?.onError(message)
            }

            override fun onListeningEnded() {
                events?.onListeningEnded()
            }
        }

        voskController.events = object : SpeechEvents {
            override fun onListeningStarted() {
                activeEngine = Engine.VOSK
                isSwitchingToVosk = false
                events?.onListeningStarted()
            }

            override fun onPartialResult(text: String) {
                events?.onPartialResult(text)
            }

            override fun onFinalResult(text: String) {
                events?.onFinalResult(text)
            }

            override fun onError(message: String) {
                isSwitchingToVosk = false
                events?.onError(message)
            }

            override fun onListeningEnded() {
                events?.onListeningEnded()
            }
        }
    }

    override fun isAvailable(): Boolean = androidController.isAvailable() || voskController.isAvailable()

    override fun startListening() {
        isSwitchingToVosk = false
        when {
            androidController.isAvailable() -> {
                activeEngine = Engine.ANDROID
                androidController.startListening()
            }
            voskController.isAvailable() -> {
                activeEngine = Engine.VOSK
                voskController.startListening()
            }
            else -> events?.onError("No speech engine available. Install offline model.")
        }
    }

    override fun stopListening() {
        isSwitchingToVosk = false
        androidController.stopListening()
        voskController.stopListening()
    }

    override fun onPermissionResult(granted: Boolean) {
        androidController.onPermissionResult(granted)
        voskController.onPermissionResult(granted)
    }

    override fun release() {
        androidController.release()
        voskController.release()
    }

    fun refresh() {
        voskController.refreshModel()
    }
}

class AndroidSpeechController(private val context: Context) : SpeechEngineController {
    override val engineName: String = "Android SpeechRecognizer"
    override var events: SpeechEvents? = null
    private var recognizer: SpeechRecognizer? = null

    override fun isAvailable(): Boolean = SpeechRecognizer.isRecognitionAvailable(context)

    override fun startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            events?.onError("Speech recognition is not available on this device.")
            return
        }
        stopListening()
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toLanguageTag())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        recognizer = SpeechRecognizer.createSpeechRecognizer(context).also { sr ->
            sr.setRecognitionListener(object : AndroidRecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    events?.onListeningStarted()
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {
                    events?.onListeningEnded()
                }

                override fun onError(error: Int) {
                    val message = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> "Audio capture error."
                        SpeechRecognizer.ERROR_CLIENT -> "Speech client error."
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission denied."
                        SpeechRecognizer.ERROR_NETWORK,
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech network error."
                        SpeechRecognizer.ERROR_NO_MATCH -> "No clear speech match. Try again."
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy. Retry in a second."
                        SpeechRecognizer.ERROR_SERVER -> "Speech server error."
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected."
                        else -> "Speech recognition failed."
                    }
                    events?.onError(message)
                }

                override fun onResults(results: Bundle?) {
                    val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        .orEmpty()
                    events?.onFinalResult(text)
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val text = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        .orEmpty()
                    events?.onPartialResult(text)
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
            sr.startListening(intent)
        }
    }

    override fun stopListening() {
        recognizer?.stopListening()
        recognizer?.cancel()
        recognizer?.destroy()
        recognizer = null
    }

    override fun onPermissionResult(granted: Boolean) {
        if (!granted) {
            events?.onError("Microphone permission denied.")
        }
    }

    override fun release() {
        stopListening()
    }
}

class VoskSpeechController(val context: Context) : SpeechEngineController {
    override val engineName: String = "Vosk offline"
    override var events: SpeechEvents? = null
    private var model: Model? = null
    private var service: SpeechService? = null
    private var recognizer: Recognizer? = null
    private val modelPath = File(context.filesDir, "vosk/$VOSK_MODEL_DIR_NAME")

    override fun isAvailable(): Boolean = isModelInstalled()

    fun isModelInstalled(): Boolean = File(modelPath, "conf/model.conf").exists()

    fun refreshModel() {
        if (model == null && isModelInstalled()) {
            try {
                model = Model(modelPath.absolutePath)
            } catch (_: Exception) {
                model = null
            }
        }
    }

    override fun startListening() {
        if (!isModelInstalled()) {
            events?.onError("Offline model not installed yet. Download it on setup screen.")
            return
        }
        if (model == null) {
            refreshModel()
        }
        val loadedModel = model ?: run {
            events?.onError("Failed to load offline model.")
            return
        }

        stopListening()
        try {
            recognizer = Recognizer(loadedModel, 16000.0f)
            service = SpeechService(recognizer, 16000.0f)
            events?.onListeningStarted()
            service?.startListening(object : VoskRecognitionListener {
                override fun onResult(hypothesis: String?) {
                    // Vosk can emit segmented results here; we use final callback to avoid duplicate scoring.
                }

                override fun onFinalResult(hypothesis: String?) {
                    val value = parseHypothesis(hypothesis.orEmpty(), "text")
                    if (value.isNotBlank()) {
                        events?.onFinalResult(value)
                    }
                }

                override fun onPartialResult(hypothesis: String?) {
                    val partial = parseHypothesis(hypothesis.orEmpty(), "partial")
                    if (partial.isNotBlank()) {
                        events?.onPartialResult(partial)
                    }
                }

                override fun onError(e: Exception?) {
                    events?.onError(e?.message ?: "Offline speech engine failed.")
                }

                override fun onTimeout() {
                    events?.onListeningEnded()
                }
            })
        } catch (_: Exception) {
            events?.onError("Offline speech engine failed to start.")
        }
    }

    override fun stopListening() {
        service?.stop()
        service?.shutdown()
        service = null
        try {
            recognizer?.close()
        } catch (_: Exception) {
            // no-op
        }
        recognizer = null
    }

    override fun onPermissionResult(granted: Boolean) {
        if (!granted) {
            events?.onError("Microphone permission denied.")
        }
    }

    override fun release() {
        stopListening()
        try {
            model?.close()
        } catch (_: Exception) {
            // no-op
        }
        model = null
    }
}

private fun parseHypothesis(json: String, key: String): String {
    return try {
        JSONObject(json).optString(key, "")
    } catch (_: Exception) {
        ""
    }
}

private fun buildTtsDiagnosticsText(info: TtsDiagnostics): String {
    val engineNames = if (info.installedEngines.isEmpty()) "none" else info.installedEngines.joinToString("|")
    return "TTS diag: engine=${info.defaultEngine ?: "unknown"}, voice=${info.currentVoiceLocale ?: "none"}, englishVoices=${info.englishVoiceCount}, engines=${info.installedEngineCount}, engineList=$engineNames, ready=${info.ready}, initializing=${info.initializing}, lang=${languageResultLabel(info.lastLanguageResult)}"
}

private fun languageResultLabel(code: Int): String {
    return when (code) {
        TextToSpeech.LANG_AVAILABLE -> "LANG_AVAILABLE"
        TextToSpeech.LANG_COUNTRY_AVAILABLE -> "LANG_COUNTRY_AVAILABLE"
        TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE -> "LANG_COUNTRY_VAR_AVAILABLE"
        TextToSpeech.LANG_MISSING_DATA -> "LANG_MISSING_DATA"
        TextToSpeech.LANG_NOT_SUPPORTED -> "LANG_NOT_SUPPORTED"
        else -> "UNKNOWN($code)"
    }
}

class AndroidTtsController(context: Context) {
    private val appContext = context.applicationContext
    private val initContext = context
    private val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private var tts: TextToSpeech? = null
    private var ready = false
    private var isInitializing = false
    private var pendingText: String? = null
    private var lastLanguageResult: Int = TextToSpeech.LANG_AVAILABLE
    private var attemptedEngines: Set<String> = emptySet()
    private val preferredEngineCandidates = listOf(
        "com.nekospeak.tts",
        "com.google.android.tts",
        "com.samsung.SMT",
        "com.svox.pico"
    )

    init {
        initEngine(chooseInitialEnginePackage())
    }

    private fun initEngine(enginePackage: String? = null) {
        isInitializing = true
        enginePackage?.let {
            attemptedEngines = attemptedEngines + it
        }
        tts?.shutdown()
        tts = if (enginePackage.isNullOrBlank()) {
            TextToSpeech(initContext) { status ->
                onInitResult(status, enginePackage)
            }
        } else {
            TextToSpeech(initContext, { status ->
                onInitResult(status, enginePackage)
            }, enginePackage)
        }
    }

    private fun onInitResult(status: Int, usedEnginePackage: String?) {
        isInitializing = false
        if (status == TextToSpeech.SUCCESS) {
            // Engine initialized. We keep TTS usable even if preferred language lookup fails.
            ready = true
            attemptedEngines = emptySet()
            lastLanguageResult = selectBestEnglishVoice()
            tts?.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            tts?.setSpeechRate(0.45f)
            val queued = pendingText
            if (!queued.isNullOrBlank()) {
                pendingText = null
                speakInternal(queued)
            }
        } else {
            ready = false
            lastLanguageResult = TextToSpeech.LANG_NOT_SUPPORTED

            val orderedCandidates = buildList {
                val systemDefault = Settings.Secure.getString(
                    appContext.contentResolver,
                    Settings.Secure.TTS_DEFAULT_SYNTH
                )
                if (!systemDefault.isNullOrBlank()) add(systemDefault)
                addAll(preferredEngineCandidates)
            }.distinct()

            val nextEngine = orderedCandidates.firstOrNull { pkg ->
                pkg != usedEnginePackage &&
                    !attemptedEngines.contains(pkg) &&
                    isEnginePackageInstalled(pkg)
            }
            if (!nextEngine.isNullOrBlank()) {
                initEngine(nextEngine)
                return
            }
        }
    }

    private fun discoverEnginePackages(): List<String> {
        return try {
            val intent = Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE)
            appContext.packageManager
                .queryIntentServices(intent, PackageManager.MATCH_ALL)
                .mapNotNull { it.serviceInfo?.packageName }
                .distinct()
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun chooseInitialEnginePackage(): String? {
        val installed = discoverEnginePackages().toSet()
        if (installed.contains("com.nekospeak.tts")) return "com.nekospeak.tts"

        val systemDefault = Settings.Secure.getString(
            appContext.contentResolver,
            Settings.Secure.TTS_DEFAULT_SYNTH
        )
        if (!systemDefault.isNullOrBlank() && isEnginePackageInstalled(systemDefault)) {
            return systemDefault
        }
        return null
    }

    private fun isEnginePackageInstalled(packageName: String): Boolean {
        return try {
            appContext.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun selectBestEnglishVoice(): Int {
        val engine = tts ?: return TextToSpeech.LANG_NOT_SUPPORTED

        val localeCandidates = linkedSetOf(
            Locale.getDefault(),
            Locale.US,
            Locale.UK,
            Locale.CANADA,
            Locale("en", "AU"),
            Locale.ENGLISH
        ).filter { it.language.equals("en", ignoreCase = true) }

        for (locale in localeCandidates) {
            val result = engine.setLanguage(locale)
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                return result
            }
        }

        // Some engines expose working English voices even when setLanguage() probes fail.
        val englishVoice = engine.voices
            ?.firstOrNull { voice ->
                voice.locale?.language.equals("en", ignoreCase = true)
            }

        if (englishVoice != null) {
            return try {
                val voiceResult = engine.setVoice(englishVoice)
                if (voiceResult == TextToSpeech.SUCCESS) {
                    TextToSpeech.LANG_AVAILABLE
                } else {
                    TextToSpeech.LANG_NOT_SUPPORTED
                }
            } catch (_: Exception) {
                TextToSpeech.LANG_NOT_SUPPORTED
            }
        }

        // Last-resort fallback: pick any available voice so the button can still speak.
        val anyVoice = engine.voices?.firstOrNull()
        if (anyVoice != null) {
            return try {
                val voiceResult = engine.setVoice(anyVoice)
                if (voiceResult == TextToSpeech.SUCCESS) {
                    TextToSpeech.LANG_AVAILABLE
                } else {
                    TextToSpeech.LANG_NOT_SUPPORTED
                }
            } catch (_: Exception) {
                TextToSpeech.LANG_NOT_SUPPORTED
            }
        }

        return TextToSpeech.LANG_NOT_SUPPORTED
    }

    fun speak(text: String): TtsSpeakResult {
        if (text.isBlank()) return TtsSpeakResult.ERROR
        if (isInitializing) {
            pendingText = text
            return TtsSpeakResult.INITIALIZING
        }
        if (!ready) {
            pendingText = text
            initEngine()
            return TtsSpeakResult.INITIALIZING
        }

        // Try speaking first; some engines can still speak even when language probes are pessimistic.
        if (speakInternal(text)) {
            return TtsSpeakResult.SUCCESS
        }

        // Retry by re-selecting voice once.
        lastLanguageResult = selectBestEnglishVoice()
        if (speakInternal(text)) {
            return TtsSpeakResult.SUCCESS
        }

        return if (
            lastLanguageResult == TextToSpeech.LANG_MISSING_DATA ||
            lastLanguageResult == TextToSpeech.LANG_NOT_SUPPORTED
        ) {
            TtsSpeakResult.NEEDS_VOICE_DATA
        } else {
            // Engine exists but failed this call; try one silent re-init.
            ready = false
            initEngine()
            TtsSpeakResult.ERROR
        }
    }

    private fun speakInternal(text: String): Boolean {
        tts?.stop()
        val params = Bundle().apply {
            putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC)
            putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
            putFloat(TextToSpeech.Engine.KEY_PARAM_PAN, 0.0f)
        }
        val status = tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "reading-improver-utterance")
        return status == TextToSpeech.SUCCESS
    }

    fun isMediaVolumeLow(): Boolean {
        val manager = audioManager ?: return false
        val max = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        if (max <= 0) return false
        val current = manager.getStreamVolume(AudioManager.STREAM_MUSIC)
        return current <= 1
    }

    fun openVoiceDataSettings(): Boolean {
        val intents = listOf(
            Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA),
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
            Intent(Settings.ACTION_SETTINGS)
        )
        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                appContext.startActivity(intent)
                return true
            } catch (_: Exception) {
                // try next fallback
            }
        }
        Log.w("AndroidTtsController", "Unable to open TTS voice settings")
        return false
    }

    fun openTtsEngineSettings(): Boolean {
        val intents = listOf(
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
            Intent(Settings.ACTION_SETTINGS)
        )
        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                appContext.startActivity(intent)
                return true
            } catch (_: Exception) {
                // try next fallback
            }
        }
        return false
    }

    fun openNekoSpeakDownloadPage(): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(NEKOSPEAK_RELEASES_URL)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            appContext.startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        ready = false
        isInitializing = false
    }

    fun diagnostics(): TtsDiagnostics {
        val engine = tts
        val voices = engine?.voices.orEmpty()
        val englishCount = voices.count { voice ->
            voice.locale?.language.equals("en", ignoreCase = true)
        }
        val installedEngines = try {
            val fromEngine = engine?.engines?.mapNotNull { info -> info.name } ?: emptyList()
            (fromEngine + discoverEnginePackages()).distinct()
        } catch (_: Exception) {
            discoverEnginePackages()
        }
        return TtsDiagnostics(
            ready = ready,
            initializing = isInitializing,
            lastLanguageResult = lastLanguageResult,
            defaultEngine = engine?.defaultEngine,
            currentVoiceLocale = engine?.voice?.locale?.toLanguageTag(),
            englishVoiceCount = englishCount,
            installedEngineCount = installedEngines.size,
            installedEngines = installedEngines
        )
    }

}

enum class TtsSpeakResult {
    SUCCESS,
    INITIALIZING,
    NEEDS_VOICE_DATA,
    ERROR
}

data class TtsDiagnostics(
    val ready: Boolean,
    val initializing: Boolean,
    val lastLanguageResult: Int,
    val defaultEngine: String?,
    val currentVoiceLocale: String?,
    val englishVoiceCount: Int,
    val installedEngineCount: Int,
    val installedEngines: List<String>
)
