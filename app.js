// Mindfulness Therapy - Enhanced JavaScript with Emotion Ribbon Integration
// Features: Power-Possession Cycle, AI Assessment with Emotion Ribbon, Micro-Interventions
// Copyright © 2026 Mindfulness Therapy. All rights reserved.

const app = {
    currentTab: 'home',
    currentStep: 0,
    answers: {},
    timerInterval: null,
    timerSeconds: 0,
    timerTotal: 0,
    isRunning: false,
    currentIntervention: null,

    // Emotion Ribbon Integration
    emotionRibbon: null,
    ribbonVisualizer: null,
    chatMessages: [],

    // Power-Possession Cycle Data
    cycleStates: {
        power: {
            name: 'Power',
            color: '#8B0000',
            bgColor: '#450a0a',
            description: 'External validation, feeling in control',
            triggers: ['Achievement', 'Recognition', 'Status gain'],
            strategies: ['Values grounding', 'Internal validation', 'Preventive balance']
        },
        possession: {
            name: 'Possession',
            color: '#FF6B35',
            bgColor: '#3b0764',
            description: 'Owning phase, attachment to external power',
            triggers: ['Control behaviors', 'Territoriality', 'Acquisition'],
            strategies: ['Letting go practice', 'Non-attachment', 'Impermanence awareness']
        },
        loss: {
            name: 'Loss',
            color: '#191970',
            bgColor: '#172554',
            description: 'Inevitable decline, external power fading',
            triggers: ['Status loss', 'Rejection', 'Failure'],
            strategies: ['Acceptance', 'Grief processing', 'Reality orientation']
        },
        emptiness: {
            name: 'Emptiness',
            color: '#36454F',
            bgColor: '#111827',
            description: 'Collapse, void when external validation gone',
            triggers: ['Isolation', 'Meaninglessness', 'Disconnection'],
            strategies: ['Somatic anchoring', 'Presence', 'Self-compassion']
        },
        craving: {
            name: 'Craving',
            color: '#DC143C',
            bgColor: '#451a03',
            description: 'Compulsive urge for substitute satisfaction',
            triggers: ['Emptiness', 'Boredom', 'Restlessness'],
            strategies: ['Urge surfing', 'Pattern interruption', 'Alternative satisfaction']
        },
        return: {
            name: 'Return',
            color: '#2E8B57',
            bgColor: '#052e16',
            description: 'Power-seeking behavior restarting cycle',
            triggers: ['Hope', 'Opportunity', 'New validation source'],
            strategies: ['Cycle awareness', 'Conscious choice', 'Break pattern']
        }
    },

    hoverTimeout: null,
    currentHoverState: null,

    // Salad Questions
    spicyQuestions: [
        { id: 'emotion_now', text: 'What emotion am I feeling most right now?', options: ['Anger', 'Fear', 'Shame', 'Emptiness', 'Powerlessness', 'Anxiety', 'Sadness'] },
        { id: 'body_location', text: 'Where in my body do I feel this emotion?', options: ['Chest tightness', 'Stomach knot', 'Heat in face', 'Cold hands', 'Tension in shoulders', 'Lump in throat', 'Cannot feel anything'] },
        { id: 'intensity', text: 'On a scale of 1-10, how intense is this feeling?', options: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Strong)', '9-10 (Overwhelming)'] },
        { id: 'trigger', text: 'What just happened before this feeling arose?', options: ['A loss', 'Rejection', 'Failure', 'Reminded of past', 'Conflict', 'Uncertainty', 'Nothing specific'] },
        { id: 'familiar', text: 'Does this feeling remind me of any past situation?', options: ['Childhood', 'Past relationship', 'Work situation', 'Family pattern', 'This is new', 'Happens often'] },
        { id: 'story', text: 'What story is my mind telling me?', options: ['I am not enough', 'I am losing control', 'I need to fix this', 'I am being abandoned', 'I must prove myself', 'Something else'] },
        { id: 'need', text: 'If this emotion could speak, what would it say it needs?', options: ['Safety', 'Connection', 'Recognition', 'Rest', 'Control', 'Love', 'Just to be heard'] }
    ],

    greasyQuestions: [
        { id: 'urge', text: 'What do I urgently want to do right now?', options: ['Reach out to someone', 'Seek attention', 'Escape/avoid', 'Control something', 'Prove myself', 'Get validation', 'Something else'] },
        { id: 'fixation', text: 'Is there a specific person or type of person I am fixating on?', options: ['Ex/partner', 'Authority figure', 'Someone I am attracted to', 'Family member', 'No one specific', 'A fantasy/ideal'] },
        { id: 'aftermath', text: 'If I acted on this urge, how would I feel immediately after?', options: ['Relieved temporarily', 'Ashamed', 'Empty', 'Powerful briefly', 'Regretful', 'Satisfied'] },
        { id: 'next_day', text: 'How would I feel the next day?', options: ['Regret', 'Same emptiness', 'Shame', 'Nothing changed', 'Briefly better', 'Worse than before'] },
        { id: 'avoiding', text: 'What would I be avoiding feeling if I gave in?', options: ['Emptiness', 'Powerlessness', 'Shame', 'Fear', 'Loneliness', 'I do not know'] },
        { id: 'greasy_food', text: 'What is the greasy food I am reaching for?', options: ['Attention/affection', 'Control/power', 'Validation', 'Escape', 'Temporary high', 'Sense of winning'] }
    ],

    vegetableQuestions: [
        { id: 'opposite', text: 'What would the opposite of this craving feel like?', options: ['Letting go', 'Being present', 'Accepting', 'Connecting genuinely', 'Resting', 'Being vulnerable'] },
        { id: 'true_need', text: 'What do I truly need right now?', options: ['Connection', 'Rest', 'Safety', 'Recognition', 'Purpose', 'Self-compassion', 'Truth'] },
        { id: 'genuine_connect', text: 'Is there someone I could connect with genuinely, without agenda?', options: ['Yes, a friend', 'Yes, family', 'A therapist/counselor', 'Not right now', 'I need to be alone first'] },
        { id: 'sit_with_it', text: 'What would it feel like to sit with this emotion for 5 minutes?', options: ['Scary but possible', 'Overwhelming', 'Like it would pass', 'I do not know', 'I have done it before'] },
        { id: 'proud_action', text: 'What is one small thing I could do to feel proud tomorrow?', options: ['Journal honestly', 'Reach out to someone', 'Complete a small task', 'Rest without guilt', 'Practice mindfulness', 'Set a boundary'] },
        { id: 'without_power', text: 'If I were not trying to feel powerful, what would I want?', options: ['Peace', 'Connection', 'Meaning', 'Rest', 'To be seen', 'To create something', 'Just to be'] },
        { id: 'which_self', text: 'Which version of me is running the show?', options: ['The powerful one (owning)', 'The weak one (hiding)', 'The clear one (connecting)', 'A mix of all three', 'I do not know'] },
        { id: 'add_vegetable', text: 'If I could add one vegetable to balance this, which would help most?', options: ['Calm', 'Connection', 'Rest', 'Meaning', 'Truth', 'Self-compassion', 'Presence'] }
    ],

    quotes: [
        'The old you just reacted. The you now is learning to choose.',
        'The pause between feeling and action is where freedom lives.',
        'Inner power is the capacity to tolerate emptiness without panic.',
        'If I were not trying to feel powerful at all, what would I want?'
    ],

    journalPrompts: [
        'What are you grateful for today?',
        'What is one thing that went well?',
        'What are you looking forward to?',
        'What is the spiciest emotion right now?',
        'What greasy thing are you reaching for?',
        'What vegetable do you actually need?'
    ],

    interventions: {
        grounding: { name: 'Values Grounding', duration: 60, instructions: 'Take a deep breath. Ask yourself: What truly matters to me beyond external validation?' },
        powerbreathing: { name: 'Power Breathing', duration: 120, instructions: 'Inhale for 4 counts, hold for 4, exhale for 6. Feel the energy settle.' },
        somatic: { name: 'Somatic Anchoring', duration: 180, instructions: 'Feel your feet on the ground. Notice 3 sensations in your body right now.' },
        reframe: { name: 'Cognitive Reframe', duration: 120, instructions: 'What is another way to view this situation? What would you tell a friend?' },
        urgesurfing: { name: 'Urge Surfing', duration: 300, instructions: 'Observe the craving like a wave. It will rise, peak, and fall. You do not need to act.' },
        patternbreak: { name: 'Pattern Interrupt', duration: 60, instructions: 'Stand up. Stretch. Splash cold water on your face. Change your physical state.' },
        sigh: { name: 'Physiological Sigh', duration: 60, instructions: 'Take two quick inhales through nose, then one long exhale through mouth. Repeat 3 times.' },
        '54321': { name: '5-4-3-2-1 Grounding', duration: 60, instructions: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.' },
        compassion: { name: 'Self-Compassion Break', duration: 60, instructions: 'Place hand on heart. Say: This is hard. I am not alone. May I be kind to myself.' }
    },

    init() {
        this.setupNavigation();
        this.setupToolsDropdown();
        this.updateGreeting();
        this.loadData();
        this.renderQuote();
        this.renderStreak();
        this.renderCycle();
        this.setupSaladCheck();
        this.renderProgress();
        
        // Check for tab query parameter or hash
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const hash = window.location.hash.replace('#', '');
        
        if (tabParam) {
            this.navigate(tabParam);
        } else if (hash) {
            this.navigate(hash);
        }
    },

    // Initialize Emotion Ribbon
    initEmotionRibbon() {
        // Load Emotion Ribbon scripts dynamically
        this.loadScript('emotion-ribbon.js', () => {
            this.loadScript('emotion-ribbon-visualizer.js', () => {
                this.setupEmotionRibbonUI();
            });
        });
    },

    loadScript(src, callback) {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = () => console.error(`Failed to load ${src}`);
        document.head.appendChild(script);
    },

    setupEmotionRibbonUI() {
        // Add ribbon container to assessment tab if not exists
        const assessmentTab = document.getElementById('assessment');
        if (!assessmentTab || document.getElementById('emotionRibbonContainer')) return;

        const ribbonSection = document.createElement('div');
        ribbonSection.className = 'emotion-ribbon-section';
        ribbonSection.innerHTML = `
            <div class="ribbon-header">
                <h3><i class="fas fa-palette"></i> Emotion Ribbon</h3>
                <span class="ribbon-status">Real-time emotion detection</span>
            </div>
            <div id="emotionRibbonContainer" class="ribbon-container"></div>
            <div id="emotionRibbonLegend" class="ribbon-legend"></div>
        `;

        // Insert after chat interface
        const chatInterface = assessmentTab.querySelector('.chat-interface');
        if (chatInterface) {
            chatInterface.parentNode.insertBefore(ribbonSection, chatInterface.nextSibling);
        }

        // Initialize visualizer
        if (window.EmotionRibbon && window.EmotionRibbonVisualizer) {
            this.emotionRibbon = EmotionRibbon;
            this.ribbonVisualizer = new EmotionRibbonVisualizer('emotionRibbonContainer', {
                width: 600,
                height: 100,
                maxSegments: 8
            });
            this.renderRibbonLegend();
            
            // Setup real-time input detection
            this.setupRealTimeDetection();
        }

        // Add CSS
        this.addRibbonStyles();
    },

    setupRealTimeDetection() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput || !this.emotionRibbon) return;

        let debounceTimer;
        
        chatInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const text = e.target.value.trim();
                if (text.length > 2) {
                    this.analyzeWithRibbon(text);
                }
            }, 300); // Debounce 300ms
        });
    },

    renderRibbonLegend() {
        const legend = document.getElementById('emotionRibbonLegend');
        if (!legend || !this.emotionRibbon) return;

        const categories = this.emotionRibbon.getAllCategories();
        legend.innerHTML = categories.map(cat => `
            <div class="ribbon-legend-item" title="${cat.description}">
                <span class="legend-dot" style="background: ${cat.color}"></span>
                <span class="legend-name">${cat.emoji} ${cat.name}</span>
            </div>
        `).join('');
    },

    addRibbonStyles() {
        if (document.getElementById('ribbon-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ribbon-styles';
        style.textContent = `
            .emotion-ribbon-section {
                background: white;
                border-radius: 1rem;
                padding: 1.5rem;
                margin: 1.5rem 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
            }
            .ribbon-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            .ribbon-header h3 {
                font-size: 1rem;
                margin: 0;
                color: #1e293b;
            }
            .ribbon-status {
                font-size: 0.75rem;
                color: #64748b;
                background: #f1f5f9;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
            }
            .ribbon-container {
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ribbon-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #e2e8f0;
            }
            .ribbon-legend-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
                color: #64748b;
                cursor: help;
            }
            .legend-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
        `;
        document.head.appendChild(style);
    },

    // Analyze message with Emotion Ribbon
    analyzeWithRibbon(text) {
        if (!this.emotionRibbon) return null;
        
        const analysis = this.emotionRibbon.analyze(text);
        
        // Update visualizer
        if (this.ribbonVisualizer && analysis.detected) {
            this.ribbonVisualizer.updateFromAnalysis(analysis);
        }
        
        return analysis;
    },

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.navigate(tab);
            });
        });
    },

    setupToolsDropdown() {
        const toolsBtn = document.getElementById('tools-menu-button');
        const toolsMenu = document.getElementById('tools-menu-dropdown');

        if (!toolsBtn || !toolsMenu) return;

        toolsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = toolsMenu.classList.toggle('open');
            toolsBtn.setAttribute('aria-expanded', isExpanded);
            if (isExpanded) {
                const btnRect = toolsBtn.getBoundingClientRect();
                toolsMenu.style.top = (btnRect.bottom + 8) + 'px';
                toolsMenu.style.left = btnRect.left + 'px';
            }
        });

        document.addEventListener('click', () => {
            if (toolsMenu.classList.contains('open')) {
                toolsMenu.classList.remove('open');
                toolsBtn.setAttribute('aria-expanded', 'false');
            }
        });
    },

    navigate(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.id === tab);
        });

        // Close mobile menu after navigation
        this.closeMobileMenu();

        if (tab === 'progress') {
            this.renderProgress();
        } else if (tab === 'cycle') {
            this.renderCycle();
        } else if (tab === 'assessment') {
            this.initEmotionRibbon();
        }
    },

    toggleMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('mobile-open');
        }
    },

    closeMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.remove('mobile-open');
        }
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';
        else if (hour < 5) greeting = 'Good night';
        
        const el = document.getElementById('greeting');
        if (el) el.textContent = greeting + ',';
    },

    renderQuote() {
        const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        const el = document.getElementById('quoteCard');
        if (el) el.innerHTML = `<p>${quote}</p>`;
    },

    renderStreak() {
        const streak = this.getStreak();
        const el = document.getElementById('streakValue');
        if (el) el.textContent = streak;
        
        const sessionEl = document.getElementById('sessionValue');
        const minuteEl = document.getElementById('minuteValue');
        
        if (sessionEl) {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            sessionEl.textContent = sessions.length;
        }
        
        if (minuteEl) {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const minutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            minuteEl.textContent = minutes;
        }
    },

    getStreak() {
        const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
        return Math.min(checkins.length, 7);
    },

    // Power-Possession Cycle Visualization
    renderCycle() {
        const container = document.getElementById('cycleVisualization');
        if (!container) return;

        const states = ['power', 'possession', 'loss', 'emptiness', 'craving', 'return'];
        const centerX = 200;
        const centerY = 200;
        const radius = 120;

        let svg = `<svg viewBox="0 0 400 400" class="cycle-svg">`;
        
        // Draw connecting lines
        for (let i = 0; i < states.length; i++) {
            const angle1 = (i * 60 - 90) * Math.PI / 180;
            const angle2 = ((i + 1) % states.length * 60 - 90) * Math.PI / 180;
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);
            
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e2e8f0" stroke-width="3" />`;
        }

        // Draw nodes
        states.forEach((stateKey, i) => {
            const state = this.cycleStates[stateKey];
            const angle = (i * 60 - 90) * Math.PI / 180;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            svg += `
                <g class="cycle-node" 
                   onclick="app.showStateDetail('${stateKey}')" 
                   onmouseenter="app.changeBackgroundColor('${state.color}', '${state.bgColor}')"
                   onmouseleave="app.resetBackgroundColor()"
                   style="cursor: pointer;">
                    <circle cx="${x}" cy="${y}" r="40" fill="${state.color}20" stroke="${state.color}" stroke-width="3"/>
                    <text x="${x}" y="${y - 5}" text-anchor="middle" font-size="13" font-weight="600" fill="${state.color}">${state.name}</text>
                    <text x="${x}" y="${y + 12}" text-anchor="middle" font-size="18">${['🔴', '🟠', '🔵', '⚫', '��', '🟢'][i]}</text>
                </g>
            `;
        });

        // Center label
        svg += `
            <text x="200" y="200" text-anchor="middle" font-size="16" font-weight="600" fill="#475569">Power-Possession Cycle</text>
        `;

        svg += `</svg>`;
        container.innerHTML = svg;
    },

    showStateDetail(stateKey) {
        const state = this.cycleStates[stateKey];
        const detailContainer = document.getElementById('cycleDetail');
        if (!detailContainer) return;

        detailContainer.innerHTML = `
            <div class="detail-header" style="border-left-color: ${state.color};">
                <h3>${state.name}</h3>
                <p>${state.description}</p>
            </div>
            <div class="detail-content">
                <h4>Common Triggers</h4>
                <ul>${state.triggers.map(t => `<li>${t}</li>`).join('')}</ul>
                <h4>Mindful Strategies</h4>
                <ul>${state.strategies.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        `;
        detailContainer.style.opacity = 1;
    },

    changeBackgroundColor(color, bgColor) {
        clearTimeout(this.hoverTimeout);
        document.body.style.setProperty('--cycle-bg-color', bgColor);
        document.body.classList.add('cycle-hover');
    },

    resetBackgroundColor() {
        this.hoverTimeout = setTimeout(() => {
            document.body.classList.remove('cycle-hover');
        }, 300);
    },

    // Salad Compass & Check
    setupSaladCheck() {
        const container = document.getElementById('saladCheckContainer');
        if (!container) return;

        const allQuestions = [...this.spicyQuestions, ...this.greasyQuestions, ...this.vegetableQuestions];
        container.innerHTML = allQuestions.map(q => `
            <div class="salad-question-card">
                <label for="${q.id}">${q.text}</label>
                <select id="${q.id}" name="${q.id}">
                    <option value="">Select an answer...</option>
                    ${q.options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>
        `).join('');
    },

    // Progress Page
    renderProgress() {
        const moodContainer = document.getElementById('moodChartContainer');
        const journalContainer = document.getElementById('journalEntriesContainer');

        if (moodContainer) this.renderMoodChart(moodContainer);
        if (journalContainer) this.renderJournalEntries(journalContainer);
    },

    renderMoodChart(container) {
        const moods = JSON.parse(localStorage.getItem('moods') || '[]');
        if (moods.length === 0) {
            container.innerHTML = '<p class="empty-state">No mood data yet. Use the journal to track your mood.</p>';
            return;
        }

        const canvas = document.createElement('canvas');
        container.innerHTML = '';
        container.appendChild(canvas);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: moods.map(m => new Date(m.date).toLocaleDateString()),
                datasets: [{
                    label: 'Mood Rating (1-5)',
                    data: moods.map(m => m.rating),
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },

    renderJournalEntries(container) {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-state">No journal entries yet. Write your first entry today!</p>';
            return;
        }

        container.innerHTML = entries.reverse().map(entry => `
            <div class="journal-entry-card">
                <div class="entry-header">
                    <span class="entry-date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span class="entry-mood">Mood: ${this.getMoodEmoji(entry.mood)}</span>
                </div>
                <p class="entry-text">${entry.text.replace(/\n/g, '<br>')}</p>
            </div>
        `).join('');
    },

    getMoodEmoji(rating) {
        return ['😞', '😟', '😐', '🙂', '😁'][rating - 1] || '🤔';
    },

    // Journal Page
    setupJournal() {
        const saveBtn = document.getElementById('saveJournal');
        const promptBtn = document.getElementById('newPrompt');
        const entryText = document.getElementById('journalEntry');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveJournalEntry());
        }
        if (promptBtn) {
            promptBtn.addEventListener('click', () => this.setJournalPrompt());
        }
        if (entryText) {
            this.setJournalPrompt(); // Initial prompt
        }
    },

    setJournalPrompt() {
        const prompt = this.journalPrompts[Math.floor(Math.random() * this.journalPrompts.length)];
        const entryText = document.getElementById('journalEntry');
        if (entryText) {
            entryText.placeholder = prompt;
        }
    },

    saveJournalEntry() {
        const entryText = document.getElementById('journalEntry');
        const moodRating = document.querySelector('input[name="mood"]:checked');
        const statusEl = document.getElementById('saveStatus');

        if (!entryText || !moodRating || !statusEl) return;

        if (entryText.value.trim() === '') {
            statusEl.textContent = 'Please write something before saving.';
            statusEl.className = 'status-message error';
            return;
        }

        const newEntry = {
            date: new Date().toISOString(),
            text: entryText.value.trim(),
            mood: parseInt(moodRating.value)
        };

        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.push(newEntry);
        localStorage.setItem('journalEntries', JSON.stringify(entries));

        const moods = JSON.parse(localStorage.getItem('moods') || '[]');
        moods.push({ date: newEntry.date, rating: newEntry.mood });
        localStorage.setItem('moods', JSON.stringify(moods));

        statusEl.textContent = 'Entry saved successfully!';
        statusEl.className = 'status-message success';
        entryText.value = '';
        moodRating.checked = false;
        this.setJournalPrompt();

        setTimeout(() => { statusEl.textContent = ''; }, 3000);
    },

    // Data persistence
    saveData() {
        localStorage.setItem('mindfulnessApp', JSON.stringify({
            answers: this.answers,
            currentStep: this.currentStep
        }));
    },

    loadData() {
        const data = JSON.parse(localStorage.getItem('mindfulnessApp') || 'null');
        if (data) {
            this.answers = data.answers || {};
            this.currentStep = data.currentStep || 0;
        }
    },

    // Interventions Timer
    startIntervention(key) {
        const intervention = this.interventions[key];
        if (!intervention) return;

        this.currentIntervention = intervention;
        this.timerTotal = intervention.duration;
        this.timerSeconds = intervention.duration;
        this.isRunning = true;

        this.updateTimerDisplay();
        this.showTimerModal();

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            if (this.timerSeconds <= 0) {
                this.completeIntervention();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        const progressEl = document.getElementById('timerProgress');
        if (!timerEl || !progressEl) return;

        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = (this.timerTotal - this.timerSeconds) / this.timerTotal * 100;
        progressEl.style.width = `${progress}%`;
    },

    showTimerModal() {
        const modal = document.getElementById('timerModal');
        const titleEl = document.getElementById('timerTitle');
        const instructionsEl = document.getElementById('timerInstructions');

        if (!modal || !titleEl || !instructionsEl) return;

        titleEl.textContent = this.currentIntervention.name;
        instructionsEl.textContent = this.currentIntervention.instructions;
        modal.classList.add('open');
    },

    closeTimerModal() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.classList.remove('open');
        }
        clearInterval(this.timerInterval);
        this.isRunning = false;
    },

    completeIntervention() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push({ name: this.currentIntervention.name, duration: Math.round(this.timerTotal / 60) });
        localStorage.setItem('sessions', JSON.stringify(sessions));

        // Show completion state
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = 'Complete!';

        setTimeout(() => this.closeTimerModal(), 2000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Check which page is loaded and initialize accordingly
    if (document.querySelector('.home-page')) {
        app.init();
    } else if (document.getElementById('cycleVisualization')) {
        app.renderCycle();
    } else if (document.getElementById('saladCheckContainer')) {
        app.setupSaladCheck();
    } else if (document.querySelector('.progress-page')) {
        app.renderProgress();
    } else if (document.querySelector('.journal-page')) {
        app.setupJournal();
    } else if (document.querySelector('.assessment-page')) {
        app.initEmotionRibbon();
    }

    // Universal initializations for all pages
    app.setupToolsDropdown();
    
    // Quick Wins: Initialize Calm Button and Breathing Guide
    app.initCalmButton();
    app.initBreathingGuide();
});

