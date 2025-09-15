const mongoose = require('mongoose');

/**
 * Badge Schema
 * Represents badges that users can earn through various achievements
 */
const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        maxlength: 200
    },
    longDescription: {
        type: String,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: [
            'completion', 'streak', 'consistency', 'milestone', 
            'social', 'improvement', 'special', 'seasonal',
            'participation', 'leadership', 'dedication', 'explorer'
        ]
    },
    tier: {
        type: String,
        required: true,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    rarity: {
        type: String,
        required: true,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    icon: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#6c757d' // Bootstrap secondary color
    },
    conditions: {
        type: {
            type: String,
            required: true,
            enum: [
                'challenge_completion', 'streak_achievement', 'consistency_score',
                'points_earned', 'challenges_participated', 'days_active',
                'milestone_reached', 'social_interaction', 'improvement_rate',
                'special_event', 'category_mastery', 'time_based'
            ]
        },
        value: {
            type: Number,
            required: true
        },
        operator: {
            type: String,
            enum: ['gte', 'lte', 'eq', 'gt', 'lt'],
            default: 'gte'
        },
        additionalCriteria: [{
            field: String,
            value: mongoose.Schema.Types.Mixed,
            operator: {
                type: String,
                enum: ['gte', 'lte', 'eq', 'gt', 'lt', 'in', 'nin'],
                default: 'eq'
            }
        }]
    },
    rewards: {
        points: {
            type: Number,
            default: 0
        },
        title: {
            type: String
        },
        privileges: [{
            type: String,
            enum: [
                'custom_profile_badge', 'leaderboard_highlight', 
                'exclusive_challenges', 'priority_support',
                'early_access', 'special_avatar_frames'
            ]
        }]
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends_only'],
        default: 'public'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isLimited: {
        type: Boolean,
        default: false
    },
    limitedQuantity: {
        type: Number
    },
    validUntil: {
        type: Date
    },
    statistics: {
        totalEarned: {
            type: Number,
            default: 0
        },
        uniqueEarners: {
            type: Number,
            default: 0
        },
        firstEarnedAt: {
            type: Date
        },
        lastEarnedAt: {
            type: Date
        },
        averageTimeToEarn: {
            type: Number, // in days
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
        difficulty: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        estimatedTimeToEarn: {
            type: Number, // in days
            default: 7
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
badgeSchema.virtual('isExpired').get(function() {
    return this.validUntil && new Date() > this.validUntil;
});

badgeSchema.virtual('isAvailable').get(function() {
    return this.isActive && !this.isExpired && 
           (!this.isLimited || this.statistics.totalEarned < this.limitedQuantity);
});

badgeSchema.virtual('earnRate').get(function() {
    if (!this.createdAt || this.statistics.totalEarned === 0) return 0;
    const daysSinceCreation = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
    return this.statistics.totalEarned / daysSinceCreation;
});

badgeSchema.virtual('popularityScore').get(function() {
    let score = 0;
    
    // Base score from total earned
    score += this.statistics.totalEarned * 0.3;
    
    // Unique earners score
    score += this.statistics.uniqueEarners * 0.5;
    
    // Rarity multiplier (inversely related)
    const rarityMultipliers = {
        'common': 1,
        'uncommon': 1.2,
        'rare': 1.5,
        'epic': 2,
        'legendary': 3
    };
    score *= rarityMultipliers[this.rarity] || 1;
    
    // Difficulty bonus
    score += (this.metadata.difficulty || 0) * 5;
    
    return Math.round(score);
});

// Indexes
badgeSchema.index({ category: 1, tier: 1 });
badgeSchema.index({ rarity: 1, isActive: 1 });
badgeSchema.index({ 'conditions.type': 1, 'conditions.value': 1 });
badgeSchema.index({ isActive: 1, isLimited: 1 });
badgeSchema.index({ 'statistics.totalEarned': -1 });
badgeSchema.index({ 'metadata.tags': 1 });

// Pre-save middleware
badgeSchema.pre('save', function(next) {
    // Update average time to earn if we have data
    if (this.statistics.totalEarned > 0 && this.statistics.firstEarnedAt) {
        const totalDays = (new Date() - this.statistics.firstEarnedAt) / (1000 * 60 * 60 * 24);
        this.statistics.averageTimeToEarn = totalDays / this.statistics.totalEarned;
    }
    next();
});

// Instance methods
badgeSchema.methods.checkEligibility = function(userStats) {
    if (!this.isAvailable) return false;
    
    const condition = this.conditions;
    let userValue = userStats[condition.type];
    
    if (userValue === undefined) return false;
    
    // Check main condition
    let eligible = false;
    switch (condition.operator) {
        case 'gte':
            eligible = userValue >= condition.value;
            break;
        case 'lte':
            eligible = userValue <= condition.value;
            break;
        case 'gt':
            eligible = userValue > condition.value;
            break;
        case 'lt':
            eligible = userValue < condition.value;
            break;
        case 'eq':
            eligible = userValue === condition.value;
            break;
        default:
            eligible = false;
    }
    
    if (!eligible) return false;
    
    // Check additional criteria
    if (condition.additionalCriteria && condition.additionalCriteria.length > 0) {
        for (const criteria of condition.additionalCriteria) {
            const fieldValue = userStats[criteria.field];
            if (fieldValue === undefined) return false;
            
            switch (criteria.operator) {
                case 'gte':
                    if (!(fieldValue >= criteria.value)) return false;
                    break;
                case 'lte':
                    if (!(fieldValue <= criteria.value)) return false;
                    break;
                case 'gt':
                    if (!(fieldValue > criteria.value)) return false;
                    break;
                case 'lt':
                    if (!(fieldValue < criteria.value)) return false;
                    break;
                case 'eq':
                    if (!(fieldValue === criteria.value)) return false;
                    break;
                case 'in':
                    if (!Array.isArray(criteria.value) || !criteria.value.includes(fieldValue)) return false;
                    break;
                case 'nin':
                    if (!Array.isArray(criteria.value) || criteria.value.includes(fieldValue)) return false;
                    break;
                default:
                    return false;
            }
        }
    }
    
    return true;
};

badgeSchema.methods.awardToUser = function(userId) {
    if (!this.isAvailable) {
        throw new Error('Badge is not available for awarding');
    }
    
    // Update statistics
    this.statistics.totalEarned += 1;
    this.statistics.lastEarnedAt = new Date();
    
    if (!this.statistics.firstEarnedAt) {
        this.statistics.firstEarnedAt = new Date();
    }
    
    return this.save();
};

badgeSchema.methods.getPointsValue = function() {
    let points = this.rewards.points || 0;
    
    // Add bonus points based on rarity
    const rarityBonuses = {
        'common': 0,
        'uncommon': 10,
        'rare': 25,
        'epic': 50,
        'legendary': 100
    };
    
    points += rarityBonuses[this.rarity] || 0;
    
    // Add tier bonus
    const tierBonuses = {
        'bronze': 0,
        'silver': 15,
        'gold': 30,
        'platinum': 50,
        'diamond': 75
    };
    
    points += tierBonuses[this.tier] || 0;
    
    return points;
};

// Static methods
badgeSchema.statics.findAvailableBadges = function() {
    return this.find({
        isActive: true,
        $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: new Date() } }
        ],
        $or: [
            { isLimited: false },
            { 
                isLimited: true,
                $expr: { $lt: ['$statistics.totalEarned', '$limitedQuantity'] }
            }
        ]
    });
};

badgeSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

badgeSchema.statics.findByRarity = function(rarity) {
    return this.find({ rarity, isActive: true });
};

badgeSchema.statics.findEligibleBadges = function(userStats) {
    return this.findAvailableBadges().then(badges => {
        return badges.filter(badge => badge.checkEligibility(userStats));
    });
};

badgeSchema.statics.getPopularBadges = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ 'statistics.totalEarned': -1, 'statistics.uniqueEarners': -1 })
        .limit(limit);
};

