const mongoose = require('mongoose');

/**
 * Achievement Schema
 * Represents major achievements that users can unlock through various activities
 */
const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 80
    },
    description: {
        type: String,
        required: true,
        maxlength: 300
    },
    longDescription: {
        type: String,
        maxlength: 1000
    },
    category: {
        type: String,
        required: true,
        enum: [
            'health_journey', 'fitness_milestone', 'consistency', 'social_impact',
            'knowledge_seeker', 'mentor', 'challenger', 'wellness_warrior',
            'habit_master', 'goal_crusher', 'community_builder', 'pioneer'
        ]
    },
    type: {
        type: String,
        required: true,
        enum: ['single', 'progressive', 'cumulative', 'time_based', 'special'],
        default: 'single'
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard', 'expert', 'legendary'],
        default: 'medium'
    },
    rarity: {
        type: String,
        required: true,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'],
        default: 'common'
    },
    icon: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#007bff'
    },
    bannerImage: {
        type: String
    },
    requirements: {
        primary: {
            type: {
                type: String,
                required: true,
                enum: [
                    'challenges_completed', 'total_points', 'streak_days', 'consistency_score',
                    'badges_earned', 'social_interactions', 'days_active', 'categories_mastered',
                    'milestones_reached', 'improvements_made', 'goals_achieved', 'time_spent'
                ]
            },
            value: {
                type: Number,
                required: true,
                min: 0
            },
            operator: {
                type: String,
                enum: ['gte', 'lte', 'eq', 'gt', 'lt'],
                default: 'gte'
            }
        },
        secondary: [{
            type: {
                type: String,
                enum: [
                    'challenges_completed', 'total_points', 'streak_days', 'consistency_score',
                    'badges_earned', 'social_interactions', 'days_active', 'categories_mastered',
                    'specific_challenge', 'specific_badge', 'time_period'
                ]
            },
            value: mongoose.Schema.Types.Mixed,
            operator: {
                type: String,
                enum: ['gte', 'lte', 'eq', 'gt', 'lt', 'in', 'nin'],
                default: 'gte'
            }
        }],
        timeConstraint: {
            duration: {
                type: Number // in days
            },
            type: {
                type: String,
                enum: ['within', 'consecutive', 'before', 'after']
            }
        }
    },
    rewards: {
        points: {
            type: Number,
            default: 0
        },
        badges: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Badge'
        }],
        title: {
            type: String
        },
        privileges: [{
            type: String,
            enum: [
                'exclusive_challenges', 'beta_features', 'custom_themes',
                'priority_support', 'mentor_status', 'achievement_showcase',
                'special_forums', 'advanced_analytics', 'personalized_coaching'
            ]
        }],
        unlockables: [{
            type: {
                type: String,
                enum: ['avatar_item', 'theme', 'feature', 'content']
            },
            identifier: String,
            name: String
        }]
    },
    progression: {
        isProgressive: {
            type: Boolean,
            default: false
        },
        levels: [{
            level: {
                type: Number,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            requirement: {
                type: Number,
                required: true
            },
            points: {
                type: Number,
                default: 0
            }
        }],
        currentMaxLevel: {
            type: Number,
            default: 1
        }
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'hidden'],
        default: 'public'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSecret: {
        type: Boolean,
        default: false
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date
    },
    statistics: {
        totalUnlocked: {
            type: Number,
            default: 0
        },
        uniqueUnlockers: {
            type: Number,
            default: 0
        },
        firstUnlockedAt: {
            type: Date
        },
        lastUnlockedAt: {
            type: Date
        },
        averageTimeToUnlock: {
            type: Number, // in days
            default: 0
        },
        unlockRate: {
            type: Number, // percentage of users who unlocked
            default: 0
        }
    },
    metadata: {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        version: {
            type: String,
            default: '1.0'
        },
        tags: [String],
        relatedAchievements: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Achievement'
        }],
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Achievement'
        }],
        story: {
            type: String,
            maxlength: 2000
        },
        tips: [String]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
achievementSchema.virtual('isExpired').get(function() {
    return this.validUntil && new Date() > this.validUntil;
});

achievementSchema.virtual('isAvailable').get(function() {
    return this.isActive && !this.isExpired && new Date() >= this.validFrom;
});