// ============================================
// QUICK WINS: Calm Button & Breathing Guide
// ============================================

// Calm Button Functionality
app.initCalmButton = function() {
    const calmBtn = document.getElementById('calm-button');
    if (!calmBtn) return;
    
    calmBtn.addEventListener('click', function() {
        // Visual feedback
        calmBtn.classList.add('active');
        setTimeout(() => calmBtn.classList.remove('active'), 300);
        
        // 1. Close all modals and overlays
        document.querySelectorAll('.modal, .overlay, .popup, [role="dialog"]').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active', 'open', 'show');
            el.setAttribute('aria-hidden', 'true');
        });
        
        // 2. Close dropdowns
        document.querySelectorAll('.tools-dropdown-menu').forEach(el => {
            el.classList.remove('open');
        });
        
        // 3. Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 4. Clear form inputs
        document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
                input.value = '';
                input.checked = false;
            }
        });
        
        // 5. Stop any playing media
        document.querySelectorAll('audio, video').forEach(media => {
            media.pause();
            media.currentTime = 0;
        });
        
        // 6. Play gentle chime
        app.playCalmChime();
        
        // 7. Reset breathing if running
        if (app.breathingGuide && app.breathingGuide.isRunning) {
            app.stopBreathing();
        }
        
        console.log('🧘 Calm activated');
    });
    
    // Pulse after 30 seconds of inactivity
    app.startInactivityTimer(calmBtn);
};

