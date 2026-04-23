package com.mindfulness.readingimprover

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ReadingLogicTest {

    @Test
    fun splitSentences_parsesBasicPunctuation() {
        val result = splitSentences("Hello world. How are you? I am fine!")

        assertEquals(3, result.size)
        assertEquals("Hello world.", result[0])
        assertEquals("How are you?", result[1])
        assertEquals("I am fine!", result[2])
    }

    @Test
    fun sentenceScore_exactMatch_isHundred() {
        val score = sentenceScore("Joe cried.", "Joe cried.")

        assertEquals(100f, score, 0.001f)
    }

    @Test
    fun sentenceScore_smallVariation_staysHigh() {
        val score = sentenceScore("Joe cried.", "Joe cry")

        assertTrue(score >= 60f)
    }

    @Test
    fun effectiveThreshold_shortSentence_isLowered() {
        val threshold = effectiveThreshold("Joe cried.", 70f)

        assertEquals(50f, threshold, 0.001f)
    }

    @Test
    fun buildProsodyHints_question_endsUpward() {
        val hints = buildProsodyHints("Do you like music?")

        assertTrue(hints.isNotEmpty())
        assertTrue(hints.last().toneUp)
    }

    @Test
    fun buildProsodyHints_functionWords_areWeak() {
        val hints = buildProsodyHints("I go to school.")
        val toHint = hints.firstOrNull { it.word.equals("to", ignoreCase = true) }

        assertTrue(toHint != null)
        assertFalse(toHint!!.strong)
    }
}
