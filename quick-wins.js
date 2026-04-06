// ============================================
// QUICK WINS - Calm Button & Breathing Guide
// ============================================

(function() {
    'use strict';
    
    // Calm Button Functionality
    window.initCalmButton = function() {
        const calmBtn = document.getElementById('calm-button');
        if (!calmBtn) return;
        
        calmBtn.addEventListener('click', function() {
            // Visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
            
            // 1. Close all modals and overlays
            document.querySelectorAll('.modal, .overlay, .popup, [role="dialog"]').forEach(el => {
                el.style.display = 'none';
                el.classList.remove('active', 'open', 'show');
            });
            
            // 2. Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 3. Clear form inputs
            document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
                if (input.type !== 'submit' && input.type !== 'button') {
                    input.value = '';
                    input.checked = false;
                }
            });
            
            // 4. Stop any playing media
            document.querySelectorAll('audio, video').forEach(media => {
                media.pause();
                media.currentTime = 0;
            });
            
            // 5. Play gentle chime
            playCalmChime();
            
            // 6. Reset breathing if running
            if (window.breathingGuide && window.breathingGuide.isRunning) {
                window.breathingGuide.stop();
            }
            
            console.log('🧘 Calm activated');
        });
        
        // Pulse animation after inactivity
        startCalmInactivityTimer(calmBtn);
    };
    
    function playCalmChime() {
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
        } catch (e) {}
    }
    
    function startCalmInactivityTimer(button) {
        let inactivityTimeout;
        
        function resetTimer() {
            button.classList.remove('pulse');
            clearTimeout(inactivityTimeout);
            inactivityTimeout = setTimeout(() => {
                button.classList.add('pulse');
            }, 30000);
        }
        
        ['click', 'scroll', 'keypress', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, { once: true });
        });
        
        resetTimer();
    }
    
    // 4-4-4 Breathing Guide
    window.initBreathingGuide = function() {
        const circle = document.getElementById('breathing-circle');
        const btn = document.getElementById('start-breathing');
        const breathText = document.getElementById('breath-text');
        
        if (!circle || !btn) return;
        
        window.breathingGuide = {
            isRunning: false,
            cycleCount: 0,
            maxCycles: 5,
            
            toggle() {
                this.isRunning ? this.stop() : this.start();
            },
            
            start() {
                this.isRunning = true;
                this.cycleCount = 0;
                btn.textContent = 'Stop';
                this.cycle();
            },
            
            stop() {
                this.isRunning = false;
                btn.textContent = 'Start Breathing';
                if (breathText) breathText.textContent = 'Ready?';
                circle.className = 'breathing-circle';
                document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
            },
            
            async cycle() {
                while (this.isRunning && this.cycleCount < this.maxCycles) {
                    this.cycleCount++;
                    
                    await this.setPhase('inhale', 'Breathe In', 4000);
                    if (!this.isRunning) break;
                    
                    await this.setPhase('hold', 'Hold', 4000);
                    if (!this.isRunning) break;
                    
                    await this.setPhase('exhale', 'Breathe Out', 4000);
                    if (!this.isRunning) break;
                }
                
                if (this.isRunning) {
                    this.stop();
                    if (breathText) breathText.textContent = 'Well Done!';
                }
            },
            
            setPhase(phase, text, duration) {
                return new Promise(resolve => {
                    circle.className = 'breathing-circle ' + phase;
                    if (breathText) breathText.textContent = text;
                    
                    document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
                    const activePhase = document.querySelector('.phase[data-phase="' + phase + '"]');
                    if (activePhase) activePhase.classList.add('active');
                    
                    setTimeout(resolve, duration);
                });
            }
        };
        
        btn.addEventListener('click', () => window.breathingGuide.toggle());
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        window.initCalmButton();
        window.initBreathingGuide();
        console.log('🧘 Quick Wins initialized');
    }
})();