app.playCalmChime = function() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(528, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(264, ctx.currentTime + 2);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2);
    } catch (e) {
        // Silent fail
    }
};

app.startInactivityTimer = function(button) {
    let inactivityTimeout;
    
    const resetTimer = () => {
        button.classList.remove('pulse');
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            button.classList.add('pulse');
        }, 30000);
    };
    
    ['click', 'scroll', 'keypress', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer, { once: true });
    });
    
    resetTimer();
};

// 4-4-4 Breathing Guide
app.initBreathingGuide = function() {
    const circle = document.getElementById('breathing-circle');
    const button = document.getElementById('start-breathing');
    
    if (!circle || !button) return;
    
    app.breathingGuide = {
        isRunning: false,
        cycleCount: 0,
        maxCycles: 5
    };
    
    button.addEventListener('click', function() {
        if (app.breathingGuide.isRunning) {
            app.stopBreathing();
            button.textContent = 'Start Breathing';
        } else {
            app.startBreathing();
            button.textContent = 'Stop';
        }
    });
};

app.startBreathing = function() {
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breath-text');
    const phases = document.querySelectorAll('.phase');
    
    if (!circle) return;
    
    app.breathingGuide.isRunning = true;
    app.breathingGuide.cycleCount = 0;
    
    app.breathingLoop(circle, text, phases);
};

