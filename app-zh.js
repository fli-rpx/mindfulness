// 正念疗法 - 增强版 JavaScript
// 功能：权力-占有循环、AI评估、微干预
// 版权所有 © 2026 正念疗法. 保留所有权利.

const app = {
    currentTab: 'home',
    currentStep: 0,
    answers: {},
    timerInterval: null,
    timerSeconds: 0,
    timerTotal: 0,
    isRunning: false,
    currentIntervention: null,

    // 权力-占有循环数据
    cycleStates: {
        power: {
            name: '权力',
            color: '#991b1b',
            bgColor: '#450a0a',
            description: '外部认可，感觉掌控一切',
            triggers: ['成就', '被认可', '地位提升'],
            strategies: ['价值观扎根', '内在认可', '预防性平衡']
        },
        possession: {
            name: '占有',
            color: '#6b21a8',
            bgColor: '#3b0764',
            description: '拥有阶段，依附于外部权力',
            triggers: ['控制行为', '领地意识', '获取'],
            strategies: ['放下练习', '不执着', '无常觉察']
        },
        loss: {
            name: '失去',
            color: '#1e40af',
            bgColor: '#172554',
            description: '不可避免的衰退，外部权力消退',
            triggers: ['地位丧失', '被拒绝', '失败'],
            strategies: ['接纳', '悲伤处理', '现实导向']
        },
        emptiness: {
            name: '空虚',
            color: '#374151',
            bgColor: '#111827',
            description: '崩溃，当外部认可消失时的空洞',
            triggers: ['孤立', '无意义感', '断联'],
            strategies: ['身体锚定', '临在', '自我慈悲']
        },
        craving: {
            name: '渴望',
            color: '#b45309',
            bgColor: '#451a03',
            description: '对替代性满足的强迫性冲动',
            triggers: ['空虚', '无聊', '不安'],
            strategies: ['渴望冲浪', '模式中断', '替代性满足']
        },
        return: {
            name: '回归',
            color: '#15803d',
            bgColor: '#052e16',
            description: '寻求权力行为重启循环',
            triggers: ['希望', '机会', '新的认可来源'],
            strategies: ['循环觉察', '有意识选择', '打破模式']
        }
    },

    hoverTimeout: null,
    currentHoverState: null,

    // 沙拉问题
    spicyQuestions: [
        { id: 'emotion_now', text: '我现在最主要的情绪是什么？', options: ['愤怒', '恐惧', '羞耻', '空虚', '无力', '焦虑', '悲伤'] },
        { id: 'body_location', text: '我在身体的哪个部位感受到这种情绪？', options: ['胸口紧绷', '胃部打结', '脸部发热', '手冷', '肩膀紧张', '喉咙有肿块', '感觉不到任何东西'] },
        { id: 'intensity', text: '这种情绪有多强烈（1-10分）？', options: ['1-3分（轻微）', '4-6分（中等）', '7-8分（强烈）', '9-10分（压倒性）'] },
        { id: 'trigger', text: '在这种情绪出现之前发生了什么？', options: ['失去', '被拒绝', '失败', '想起过去', '冲突', '不确定', '没有特别的事'] },
        { id: 'familiar', text: '这种情绪让你想起过去的什么情境吗？', options: ['童年', '过去的恋情', '工作情况', '家庭模式', '这是新的', '经常发生'] },
        { id: 'story', text: '我的大脑在讲述什么故事？', options: ['我不够好', '我正在失去控制', '我需要解决这个问题', '我被抛弃了', '我必须证明自己', '其他'] },
        { id: 'need', text: '如果这种情绪能说话，它会说什么需要？', options: ['安全', '连接', '被认可', '休息', '控制', '爱', '只是被听见'] }
    ],

    greasyQuestions: [
        { id: 'urge', text: '我现在迫切想做什么？', options: ['联系某人', '寻求关注', '逃避/回避', '控制某事', '证明自己', '获得认可', '其他'] },
        { id: 'fixation', text: '有没有特定的人或类型的人让我着迷？', options: ['前任/伴侣', '权威人物', '我吸引的人', '家庭成员', '没有特定的人', '一个幻想/理想'] },
        { id: 'aftermath', text: '如果我按这种冲动行事，之后会有什么感觉？', options: ['暂时缓解', '羞耻', '空虚', '短暂有力量', '后悔', '满足'] },
        { id: 'next_day', text: '第二天我会感觉如何？', options: ['后悔', '同样的空虚', '羞耻', '没有变化', '短暂好转', '比之前更糟'] },
        { id: 'avoiding', text: '如果我屈服了，我在避免感受什么？', options: ['空虚', '无力', '羞耻', '恐惧', '孤独', '我不知道'] },
        { id: 'greasy_food', text: '我伸手去抓的油腻食物是什么？', options: ['关注/情感', '控制/权力', '认可', '逃避', '短暂的快感', '胜利感'] }
    ],

    vegetableQuestions: [
        { id: 'opposite', text: '这种渴望的反面会是什么感觉？', options: ['放手', '临在', '接纳', '真诚连接', '休息', '脆弱'] },
        { id: 'true_need', text: '我现在真正需要什么？', options: ['连接', '休息', '安全', '被认可', '意义', '自我慈悲', '真实'] },
        { id: 'genuine_connect', text: '有没有我可以真诚连接的人，不带目的？', options: ['有，一个朋友', '有，家人', '治疗师/咨询师', '现在没有', '我需要先独处'] },
        { id: 'sit_with_it', text: '与这种情绪共处5分钟会是什么感觉？', options: ['可怕但可行', '压倒性', '像它会过去', '我不知道', '我以前做过'] },
        { id: 'proud_action', text: '我可以做一件什么小事让明天感到自豪？', options: ['诚实地写日记', '联系某人', '完成一个小任务', '不内疚地休息', '练习正念', '设定界限'] },
        { id: 'without_power', text: '如果我不试图感受强大，我会想要什么？', options: ['平静', '连接', '意义', '休息', '被看见', '创造某物', '只是存在'] },
        { id: 'which_self', text: '哪个版本的我在主导？', options: ['强大的那个（拥有）', '软弱的那个（隐藏）', '清晰的那个（连接）', '三者的混合', '我不知道'] },
        { id: 'add_vegetable', text: '如果我能添加一种蔬菜来平衡这个，哪个最有帮助？', options: ['平静', '连接', '休息', '意义', '真实', '自我慈悲', '临在'] }
    ],

    quotes: [
        '过去的你只是反应。现在的你正在学习选择。',
        '感觉和行动之间的暂停是自由所在之处。',
        '内在力量是在不恐慌的情况下容忍空虚的能力。',
        '如果我完全不试图感受强大，我会想要什么？'
    ],

    journalPrompts: [
        '今天你感恩什么？',
        '今天有一件什么好事？',
        '你期待什么？',
        '现在最辛辣的情绪是什么？',
        '你伸手去抓的油腻东西是什么？',
        '你实际需要什么蔬菜？'
    ],

    interventions: {
        grounding: { name: '价值观扎根', duration: 60, instructions: '深呼吸。问自己：除了外部认可，什么对我真正重要？' },
        powerbreathing: { name: '权力呼吸', duration: 120, instructions: '吸气4秒，屏息4秒，呼气6秒。感受能量沉淀。' },
        somatic: { name: '身体锚定', duration: 180, instructions: '感受你的脚在地上。注意你身体现在的3种感觉。' },
        reframe: { name: '认知重构', duration: 120, instructions: '还有什么方式可以看待这种情况？你会对朋友说什么？' },
        urgesurfing: { name: '渴望冲浪', duration: 300, instructions: '像观察波浪一样观察渴望。它会升起、达到顶峰、然后消退。你不需要行动。' },
        patternbreak: { name: '模式中断', duration: 60, instructions: '站起来。伸展。用冷水洗脸。改变你的身体状态。' },
        sigh: { name: '生理叹息', duration: 60, instructions: '通过鼻子快速吸气两次，然后通过嘴巴长呼气。重复3次。' },
        '54321': { name: '5-4-3-2-1 扎根', duration: 60, instructions: '说出5样你看到的东西，4样你能触摸的，3样你听到的，2样你闻到的，1样你尝到的。' },
        compassion: { name: '自我慈悲暂停', duration: 60, instructions: '把手放在心口。说：这很难。我并不孤单。愿我善待自己。' }
    },

    init() {
        this.setupNavigation();
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

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.navigate(tab);
            });
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

        if (tab === 'progress') {
            this.renderProgress();
        } else if (tab === 'cycle') {
            this.renderCycle();
        }
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '早上好';
        if (hour >= 12 && hour < 17) greeting = '下午好';
        else if (hour >= 17) greeting = '晚上好';
        else if (hour < 5) greeting = '晚安';
        
        const el = document.getElementById('greeting');
        if (el) el.textContent = greeting + '，';
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

    // 权力-占有循环可视化
    renderCycle() {
        const container = document.getElementById('cycleVisualization');
        if (!container) return;

        const states = ['power', 'possession', 'loss', 'emptiness', 'craving', 'return'];
        const centerX = 200;
        const centerY = 200;
        const radius = 120;

        let svg = `<svg viewBox="0 0 400 400" class="cycle-svg">`;
        
        // 绘制连接线
        for (let i = 0; i < states.length; i++) {
            const angle1 = (i * 60 - 90) * Math.PI / 180;
            const angle2 = ((i + 1) % states.length * 60 - 90) * Math.PI / 180;
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);
            
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e2e8f0" stroke-width="3" />`;
        }

        // 绘制节点
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
                    <text x="${x}" y="${y + 12}" text-anchor="middle" font-size="18">${['🔥', '💜', '💙', '⚪', '🟠', '🟢'][i]}</text>
                </g>
            `;
        });

        // 中心标签
        svg += `
            <circle cx="${centerX}" cy="${centerY}" r="50" fill="white" stroke="#e2e8f0" stroke-width="2"/>
            <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">权力-占有</text>
            <text x="${centerX}" y="${centerY + 10}" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">循环</text>
        `;

        svg += '</svg>';
        container.innerHTML = svg;
    },

    showStateDetail(stateKey) {
        const state = this.cycleStates[stateKey];
        const container = document.getElementById('cycleInfo');
        if (!container) return;

        container.innerHTML = `
            <div class="state-detail">
                <h3 style="color: ${state.color}">${state.name}</h3>
                <p>${state.description}</p>
                <h4>常见触发因素：</h4>
                <ul>
                    ${state.triggers.map(t => `<li>${t}</li>`).join('')}
                </ul>
                <h4>有帮助的策略：</h4>
                <ul>
                    ${state.strategies.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
    },

    // 循环页面的背景颜色变化
    changeBackgroundColor(color, bgColor) {
        // 只在循环标签页应用深色模式
        if (this.currentTab !== 'cycle') return;
        
        // 清除待处理的重置
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        // 只有状态不同时才改变
        if (this.currentHoverState === color) return;
        this.currentHoverState = color;
        
        // 创建或更新覆盖层
        let overlay = document.getElementById('cycle-bg-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cycle-bg-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, ${bgColor} 0%, ${color}40 50%, #0a0a0a 100%);
                opacity: 0;
                transition: opacity 3s ease-in-out;
                pointer-events: none;
                z-index: -1;
            `;
            document.body.appendChild(overlay);
            // 强制重绘
            overlay.offsetHeight;
        } else {
            overlay.style.background = `radial-gradient(ellipse at center, ${bgColor} 0%, ${color}40 50%, #0a0a0a 100%)`;
        }
        
        // 淡入
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    },

    resetBackgroundColor() {
        // 防抖重置
        this.hoverTimeout = setTimeout(() => {
            this.currentHoverState = null;
            const overlay = document.getElementById('cycle-bg-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                // 淡出后移除
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 10000);
            }
        }, 100);
    },

    // AI聊天
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        // 添加用户消息
        this.addChatMessage(message, 'user');
        input.value = '';

        // 模拟AI分析
        setTimeout(() => {
            this.analyzeEmotion(message);
        }, 1000);
    },

    addChatMessage(text, sender) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.innerHTML = `<p>${text}</p>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    analyzeEmotion(text) {
        // 基于关键词的简单分析（真实应用会使用AI API）
        const lowerText = text.toLowerCase();
        let detectedState = 'emptiness';
        let confidence = 70;

        if (lowerText.includes('生气') || lowerText.includes('愤怒') || lowerText.includes('权力') || lowerText.includes('控制')) {
            detectedState = 'power';
            confidence = 85;
        } else if (lowerText.includes('想要') || lowerText.includes('需要') || lowerText.includes('渴望')) {
            detectedState = 'craving';
            confidence = 80;
        } else if (lowerText.includes('失去') || lowerText.includes('失败') || lowerText.includes('被拒绝')) {
            detectedState = 'loss';
            confidence = 82;
        } else if (lowerText.includes('空虚') || lowerText.includes('什么都没有') || lowerText.includes('麻木')) {
            detectedState = 'emptiness';
            confidence = 88;
        }

        const state = this.cycleStates[detectedState];

        // AI回复
        this.addChatMessage(
            `我听到你了。听起来你可能处于<strong>${state.name}</strong>状态。 ` +
            `这时${state.description}。 ` +
            `你想试试${state.strategies[0]}练习吗？`,
            'ai'
        );

        // 更新侧边栏
        this.updateDetectedState(state, confidence);
    },

    updateDetectedState(state, confidence) {
        const stateEl = document.getElementById('detectedState');
        const scoreEl = document.getElementById('confidenceScore');
        const actionsEl = document.getElementById('suggestedActions');

        if (stateEl) {
            stateEl.innerHTML = `
                <h4>检测到的状态</h4>
                <div style="padding: 1rem; background: ${state.color}20; border-radius: 0.5rem; border-left: 4px solid ${state.color}">
                    <strong style="color: ${state.color}">${state.name}</strong>
                    <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b">${state.description}</p>
                </div>
            `;
        }

        if (scoreEl) {
            scoreEl.innerHTML = `
                <h4>置信度</h4>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${confidence}%"></div>
                </div>
                <span class="score-value">${confidence}%</span>
            `;
        }

        if (actionsEl) {
            actionsEl.innerHTML = `
                <h4>建议行动</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${state.strategies.map(s => `
                        <button class="option-btn" onclick="app.startInterventionFromState('${s}')" style="text-align: left;">
                            ${s}
                        </button>
                    `).join('')}
                </div>
            `;
        }
    },

    startInterventionFromState(strategy) {
        // 将策略映射到干预
        const mapping = {
            '价值观扎根': 'grounding',
            '身体锚定': 'somatic',
            '渴望冲浪': 'urgesurfing',
            '模式中断': 'patternbreak'
        };
        
        const intervention = mapping[strategy] || 'sigh';
        this.startIntervention(intervention);
    },

    toggleVoiceInput() {
        alert('语音输入功能将在生产版本中使用Web Speech API');
    },

    startStructuredAssessment() {
        this.navigate('salad');
    },

    // 沙拉检测
    setupSaladCheck() {
        this.currentStep = 0;
        this.answers = {};
        this.renderSaladQuestion();
    },

    renderSaladQuestion() {
        const container = document.getElementById('saladQuestions');
        const totalSteps = this.spicyQuestions.length + this.greasyQuestions.length + this.vegetableQuestions.length;
        
        const progressEl = document.getElementById('saladProgress');
        const textEl = document.getElementById('saladProgressText');
        
        if (progressEl) progressEl.style.width = `${(this.currentStep / totalSteps) * 100}%`;
        if (textEl) textEl.textContent = `问题 ${this.currentStep + 1} / ${totalSteps}`;

        if (!container) return;

        let question, category, color;
        if (this.currentStep < this.spicyQuestions.length) {
            question = this.spicyQuestions[this.currentStep];
            category = 'spicy';
            color = '#dc2626';
        } else if (this.currentStep < this.spicyQuestions.length + this.greasyQuestions.length) {
            question = this.greasyQuestions[this.currentStep - this.spicyQuestions.length];
            category = 'greasy';
            color = '#f97316';
        } else {
            question = this.vegetableQuestions[this.currentStep - this.spicyQuestions.length - this.greasyQuestions.length];
            category = 'vegetable';
            color = '#22c55e';
        }

        container.innerHTML = `
            <div class="question-card">
                <div class="question-category ${category}">${category === 'spicy' ? '辛辣' : category === 'greasy' ? '油腻' : '蔬菜'}</div>
                <div class="question-text">${question.text}</div>
                <div class="options">
                    ${question.options.map(opt => `
                        <button class="option-btn ${this.answers[question.id] === opt ? 'selected' : ''}" onclick="app.selectSaladOption('${question.id}', '${opt}')">
                            ${opt}
                            <span class="check">✓</span>
                        </button>
                    `).join('')}
                </div>
                <div class="nav-buttons">
                    ${this.currentStep > 0 ? `<button class="btn-secondary" onclick="app.prevSaladStep()">上一题</button>` : '<div></div>'}
                    <button class="btn-primary" onclick="app.nextSaladStep()">${this.currentStep < totalSteps - 1 ? '下一题' : '查看结果'}</button>
                </div>
            </div>
        `;
    },

    selectSaladOption(questionId, option) {
        this.answers[questionId] = option;
        this.renderSaladQuestion();
    },

    nextSaladStep() {
        const totalSteps = this.spicyQuestions.length + this.greasyQuestions.length + this.vegetableQuestions.length;
        
        if (this.currentStep < totalSteps - 1) {
            this.currentStep++;
            this.renderSaladQuestion();
        } else {
            this.showSaladResults();
        }
    },

    prevSaladStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderSaladQuestion();
        }
    },

    showSaladResults() {
        document.getElementById('saladQuestions').classList.add('hidden');
        document.getElementById('saladResults').classList.remove('hidden');
        
        const spice = this.answers['emotion_now'] || '';
        const grease = this.answers['greasy_food'] || '';
        const vegetable = this.answers['add_vegetable'] || '';
        
        // 保存打卡
        const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
        checkins.push({
            date: new Date().toISOString(),
            spice,
            grease,
            vegetable,
            answers: this.answers
        });
        localStorage.setItem('checkins', JSON.stringify(checkins));
        
        // 渲染盘子
        const plateEl = document.getElementById('plateContent');
        if (plateEl) {
            plateEl.innerHTML = `
                ${spice ? `
                    <div class="result-item spicy">
                        <div class="result-icon">🔥</div>
                        <div class="result-content">
                            <h4>辛辣</h4>
                            <p><strong>${spice}</strong></p>
                            <p>这是现在压倒你的东西。</p>
                        </div>
                    </div>
                ` : ''}
                ${grease ? `
                    <div class="result-item greasy">
                        <div class="result-icon">🧈</div>
                        <div class="result-content">
                            <h4>油腻</h4>
                            <p><strong>${grease}</strong></p>
                            <p>这是你伸手去抓来应对的东西。</p>
                        </div>
                    </div>
                ` : ''}
                ${vegetable ? `
                    <div class="result-item vegetable">
                        <div class="result-icon">🥗</div>
                        <div class="result-content">
                            <h4>蔬菜</h4>
                            <p><strong>${vegetable}</strong></p>
                            <p>这是真正能滋养你的东西。</p>
                        </div>
                    </div>
                ` : ''}
            `;
        }
        
        // 渲染方案
        const protocolEl = document.getElementById('protocolSteps');
        if (protocolEl) {
            protocolEl.innerHTML = [
                { title: '停止', desc: '身体暂停。不要行动。慢慢吸一口气。' },
                { title: '命名辛辣', desc: `什么太辛辣了？"${spice || '无力'}"` },
                { title: '定位它', desc: '你在身体的哪个部位感受到这个？只是注意。' },
                { title: '识别渴望', desc: `你在伸手抓什么？"${grease || '外部认可'}"` },
                { title: '选择蔬菜', desc: `什么会滋养你？"${vegetable || '休息'}"` },
                { title: '采取行动', desc: '只做2分钟。' },
                { title: '注意', desc: '你感觉如何？不完美，只是不同。' }
            ].map((step, i) => `
                <div class="protocol-step">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-content">
                        <h4>${step.title}</h4>
                        <p>${step.desc}</p>
                    </div>
                </div>
            `).join('');
        }
        
        this.renderStreak();
    },

    resetSalad() {
        this.currentStep = 0;
        this.answers = {};
        document.getElementById('saladQuestions').classList.remove('hidden');
        document.getElementById('saladResults').classList.add('hidden');
        this.renderSaladQuestion();
    },

    // 干预
    startIntervention(type) {
        const intervention = this.interventions[type];
        if (!intervention) return;

        this.currentIntervention = type;
        document.getElementById('interventionModal').classList.remove('hidden');
        document.getElementById('interventionTitle').textContent = intervention.name;
        document.getElementById('interventionInstructions').textContent = intervention.instructions;
        
        this.timerSeconds = intervention.duration;
        this.timerTotal = intervention.duration;
        this.isRunning = false;
        this.updateInterventionTimer();
        
        // 更新播放按钮
        const btn = document.getElementById('playPauseBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
    },

    toggleIntervention() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('playPauseBtn');
        
        if (this.isRunning) {
            if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
            this.timerInterval = setInterval(() => {
                this.timerSeconds--;
                this.updateInterventionTimer();
                
                if (this.timerSeconds <= 0) {
                    this.completeIntervention();
                }
            }, 1000);
        } else {
            if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(this.timerInterval);
        }
    },

    updateInterventionTimer() {
        const display = document.getElementById('interventionTimer');
        const circle = document.getElementById('interventionProgress');
        
        if (display) {
            const minutes = Math.floor(this.timerSeconds / 60);
            const seconds = this.timerSeconds % 60;
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (circle) {
            const progress = (this.timerTotal - this.timerSeconds) / this.timerTotal;
            const offset = 283 - (283 * progress);
            circle.style.strokeDashoffset = offset;
        }
    },

    stopIntervention() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        document.getElementById('interventionModal').classList.add('hidden');
    },

    completeIntervention() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        
        // 保存会话
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push({
            date: new Date().toISOString(),
            type: this.currentIntervention,
            duration: this.interventions[this.currentIntervention].duration
        });
        localStorage.setItem('sessions', JSON.stringify(sessions));
        
        alert('练习完成！🎉 照顾好自己，做得很棒。');
        document.getElementById('interventionModal').classList.add('hidden');
        this.renderStreak();
    },

    // 日记
    logMood(mood) {
        localStorage.setItem('todayMood', mood);
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
        });
    },

    newJournalPrompt() {
        const prompt = this.journalPrompts[Math.floor(Math.random() * this.journalPrompts.length)];
        const el = document.getElementById('journalPrompt');
        if (el) el.textContent = prompt;
    },

    saveJournalEntry() {
        const content = document.getElementById('journalText');
        if (!content || !content.value.trim()) return;
        
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.unshift({
            date: new Date().toISOString(),
            title: '日记记录',
            content: content.value,
            mood: localStorage.getItem('todayMood') || 3
        });
        localStorage.setItem('journalEntries', JSON.stringify(entries));
        
        content.value = '';
        this.renderJournalEntries();
    },

    renderJournalEntries() {
        const container = document.getElementById('journalEntries');
        if (!container) return;
        
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const moods = ['', '😢', '😕', '😐', '🙂', '😊'];
        
        container.innerHTML = entries.slice(0, 5).map(entry => `
            <div class="journal-entry">
                <div class="mood">${moods[entry.mood] || '📝'}</div>
                <div class="journal-entry-content">
                    <h4>${entry.title}</h4>
                    <p>${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</p>
                    <small>${new Date(entry.date).toLocaleDateString('zh-CN')}</small>
                </div>
            </div>
        `).join('');
    },

    // 进度
    renderProgress() {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
        
        const totalSessions = sessions.length + checkins.length;
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) + (checkins.length * 5);
        
        const streakEl = document.getElementById('progressStreak');
        const sessionsEl = document.getElementById('progressSessions');
        const minutesEl = document.getElementById('progressMinutes');
        
        if (streakEl) streakEl.textContent = this.getStreak();
        if (sessionsEl) sessionsEl.textContent = totalSessions;
        if (minutesEl) minutesEl.textContent = totalMinutes;
        
        this.renderWeeklyChart();
        this.renderAchievements(totalSessions, totalMinutes);
    },

    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                    label: '分钟',
                    data: [15, 30, 10, 45, 20, 60, 25],
                    backgroundColor: '#14b8a6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    renderAchievements(sessions, minutes) {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        const achievements = [
            { icon: '✨', name: '第一步', unlocked: sessions >= 1 },
            { icon: '🥗', name: '沙拉大师', unlocked: sessions >= 5 },
            { icon: '🔥', name: '火热', unlocked: this.getStreak() >= 7 },
            { icon: '⏱️', name: '时间大师', unlocked: minutes >= 100 },
            { icon: '❤️', name: '自我慈悲', unlocked: sessions >= 3 },
            { icon: '⏸️', name: '暂停', unlocked: sessions >= 10 }
        ];
        
        container.innerHTML = achievements.map(a => `
            <div class="achievement ${a.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
            </div>
        `).join('');
    },

    loadData() {
        const mood = localStorage.getItem('todayMood');
        if (mood) this.logMood(parseInt(mood));
        this.renderJournalEntries();
    },

    // 版权保护 - 显示隐私政策
    showPrivacyPolicy() {
        alert('隐私政策：\n\n' +
            '© 2026 正念疗法. 保留所有权利.\n\n' +
            '您的数据存储在您的设备本地。\n' +
            '我们不收集或分享个人信息。\n' +
            '所有日记记录和进度数据保持私密。');
    },

    // 版权保护 - 显示使用条款
    showTerms() {
        alert('使用条款：\n\n' +
            '© 2026 正念疗法. 保留所有权利.\n\n' +
            '本应用仅供个人使用。\n' +
            '未经授权的复制、分发或修改被禁止。\n' +
            '内容和设计受版权法保护。');
    },

    toggleLearnSection(header) {
        header.classList.toggle('active');
        const content = header.nextElementSibling;
        if (content) {
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }
        }
    }
};

// 版权保护 - 禁用右键和某些键盘快捷键
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', (e) => {
    // 禁用 F12, Ctrl+Shift+I, Ctrl+U
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Tools dropdown functions
function toggleToolsMenu() {
    var menu = document.getElementById('toolsMenu');
    var btn = document.getElementById('toolsBtn');
    if (!menu || !btn) return;

    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        menu.classList.remove('open');
        btn.classList.remove('active');
    } else {
        var btnRect = btn.getBoundingClientRect();
        menu.style.top = (btnRect.bottom + 8) + 'px';
        menu.style.left = btnRect.left + 'px';
        menu.style.display = 'block';
        menu.classList.add('open');
        btn.classList.add('active');
    }
}

function closeToolsDropdown() {
    var menu = document.getElementById('toolsMenu');
    var btn = document.getElementById('toolsBtn');
    if (menu) {
        menu.style.display = 'none';
        menu.classList.remove('open');
        menu.style.top = 'auto';
        menu.style.left = 'auto';
    }
    if (btn) btn.classList.remove('active');
}

document.addEventListener('click', function(e) {
    var btn = document.getElementById('toolsBtn');
    var menu = document.getElementById('toolsMenu');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        closeToolsDropdown();
    }
});