achievementSchema.virtual('totalPointsValue').get(function() {
    let totalPoints = this.rewards.points || 0;
    
    // Add points from progressive levels
    if (this.progression.isProgressive && this.progression.levels.length > 0) {
        totalPoints += this.progression.levels.reduce((sum, level) => sum + (level.points || 0), 0);
    }
    
    // Add rarity bonus
    const rarityBonuses = {
        'common': 0,
        'uncommon': 50,
        'rare': 150,
        'epic': 300,
        'legendary': 750,
        'mythical': 1500
    };
    
    totalPoints += rarityBonuses[this.rarity] || 0;
    
    return totalPoints;
});

achievementSchema.virtual('difficultyScore').get(function() {
    const difficultyScores = {
        'easy': 1,
        'medium': 3,
        'hard': 6,
        'expert': 10,
        'legendary': 15
    };
    
    return difficultyScores[this.difficulty] || 3;
});

achievementSchema.virtual('prestigeLevel').get(function() {
    const rarityScores = {
        'common': 1,
        'uncommon': 2,
        'rare': 4,
        'epic': 7,
        'legendary': 12,
        'mythical': 20
    };
    
    const rarityScore = rarityScores[this.rarity] || 1;
    const difficultyScore = this.difficultyScore;
    
    return Math.ceil((rarityScore + difficultyScore) / 2);
});

// Indexes
achievementSchema.index({ category: 1, difficulty: 1 });
achievementSchema.index({ rarity: 1, isActive: 1 });
achievementSchema.index({ 'requirements.primary.type': 1, 'requirements.primary.value': 1 });
achievementSchema.index({ isActive: 1, isSecret: 1 });
achievementSchema.index({ 'statistics.totalUnlocked': -1 });
achievementSchema.index({ validFrom: 1, validUntil: 1 });
achievementSchema.index({ 'metadata.tags': 1 });

// Pre-save middleware
achievementSchema.pre('save', function(next) {
    // Update average time to unlock
    if (this.statistics.totalUnlocked > 0 && this.statistics.firstUnlockedAt) {
        const totalDays = (new Date() - this.statistics.firstUnlockedAt) / (1000 * 60 * 60 * 24);
        this.statistics.averageTimeToUnlock = totalDays / this.statistics.totalUnlocked;
    }
    
    // Ensure progressive achievements have proper level structure
    if (this.progression.isProgressive && this.progression.levels.length > 0) {
        this.progression.levels.sort((a, b) => a.level - b.level);
        this.progression.currentMaxLevel = Math.max(...this.progression.levels.map(l => l.level));
    }
    
    next();
});

// Instance methods
achievementSchema.methods.checkEligibility = function(userStats, userAchievements = []) {
    if (!this.isAvailable) return { eligible: false, reason: 'Achievement not available' };
    
    // Check prerequisites
    if (this.metadata.prerequisites && this.metadata.prerequisites.length > 0) {
        const hasAllPrerequisites = this.metadata.prerequisites.every(prereqId => 
            userAchievements.some(achievement => achievement._id.toString() === prereqId.toString())
        );
        
        if (!hasAllPrerequisites) {
            return { eligible: false, reason: 'Missing prerequisites' };
        }
    }
    
    // Check primary requirement
    const primaryReq = this.requirements.primary;
    const userValue = userStats[primaryReq.type];
    
    if (userValue === undefined) {
        return { eligible: false, reason: 'Missing required data' };
    }
    
    let primaryMet = false;
    switch (primaryReq.operator) {
        case 'gte':
            primaryMet = userValue >= primaryReq.value;
            break;
        case 'lte':
            primaryMet = userValue <= primaryReq.value;
            break;
        case 'gt':
            primaryMet = userValue > primaryReq.value;
            break;
        case 'lt':
            primaryMet = userValue < primaryReq.value;
            break;
        case 'eq':
            primaryMet = userValue === primaryReq.value;
            break;
    }
    
    if (!primaryMet) {
        return { 
            eligible: false, 
            reason: 'Primary requirement not met',
            progress: Math.min((userValue / primaryReq.value) * 100, 100)
        };
    }
    
    // Check secondary requirements
    if (this.requirements.secondary && this.requirements.secondary.length > 0) {
        for (const req of this.requirements.secondary) {
            const value = userStats[req.type];
            if (value === undefined) {
                return { eligible: false, reason: `Missing data for ${req.type}` };
            }
            
            let met = false;
            switch (req.operator) {
                case 'gte':
                    met = value >= req.value;
                    break;
                case 'lte':
                    met = value <= req.value;
                    break;
                case 'gt':
                    met = value > req.value;
                    break;
                case 'lt':
                    met = value < req.value;
                    break;
                case 'eq':
                    met = value === req.value;
                    break;
                case 'in':
                    met = Array.isArray(req.value) && req.value.includes(value);
                    break;
                case 'nin':
                    met = Array.isArray(req.value) && !req.value.includes(value);
                    break;
            }
            
            if (!met) {
                return { eligible: false, reason: `Secondary requirement not met: ${req.type}` };
            }
        }
    }
    
    // Check time constraint
    if (this.requirements.timeConstraint && this.requirements.timeConstraint.duration) {
        // This would require more complex logic based on user activity timeline
        // For now, we'll assume time constraints are met if other requirements are met
    }
    
    return { eligible: true, reason: 'All requirements met' };
};