app.stopBreathing = function() {
    app.breathingGuide.isRunning = false;
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breath-text');
    const button = document.getElementById('start-breathing');
    const phases = document.querySelectorAll('.phase');
    
    if (circle) circle.className = 'breathing-circle';
    if (text) text.textContent = 'Ready?';
    if (button) button.textContent = 'Start Breathing';
    phases.forEach(p => p.classList.remove('active'));
};

app.breathingLoop = async function(circle, text, phases) {
    while (app.breathingGuide.isRunning && app.breathingGuide.cycleCount < app.breathingGuide.maxCycles) {
        app.breathingGuide.cycleCount++;
        
        // Inhale (4 seconds)
        await app.setBreathingPhase('inhale', 'Breathe In', 4000, circle, text, phases);
        if (!app.breathingGuide.isRunning) break;
        
        // Hold (4 seconds)
        await app.setBreathingPhase('hold', 'Hold', 4000, circle, text, phases);
        if (!app.breathingGuide.isRunning) break;
        
        // Exhale (4 seconds)
        await app.setBreathingPhase('exhale', 'Breathe Out', 4000, circle, text, phases);
        if (!app.breathingGuide.isRunning) break;
    }
    
    if (app.breathingGuide.isRunning) {
        app.stopBreathing();
        if (text) text.textContent = 'Well Done!';
    }
};

app.setBreathingPhase = function(phase, displayText, duration, circle, text, phases) {
    return new Promise(resolve => {
        circle.className = `breathing-circle ${phase}`;
        if (text) text.textContent = displayText;
        
        phases.forEach(p => p.classList.remove('active'));
        const activePhase = document.querySelector(`.phase[data-phase="${phase}"]`);
        if (activePhase) activePhase.classList.add('active');
        
        setTimeout(resolve, duration);
    });
};
