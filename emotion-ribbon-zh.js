// Emotion Ribbon Lexicon - Chinese Version
// 6 categories with Chinese emotion words

const EmotionRibbon = {
    // Core lexicon - Chinese words by category
    lexicon: {
        POWER: [
            '强大', '有力', '力量', '主导', '权威', '控制', '掌控', '领导', '自信', '能力',
            '胜利', '成功', '勇气', '勇敢', '能量', '活力', '成就', '雄心', '卓越', '英雄',
            '冠军', '征服', '优势', '坚定', '果断', '影响力', '掌控力', '实力', '强势', '威武',
            '激动', '开心', '乐观', '前进', '可能'
        ],
        POSSESSION: [
            '拥有', '占有', '获得', '得到', '收藏', '积累', '财富', '财产', '资产', '资源',
            '归属', '我的', '持有', '保留', '守护', '珍惜', '重视', '看重', '在意', '依恋',
            '依赖', '依靠', '寄托', '安心', '稳定', '安全', '满足', '充实', '丰富', '充裕'
        ],
        LOSS: [
            '失去', '失落', '丧失', '离别', '分离', '告别', '结束', '终止', '消失', '逝去',
            '遗憾', '后悔', '惋惜', '悲伤', '哀痛', '痛苦', '心碎', '受伤', '创伤', '打击',
            '挫折', '失败', '跌倒', '沉沦', '沮丧', '绝望', '无助', '孤独', '空虚', '迷茫'
        ],
        EMPTINESS: [
            '空虚', '空洞', '空白', '缺失', '缺乏', '不足', '贫乏', '匮乏', '饥饿', '渴望',
            '需要', '想要', '追求', '寻找', '探索', '迷茫', '困惑', '迷失', '漂泊', '流浪',
            '无根', '浮动', '不确定', '不安', '焦虑', '紧张', '担心', '忧虑', '烦躁', '躁动'
        ],
        CRAVE: [
            '渴望', '欲望', '渴求', '向往', '憧憬', '期待', '盼望', '希望', '梦想', '幻想',
            '迷恋', '痴迷', '着迷', '热衷', '热爱', '喜爱', '喜欢', '欣赏', '赞美', '羡慕',
            '嫉妒', '竞争', '争强', '好胜', '野心', '抱负', '志向', '理想', '目标', '追求'
        ],
        EMPATHY: [
            '共情', '同理', '理解', '体谅', '包容', '接纳', '宽恕', '原谅', '慈悲', '善良',
            '温暖', '关怀', '关心', '照顾', '呵护', '支持', '鼓励', '安慰', '陪伴', '倾听',
            '连接', '亲密', '信任', '真诚', '诚实', '敞开', '脆弱', '真实', '自然', '平和'
        ]
    },

    // Detect emotions in text
    detectEmotions(text) {
        const emotions = [];
        const words = text.toLowerCase().match(/[\u4e00-\u9fa5]+/g) || [];
        
        for (const [category, wordList] of Object.entries(this.lexicon)) {
            const matches = words.filter(word => wordList.includes(word));
            if (matches.length > 0) {
                emotions.push({
                    category,
                    words: matches,
                    intensity: matches.length
                });
            }
        }
        
        return emotions.sort((a, b) => b.intensity - a.intensity);
    },

    // Get dominant emotion
    getDominantEmotion(text) {
        const emotions = this.detectEmotions(text);
        return emotions.length > 0 ? emotions[0] : null;
    },

    // Get all words for a category
    getWords(category) {
        return this.lexicon[category] || [];
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.EmotionRibbon = EmotionRibbon;
    console.log('EmotionRibbon loaded successfully!');
    console.log('Available categories:', Object.keys(EmotionRibbon.lexicon));
} else {
    console.log('window not available');
}
