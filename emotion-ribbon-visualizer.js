// Emotion Ribbon Visualizer - Real-time ribbon display
// Creates SVG-based emotion ribbon that updates dynamically

class EmotionRibbonVisualizer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || 600,
            height: options.height || 120,
            segmentWidth: options.segmentWidth || 80,
            maxSegments: options.maxSegments || 10,
            ...options
        };
        
        this.segments = [];
        this.init();
    }

    init() {
        if (!this.container) return;
        
        // Create SVG container
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
        this.svg.setAttribute('class', 'emotion-ribbon-svg');
        this.svg.style.width = '100%';
        this.svg.style.maxWidth = `${this.options.width}px`;
        this.svg.style.height = 'auto';
        
        // Create defs for gradients
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = this.createGradients();
        this.svg.appendChild(defs);
        
        // Create ribbon path group
        this.ribbonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(this.ribbonGroup);
        
        // Create label group
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(this.labelGroup);
        
        this.container.appendChild(this.svg);
        
        // Add CSS
        this.addStyles();
    }

    createGradients() {
        // Check if EmotionRibbon is available
        if (typeof EmotionRibbon === 'undefined' || !EmotionRibbon.getAllCategories) {
            return '';
        }
        
        const categories = EmotionRibbon.getAllCategories();
        return categories.map(cat => `
            <linearGradient id="grad-${cat.key}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:${cat.color};stop-opacity:0.9" />
                <stop offset="50%" style="stop-color:${cat.colorMedium};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${cat.color};stop-opacity:0.9" />
            </linearGradient>
        `).join('');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .emotion-ribbon-svg {
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
            }
            .ribbon-segment {
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .ribbon-segment:hover {
                filter: brightness(1.1);
                transform: scaleY(1.05);
            }
            .ribbon-label {
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                font-weight: 500;
                fill: white;
                text-anchor: middle;
                pointer-events: none;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .ribbon-emoji {
                font-size: 16px;
                text-anchor: middle;
                pointer-events: none;
            }
            .ribbon-connector {
                fill: none;
                stroke: rgba(255,255,255,0.3);
                stroke-width: 2;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update gradients when EmotionRibbon becomes available
     */
    updateGradients() {
        if (typeof EmotionRibbon === 'undefined' || !EmotionRibbon.getAllCategories) {
            return;
        }
        
        const defs = this.svg.querySelector('defs');
        if (defs) {
            defs.innerHTML = this.createGradients();
        }
    }

    /**
     * Add a new emotion segment to the ribbon
     */
    addSegment(category, intensity = 0.5, label = null) {
        // Ensure EmotionRibbon is available
        if (typeof EmotionRibbon === 'undefined' || !EmotionRibbon.categories) {
            console.warn('EmotionRibbon not available yet');
            return;
        }
        
        const cat = EmotionRibbon.categories[category];
        if (!cat) return;

        const segment = {
            category,
            intensity: Math.max(0.2, Math.min(1, intensity)),
            label: label || cat.name,
            emoji: cat.emoji,
            timestamp: Date.now()
        };

        this.segments.push(segment);
        
        // Limit segments
        if (this.segments.length > this.options.maxSegments) {
            this.segments.shift();
        }

        this.render();
        return segment;
    }

    /**
     * Update ribbon with emotion analysis results
     */
    updateFromAnalysis(analysis) {
        const { detected } = analysis;
        
        // Add segments for each detected emotion
        Object.entries(detected).forEach(([category, data]) => {
            this.addSegment(category, data.intensity);
        });
    }

    /**
     * Render the ribbon
     */
    render() {
        if (!this.ribbonGroup) return;

        // Clear existing
        this.ribbonGroup.innerHTML = '';
        this.labelGroup.innerHTML = '';

        if (this.segments.length === 0) {
            this.renderEmpty();
            return;
        }

        const segmentWidth = Math.min(
            this.options.segmentWidth,
            (this.options.width - 40) / this.segments.length
        );
        const startX = (this.options.width - (segmentWidth * this.segments.length)) / 2;
        const centerY = this.options.height / 2;

        this.segments.forEach((seg, index) => {
            const x = startX + index * segmentWidth;
            const cat = EmotionRibbon.categories[seg.category];
            
            // Calculate dimensions based on intensity
            const height = 40 + (seg.intensity * 40); // 40-80px
            const y = centerY - height / 2;
            
            // Create ribbon segment path (wave shape)
            const path = this.createSegmentPath(x, y, segmentWidth - 4, height, index);
            
            // Add segment
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', path);
            pathEl.setAttribute('fill', `url(#grad-${seg.category})`);
            pathEl.setAttribute('class', 'ribbon-segment');
            pathEl.setAttribute('rx', '8');
            
            // Add tooltip on hover
            pathEl.addEventListener('mouseenter', () => {
                this.showTooltip(seg, x + segmentWidth/2, y);
            });
            pathEl.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            this.ribbonGroup.appendChild(pathEl);
            
            // Add label
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', x + segmentWidth / 2);
            textEl.setAttribute('y', centerY + 5);
            textEl.setAttribute('class', 'ribbon-label');
            textEl.textContent = seg.label;
            this.labelGroup.appendChild(textEl);
            
            // Add emoji above
            const emojiEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            emojiEl.setAttribute('x', x + segmentWidth / 2);
            emojiEl.setAttribute('y', y - 8);
            emojiEl.setAttribute('class', 'ribbon-emoji');
            emojiEl.textContent = seg.emoji;
            this.labelGroup.appendChild(emojiEl);
            
            // Add connector to next segment
            if (index < this.segments.length - 1) {
                const connector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const nextX = startX + (index + 1) * segmentWidth;
                connector.setAttribute('d', `M ${x + segmentWidth - 4} ${centerY} Q ${x + segmentWidth + 2} ${centerY} ${nextX} ${centerY}`);
                connector.setAttribute('class', 'ribbon-connector');
                this.ribbonGroup.insertBefore(connector, pathEl);
            }
        });
    }

    /**
     * Create wave-shaped path for segment
     */
    createSegmentPath(x, y, width, height, index) {
        const waveHeight = height * 0.15;
        const topY = y;
        const bottomY = y + height;
        const midY = y + height / 2;
        
        // Alternate wave direction
        const waveDir = index % 2 === 0 ? 1 : -1;
        
        return `
            M ${x} ${midY}
            C ${x + width * 0.2} ${topY - waveHeight * waveDir}, 
              ${x + width * 0.3} ${topY}, 
              ${x + width / 2} ${topY}
            C ${x + width * 0.7} ${topY}, 
              ${x + width * 0.8} ${topY - waveHeight * waveDir}, 
              ${x + width} ${midY}
            C ${x + width * 0.8} ${bottomY + waveHeight * waveDir}, 
              ${x + width * 0.7} ${bottomY}, 
              ${x + width / 2} ${bottomY}
            C ${x + width * 0.3} ${bottomY}, 
              ${x + width * 0.2} ${bottomY + waveHeight * waveDir}, 
              ${x} ${midY}
            Z
        `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.options.width / 2);
        text.setAttribute('y', this.options.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '14');
        text.textContent = 'Start typing to see your emotion ribbon...';
        this.ribbonGroup.appendChild(text);
    }

    /**
     * Show tooltip
     */
    showTooltip(segment, x, y) {
        this.hideTooltip();
        
        const cat = EmotionRibbon.categories[segment.category];
        const tooltip = document.createElement('div');
        tooltip.className = 'emotion-ribbon-tooltip';
        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${cat.emoji} ${cat.name}</div>
            <div style="font-size: 12px; opacity: 0.9;">${cat.description}</div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.8;">
                Intensity: ${Math.round(segment.intensity * 100)}%
            </div>
        `;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(30, 41, 59, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 200px;
        `;
        
        // Position tooltip
        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = `${rect.left + x - 80}px`;
        tooltip.style.top = `${rect.top + y - 80}px`;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    /**
     * Clear all segments
     */
    clear() {
        this.segments = [];
        this.render();
    }

    /**
     * Get current segments
     */
    getSegments() {
        return [...this.segments];
    }
}

// Make available globally
window.EmotionRibbonVisualizer = EmotionRibbonVisualizer;