achievementSchema.methods.calculateProgress = function(userStats) {
    if (!this.isAvailable) return 0;
    
    const primaryReq = this.requirements.primary;
    const userValue = userStats[primaryReq.type] || 0;
    
    if (this.progression.isProgressive) {
        // Find the highest level the user can achieve
        let currentLevel = 0;
        for (const level of this.progression.levels) {
            if (userValue >= level.requirement) {
                currentLevel = level.level;
            } else {
                break;
            }
        }
        
        const nextLevel = this.progression.levels.find(l => l.level > currentLevel);
        if (nextLevel) {
            const currentLevelReq = this.progression.levels.find(l => l.level === currentLevel)?.requirement || 0;
            const progress = ((userValue - currentLevelReq) / (nextLevel.requirement - currentLevelReq)) * 100;
            return Math.min(progress, 100);
        } else {
            return 100; // Max level reached
        }
    } else {
        return Math.min((userValue / primaryReq.value) * 100, 100);
    }
};

achievementSchema.methods.unlockForUser = function(userId, level = 1) {
    if (!this.isAvailable) {
        throw new Error('Achievement is not available for unlocking');
    }
    
    // Update statistics
    this.statistics.totalUnlocked += 1;
    this.statistics.lastUnlockedAt = new Date();
    
    if (!this.statistics.firstUnlockedAt) {
        this.statistics.firstUnlockedAt = new Date();
    }
    
    return this.save();
};

achievementSchema.methods.getRewardsForLevel = function(level = 1) {
    let rewards = {
        points: this.rewards.points || 0,
        badges: [...this.rewards.badges],
        title: this.rewards.title,
        privileges: [...this.rewards.privileges],
        unlockables: [...this.rewards.unlockables]
    };
    
    if (this.progression.isProgressive) {
        const levelData = this.progression.levels.find(l => l.level === level);
        if (levelData) {
            rewards.points += levelData.points || 0;
            rewards.levelTitle = levelData.title;
        }
    }
    
    return rewards;
};

// Static methods
achievementSchema.statics.findAvailableAchievements = function() {
    const now = new Date();
    return this.find({
        isActive: true,
        validFrom: { $lte: now },
        $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: now } }
        ]
    });
};

achievementSchema.statics.findByCategory = function(category) {
    return this.findAvailableAchievements().where({ category });
};

achievementSchema.statics.findByDifficulty = function(difficulty) {
    return this.findAvailableAchievements().where({ difficulty });
};

achievementSchema.statics.findEligibleAchievements = function(userStats, userAchievements = []) {
    return this.findAvailableAchievements().then(achievements => {
        return achievements.filter(achievement => {
            const result = achievement.checkEligibility(userStats, userAchievements);
            return result.eligible;
        });
    });
};

achievementSchema.statics.getProgressiveAchievements = function() {
    return this.findAvailableAchievements().where({ 'progression.isProgressive': true });
};

achievementSchema.statics.getSecretAchievements = function() {
    return this.find({ isSecret: true, isActive: true });
};

achievementSchema.statics.getPopularAchievements = function(limit = 10) {
    return this.findAvailableAchievements()
        .sort({ 'statistics.totalUnlocked': -1, 'statistics.uniqueUnlockers': -1 })
        .limit(limit);
};

