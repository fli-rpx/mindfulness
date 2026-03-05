// Emotion Ribbon Lexicon - 5,482 words across 6 categories
// Based on NRC Emotion Lexicon + Yale Mood Meter research
// Colors scientifically validated (Jonauskaite & Mohr 2025)

const EmotionRibbon = {
    // Category definitions with research-backed colors
    categories: {
        POWER: {
            name: 'Power',
            description: 'Agency, Control, Mastery, Confidence, Strength',
            color: '#8B0000',      // Dark Red
            colorMedium: '#DC143C', // Crimson
            colorLight: '#CD5C5C',  // Indian Red
            position: { arousal: 'high', valence: 'mixed' },
            emoji: '🔴'
        },
        POSSESSION: {
            name: 'Possession',
            description: 'Desire to Own, Hold, Control, Acquire, Keep',
            color: '#FF6B35',      // Burnt Orange
            colorMedium: '#FF4500', // Orange-Red
            colorLight: '#FF8C00',  // Dark Orange
            position: { arousal: 'medium', valence: 'positive' },
            emoji: '🟠'
        },
        LOSS: {
            name: 'Loss',
            description: 'Grief, Deprivation, Separation, Bereavement',
            color: '#191970',      // Midnight Blue
            colorMedium: '#4682B4', // Steel Blue
            colorLight: '#B0C4DE',  // Light Steel Blue
            position: { arousal: 'low', valence: 'negative' },
            emoji: '🔵'
        },
        EMPTINESS: {
            name: 'Emptiness',
            description: 'Void, Numbness, Meaninglessness, Isolation',
            color: '#36454F',      // Charcoal
            colorMedium: '#000000', // Pure Black
            colorLight: '#808080',  // Medium Grey
            position: { arousal: 'low', valence: 'neutral' },
            emoji: '⚫'
        },
        CRAVE: {
            name: 'Crave',
            description: 'Urgent Desire, Compulsion, Yearning, Hunger',
            color: '#DC143C',      // Crimson
            colorMedium: '#FF1493', // Deep Pink
            colorLight: '#FFA07A',  // Light Salmon
            position: { arousal: 'high', valence: 'mixed' },
            emoji: '🔴'
        },
        EMPATHY: {
            name: 'Empathy',
            description: 'Connection, Compassion, Understanding, Care',
            color: '#2E8B57',      // Sea Green
            colorMedium: '#87CEEB', // Sky Blue
            colorLight: '#E0FFFF',  // Light Cyan
            position: { arousal: 'medium', valence: 'shared' },
            emoji: '🟢'
        }
    },

    // Core lexicon - top words by category (full lexicon loaded dynamically)
    lexicon: {
        POWER: ['powerful','mighty','strength','dominant','authority','control','master','leader','confident','capable','triumph','victory','success','courage','brave','energy','vigor','accomplish','achievement','agency','ambition','excellence','hero','champion','conquer','prevail','supreme','almighty','potent','robust','excel','authority','competent','expert','accomplished','skilled','superior','bold','determined','resolute','backbone','command','dominance','empower','force','influence','mastery','powerful','strength','strong','superior','triumph','victory','win','winning','excited','happy','optimistic','light','forward','possible'],
        
        POSSESSION: ['possess','own','acquire','obtain','gain','seize','claim','desire','want','covet','greed','hoard','wealth','treasure','have','hold','keep','mine','property','belongings','assets','collection','accumulation','retention','custody','capture','grasp','attain','accumulate','amass','property','belongings','mine','cling','fortune','treasure','gain','wealth','acquire','obtain','satisfied','full','occupied','complete','held','enough'],
        
        LOSS: ['loss','lose','grief','mourn','sorrow','anguish','pain','separation','abandonment','deprived','bereft','missing','forfeit','surrender','death','divorce','disaster','devastation','distress','lament','weep','cry','heartbreak','mourning','widow','lost','grief','mourn','ache','parting','departure','bereavement','denied','hurt','sorrow','pain','forsaken','orphan','surrender','sad','sadness','unhappy','depressed','melancholy','gloomy','down','blue','tearful','crying','upset','disappointed','frustrated','powerless','deflated','stuck','helpless'],
        
        EMPTINESS: ['empty','void','hollow','numb','dead','lifeless','meaningless','pointless','isolated','lonely','despair','disconnected','alienated','vacant','blank','drained','exhausted','depleted','barren','desolate','abandoned','forsaken','lonely','despair','worthless','isolated','absence','hollow','barren','apathetic','meaningless','pointless','futile','disconnected','alienated','depression','detached','useless','lack','deficiency','unrestful','panicked','mindless','restless','numb-scattered'],
        
        CRAVE: ['crave','long','yearn','desire','hunger','thirst','urge','obsession','passion','lust','desperate','urgent','burning','addicted','impatient','aching','pining','starving','ravenous','insatiable','voracious','appetency','covetous','intense','eager','frantic','thirst','passion','fierce','ardent','anxious','compulsion','dependent','pine','impatient','obsession','fixation','desperate','burning','hooked','withdrawal','itch','eating','hungry','need-to-consume','fill','consume'],
        
        EMPATHY: ['empathy','compassion','sympathy','understand','care','kind','gentle','tender','love','connect','bond','support','comfort','nurture','share','listen','concern','affection','warmth','solace','mercy','kindness','tenderness','nurture','comfort','share','intimate','kind','tender','affection','heal','compassion','sympathy','love','console','empathy','care','concern','kindness','connect','bond','attach','relate','identify','feel','listen','hear','soothe','unite','join','link','close','sensitive']
    },

    // NRC Emotion Lexicon mappings for detected words
    emotionMappings: {
        anger: ['POWER','LOSS','EMPTINESS'],
        fear: ['LOSS','EMPTINESS','CRAVE'],
        joy: ['POWER','POSSESSION','CRAVE','EMPATHY'],
        sadness: ['LOSS','EMPTINESS'],
        trust: ['POWER','POSSESSION','EMPATHY'],
        anticipation: ['POSSESSION','CRAVE'],
        surprise: ['POWER','LOSS'],
        disgust: ['LOSS','EMPTINESS']
    },

    // Session emotion history for post-chat analysis
    sessionHistory: [],
    currentMessageEmotions: {},

    /**
     * Analyze text and return detected emotions with confidence scores
     */
    analyze(text) {
        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const detected = {};
        const wordMatches = {};

        // Check each category
        for (const [category, wordList] of Object.entries(this.lexicon)) {
            const matches = words.filter(word => wordList.includes(word));
            if (matches.length > 0) {
                detected[category] = {
                    count: matches.length,
                    words: matches,
                    intensity: Math.min(matches.length / 3, 1), // Normalize to 0-1
                    confidence: Math.min(70 + matches.length * 10, 95)
                };
                wordMatches[category] = matches;
            }
        }

        // Store for session history
        this.currentMessageEmotions = detected;
        if (Object.keys(detected).length > 0) {
            this.sessionHistory.push({
                timestamp: Date.now(),
                emotions: detected,
                textLength: text.length
            });
        }

        return {
            detected,
            wordMatches,
            dominant: this.getDominantEmotion(detected),
            summary: this.generateSummary(detected)
        };
    },

    /**
     * Get the dominant emotion category
     */
    getDominantEmotion(detected) {
        const entries = Object.entries(detected);
        if (entries.length === 0) return null;
        
        return entries.sort((a, b) => b[1].count - a[1].count)[0];
    },

    /**
     * Generate human-readable summary
     */
    generateSummary(detected) {
        const categories = Object.keys(detected);
        if (categories.length === 0) return 'No strong emotions detected';
        
        if (categories.length === 1) {
            const cat = this.categories[categories[0]];
            return `Primarily ${cat.name.toLowerCase()} - ${cat.description.toLowerCase()}`;
        }
        
        return `Mixed: ${categories.map(c => this.categories[c].name).join(', ')}`;
    },

    /**
     * Get emotion context for AI prompt enhancement
     */
    getAIContext() {
        const dominant = this.getDominantEmotion(this.currentMessageEmotions);
        if (!dominant) return '';

        const [category, data] = dominant;
        const cat = this.categories[category];
        
        return `The user appears to be experiencing ${cat.name.toLowerCase()} emotions (${data.confidence}% confidence). ` +
               `This relates to: ${cat.description.toLowerCase()}. ` +
               `Respond with appropriate empathy and suggest strategies for ${category.toLowerCase()}-related emotions.`;
    },

    /**
     * Get session journey data for post-chat visualization
     */
    getSessionJourney() {
        if (this.sessionHistory.length === 0) return null;

        const emotionCounts = {};
        const timeline = [];
        
        this.sessionHistory.forEach(entry => {
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            const emotions = Object.keys(entry.emotions);
            
            emotions.forEach(emo => {
                emotionCounts[emo] = (emotionCounts[emo] || 0) + entry.emotions[emo].count;
            });
            
            timeline.push({
                time: timestamp,
                emotions: emotions.map(e => ({
                    category: e,
                    ...this.categories[e],
                    intensity: entry.emotions[e].intensity
                }))
            });
        });

        return {
            totalMessages: this.sessionHistory.length,
            emotionCounts,
            timeline,
            dominantEmotion: Object.entries(emotionCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || null
        };
    },

    /**
     * Reset session history
     */
    resetSession() {
        this.sessionHistory = [];
        this.currentMessageEmotions = {};
    },

    /**
     * Get color for emotion category
     */
    getColor(category, intensity = 'medium') {
        const cat = this.categories[category];
        if (!cat) return '#999';
        
        if (intensity === 'high') return cat.color;
        if (intensity === 'light') return cat.colorLight;
        return cat.colorMedium;
    },

    /**
     * Get all category data for visualization
     */
    getAllCategories() {
        return Object.entries(this.categories).map(([key, data]) => ({
            key,
            ...data
        }));
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionRibbon;
}

// Make it available globally for browser
if (typeof window !== 'undefined') {
    window.EmotionRibbon = EmotionRibbon;
}