badgeSchema.statics.getRareBadges = function(limit = 5) {
    return this.find({ 
        isActive: true,
        rarity: { $in: ['rare', 'epic', 'legendary'] }
    })
    .sort({ 'statistics.totalEarned': 1 }) // Least earned = most rare
    .limit(limit);
};

badgeSchema.statics.createDefaultBadges = async function() {
    const defaultBadges = [
        {
            name: "First Steps",
            description: "Complete your first health challenge",
            category: "completion",
            tier: "bronze",
            rarity: "common",
            icon: "🏃‍♂️",
            color: "#17a2b8",
            conditions: {
                type: "challenge_completion",
                value: 1,
                operator: "gte"
            },
            rewards: { points: 50 }
        },
        {
            name: "Streak Starter",
            description: "Maintain a 7-day activity streak",
            category: "streak",
            tier: "bronze",
            rarity: "common",
            icon: "🔥",
            color: "#fd7e14",
            conditions: {
                type: "streak_achievement",
                value: 7,
                operator: "gte"
            },
            rewards: { points: 75 }
        },
        {
            name: "Consistency Champion",
            description: "Achieve 80% consistency in a challenge",
            category: "consistency",
            tier: "silver",
            rarity: "uncommon",
            icon: "⭐",
            color: "#6f42c1",
            conditions: {
                type: "consistency_score",
                value: 80,
                operator: "gte"
            },
            rewards: { points: 100 }
        },
        {
            name: "Point Collector",
            description: "Earn 1000 total points",
            category: "milestone",
            tier: "silver",
            rarity: "uncommon",
            icon: "💎",
            color: "#20c997",
            conditions: {
                type: "points_earned",
                value: 1000,
                operator: "gte"
            },
            rewards: { points: 150 }
        },
        {
            name: "Challenge Master",
            description: "Complete 10 different challenges",
            category: "completion",
            tier: "gold",
            rarity: "rare",
            icon: "🏆",
            color: "#ffc107",
            conditions: {
                type: "challenge_completion",
                value: 10,
                operator: "gte"
            },
            rewards: { 
                points: 300,
                title: "Challenge Master",
                privileges: ["custom_profile_badge", "leaderboard_highlight"]
            }
        },
        {
            name: "Streak Legend",
            description: "Maintain a 100-day streak",
            category: "streak",
            tier: "platinum",
            rarity: "epic",
            icon: "🚀",
            color: "#e83e8c",
            conditions: {
                type: "streak_achievement",
                value: 100,
                operator: "gte"
            },
            rewards: { 
                points: 1000,
                title: "Streak Legend",
                privileges: ["exclusive_challenges", "special_avatar_frames"]
            }
        }
    ];

    const existingBadges = await this.find({});
    if (existingBadges.length === 0) {
        return this.insertMany(defaultBadges);
    }
    
    return existingBadges;
};

module.exports = mongoose.model('Badge', badgeSchema);