achievementSchema.statics.getRareAchievements = function(limit = 5) {
    return this.findAvailableAchievements()
        .where({ rarity: { $in: ['epic', 'legendary', 'mythical'] } })
        .sort({ 'statistics.totalUnlocked': 1, rarity: 1 })
        .limit(limit);
};

achievementSchema.statics.createDefaultAchievements = async function() {
    const defaultAchievements = [
        {
            title: "Health Journey Begins",
            description: "Complete your first health challenge and start your wellness journey",
            category: "health_journey",
            type: "single",
            difficulty: "easy",
            rarity: "common",
            icon: "🌟",
            color: "#28a745",
            requirements: {
                primary: {
                    type: "challenges_completed",
                    value: 1,
                    operator: "gte"
                }
            },
            rewards: {
                points: 100,
                title: "Health Explorer"
            }
        },
        {
            title: "Consistency Master",
            description: "Maintain perfect consistency across multiple challenges",
            category: "consistency",
            type: "progressive",
            difficulty: "medium",
            rarity: "uncommon",
            icon: "⚡",
            color: "#17a2b8",
            requirements: {
                primary: {
                    type: "consistency_score",
                    value: 90,
                    operator: "gte"
                },
                secondary: [{
                    type: "challenges_completed",
                    value: 3,
                    operator: "gte"
                }]
            },
            progression: {
                isProgressive: true,
                levels: [
                    { level: 1, title: "Consistent Beginner", requirement: 90, points: 150 },
                    { level: 2, title: "Consistency Pro", requirement: 95, points: 250 },
                    { level: 3, title: "Consistency Master", requirement: 98, points: 400 }
                ]
            },
            rewards: {
                points: 200,
                title: "Consistency Champion",
                privileges: ["advanced_analytics"]
            }
        },
        {
            title: "Streak Legend",
            description: "Achieve incredible activity streaks that inspire others",
            category: "consistency",
            type: "progressive",
            difficulty: "hard",
            rarity: "epic",
            icon: "🔥",
            color: "#dc3545",
            requirements: {
                primary: {
                    type: "streak_days",
                    value: 30,
                    operator: "gte"
                }
            },
            progression: {
                isProgressive: true,
                levels: [
                    { level: 1, title: "30-Day Streak", requirement: 30, points: 300 },
                    { level: 2, title: "100-Day Streak", requirement: 100, points: 750 },
                    { level: 3, title: "365-Day Streak", requirement: 365, points: 2000 }
                ]
            },
            rewards: {
                points: 500,
                title: "Streak Master",
                privileges: ["exclusive_challenges", "achievement_showcase"]
            }
        },
        {
            title: "Point Millionaire",
            description: "Accumulate one million points through dedication and achievement",
            category: "goal_crusher",
            type: "single",
            difficulty: "legendary",
            rarity: "legendary",
            icon: "💎",
            color: "#6f42c1",
            requirements: {
                primary: {
                    type: "total_points",
                    value: 1000000,
                    operator: "gte"
                }
            },
            rewards: {
                points: 10000,
                title: "Health Millionaire",
                privileges: ["beta_features", "personalized_coaching", "special_forums"],
                unlockables: [
                    { type: "theme", identifier: "diamond_theme", name: "Diamond Theme" },
                    { type: "avatar_item", identifier: "crown", name: "Achievement Crown" }
                ]
            }
        },
        {
            title: "Community Builder",
            description: "Help and inspire others in their health journey through social interaction",
            category: "community_builder",
            type: "progressive",
            difficulty: "medium",
            rarity: "rare",
            icon: "🤝",
            color: "#fd7e14",
            requirements: {
                primary: {
                    type: "social_interactions",
                    value: 50,
                    operator: "gte"
                }
            },
            progression: {
                isProgressive: true,
                levels: [
                    { level: 1, title: "Helpful Friend", requirement: 50, points: 200 },
                    { level: 2, title: "Community Supporter", requirement: 150, points: 400 },
                    { level: 3, title: "Community Leader", requirement: 500, points: 800 }
                ]
            },
            rewards: {
                points: 300,
                title: "Community Champion",
                privileges: ["mentor_status"]
            }
        }
    ];

    const existingAchievements = await this.find({});
    if (existingAchievements.length === 0) {
        return this.insertMany(defaultAchievements);
    }
    
    return existingAchievements;
};

module.exports = mongoose.model('Achievement', achievementSchema);