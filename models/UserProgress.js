const mongoose = require('mongoose');

/**
 * User Progress Schema
 * Tracks individual user progress across health challenges
 */
const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthChallenge',
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'active', 'completed', 'paused', 'abandoned', 'failed'],
        default: 'not_started'
    },
    progress: {
        current: {
            type: Number,
            default: 0,
            min: 0
        },
        target: {
            type: Number,
            required: true,
            min: 1
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        unit: {
            type: String,
            required: true
        }
    },
    streak: {
        current: {
            type: Number,
            default: 0
        },
        longest: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date
        }
    },
    milestones: [{
        percentage: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        achievedAt: {
            type: Date
        },
        isAchieved: {
            type: Boolean,
            default: false
        }
    }],
    dailyLog: [{
        date: {
            type: Date,
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 0
        },
        notes: {
            type: String,
            maxlength: 500
        },
        mood: {
            type: String,
            enum: ['excellent', 'good', 'average', 'poor', 'terrible']
        },
        difficulty: {
            type: String,
            enum: ['very_easy', 'easy', 'moderate', 'hard', 'very_hard']
        }
    }],
    rewards: {
        pointsEarned: {
            type: Number,
            default: 0
        },
        badgesEarned: [{
            badge: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Badge'
            },
            earnedAt: {
                type: Date,
                default: Date.now
            }
        }],
        achievementsUnlocked: [{
            achievement: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Achievement'
            },
            unlockedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    timestamps: {
        startedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        lastUpdatedAt: {
            type: Date,
            default: Date.now
        }
    },
    performance: {
        averageDailyProgress: {
            type: Number,
            default: 0
        },
        consistencyScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        motivationLevel: {
            type: Number,
            default: 5,
            min: 1,
            max: 10
        }
    },
    personalNotes: {
        type: String,
        maxlength: 1000
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    shareProgress: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
userProgressSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

userProgressSchema.virtual('isCompleted').get(function() {
    return this.status === 'completed';
});

userProgressSchema.virtual('daysActive').get(function() {
    if (!this.timestamps.startedAt) return 0;
    const endDate = this.timestamps.completedAt || new Date();
    return Math.ceil((endDate - this.timestamps.startedAt) / (1000 * 60 * 60 * 24));
});

userProgressSchema.virtual('averageDailyValue').get(function() {
    if (this.dailyLog.length === 0) return 0;
    const totalValue = this.dailyLog.reduce((sum, log) => sum + log.value, 0);
    return totalValue / this.dailyLog.length;
});

userProgressSchema.virtual('completionTimeRemaining').get(function() {
    if (this.status === 'completed') return 0;
    const avgDaily = this.averageDailyValue;
    if (avgDaily === 0) return -1; // Cannot estimate
    const remaining = this.progress.target - this.progress.current;
    return Math.ceil(remaining / avgDaily);
});

// Compound indexes
userProgressSchema.index({ user: 1, challenge: 1 }, { unique: true });
userProgressSchema.index({ user: 1, status: 1 });
userProgressSchema.index({ challenge: 1, status: 1 });
userProgressSchema.index({ 'timestamps.lastUpdatedAt': -1 });
userProgressSchema.index({ 'performance.consistencyScore': -1 });

// Pre-save middleware to calculate derived values
userProgressSchema.pre('save', function(next) {
    // Update percentage
    this.progress.percentage = Math.min((this.progress.current / this.progress.target) * 100, 100);
    
    // Update last updated timestamp
    this.timestamps.lastUpdatedAt = new Date();
    
    // Calculate consistency score based on daily log regularity
    if (this.dailyLog.length > 0) {
        const sortedLogs = this.dailyLog.sort((a, b) => new Date(a.date) - new Date(b.date));
        let consistentDays = 0;
        let totalExpectedDays = this.daysActive;
        
        if (totalExpectedDays > 0) {
            // Count how many days have logs
            const uniqueDays = new Set(sortedLogs.map(log => log.date.toDateString()));
            consistentDays = uniqueDays.size;
            this.performance.consistencyScore = Math.min((consistentDays / totalExpectedDays) * 100, 100);
        }
    }
    
    // Calculate average daily progress
    if (this.dailyLog.length > 0) {
        this.performance.averageDailyProgress = this.averageDailyValue;
    }
    
    // Update streak
    if (this.dailyLog.length > 0) {
        this.updateStreak();
    }
    
    next();
});

// Instance methods
userProgressSchema.methods.addDailyEntry = function(value, notes = '', mood = null, difficulty = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if entry for today already exists
    const existingEntry = this.dailyLog.find(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
    });
    
    if (existingEntry) {
        // Update existing entry
        existingEntry.value = value;
        existingEntry.notes = notes;
        if (mood) existingEntry.mood = mood;
        if (difficulty) existingEntry.difficulty = difficulty;
    } else {
        // Add new entry
        this.dailyLog.push({
            date: today,
            value: value,
            notes: notes,
            mood: mood,
            difficulty: difficulty
        });
    }
    
    // Update current progress
    this.progress.current += value;
    
    // Check for completion
    if (this.progress.current >= this.progress.target && this.status !== 'completed') {
        this.status = 'completed';
        this.timestamps.completedAt = new Date();
    }
    
    return this.save();
};

userProgressSchema.methods.updateStreak = function() {
    if (this.dailyLog.length === 0) return;
    
    const sortedLogs = this.dailyLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    
    for (const log of sortedLogs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        
        if (lastDate) {
            const daysDiff = (lastDate - logDate) / (1000 * 60 * 60 * 24);
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        } else {
            tempStreak = 1;
            // Check if the most recent log is today or yesterday
            const daysSinceToday = (today - logDate) / (1000 * 60 * 60 * 24);
            if (daysSinceToday <= 1) {
                currentStreak = tempStreak;
            }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = logDate;
    }
    
    this.streak.current = currentStreak;
    this.streak.longest = Math.max(longestStreak, this.streak.longest);
    this.streak.lastActivity = sortedLogs[0].date;
};

userProgressSchema.methods.awardBadge = function(badgeId) {
    const existingBadge = this.rewards.badgesEarned.find(b => 
        b.badge.toString() === badgeId.toString()
    );
    
    if (!existingBadge) {
        this.rewards.badgesEarned.push({ badge: badgeId });
        return this.save();
    }
    
    return Promise.resolve(this);
};

userProgressSchema.methods.unlockAchievement = function(achievementId) {
    const existingAchievement = this.rewards.achievementsUnlocked.find(a => 
        a.achievement.toString() === achievementId.toString()
    );
    
    if (!existingAchievement) {
        this.rewards.achievementsUnlocked.push({ achievement: achievementId });
        return this.save();
    }
    
    return Promise.resolve(this);
};

userProgressSchema.methods.calculateMotivationLevel = function() {
    let motivation = 5; // Base level
    
    // Boost for consistency
    if (this.performance.consistencyScore > 80) motivation += 2;
    else if (this.performance.consistencyScore > 60) motivation += 1;
    
    // Boost for current streak
    if (this.streak.current > 7) motivation += 2;
    else if (this.streak.current > 3) motivation += 1;
    
    // Reduce for lack of recent activity
    if (this.streak.lastActivity) {
        const daysSinceActivity = (new Date() - this.streak.lastActivity) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 3) motivation -= 1;
        if (daysSinceActivity > 7) motivation -= 2;
    }
    
    // Consider mood from recent logs
    const recentLogs = this.dailyLog
        .filter(log => log.mood)
        .slice(-7); // Last 7 logs with mood
    
    if (recentLogs.length > 0) {
        const moodScores = {
            'excellent': 2,
            'good': 1,
            'average': 0,
            'poor': -1,
            'terrible': -2
        };
        
        const avgMoodScore = recentLogs.reduce((sum, log) => 
            sum + moodScores[log.mood], 0) / recentLogs.length;
        
        motivation += Math.round(avgMoodScore);
    }
    
    this.performance.motivationLevel = Math.max(1, Math.min(10, motivation));
    return this.performance.motivationLevel;
};

// Static methods
userProgressSchema.statics.findUserProgress = function(userId, challengeId = null) {
    const query = { user: userId };
    if (challengeId) query.challenge = challengeId;
    
    return this.find(query)
        .populate('challenge', 'title category difficulty target duration')
        .populate('rewards.badgesEarned.badge')
        .populate('rewards.achievementsUnlocked.achievement');
};

userProgressSchema.statics.getLeaderboard = function(challengeId, limit = 10) {
    return this.find({ 
        challenge: challengeId, 
        status: { $in: ['active', 'completed'] } 
    })
    .populate('user', 'name profilePicture')
    .sort({ 
        'progress.percentage': -1, 
        'timestamps.completedAt': 1,
        'performance.consistencyScore': -1 
    })
    .limit(limit);
};

userProgressSchema.statics.getTopPerformers = function(limit = 10) {
    return this.aggregate([
        {
            $match: { status: { $in: ['active', 'completed'] } }
        },
        {
            $group: {
                _id: '$user',
                totalPoints: { $sum: '$rewards.pointsEarned' },
                challengesCompleted: { 
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
                },
                averageConsistency: { $avg: '$performance.consistencyScore' },
                longestStreak: { $max: '$streak.longest' }
            }
        },
        {
            $sort: { 
                totalPoints: -1, 
                challengesCompleted: -1, 
                averageConsistency: -1 
            }
        },
        { $limit: limit }
    ]);
};

module.exports = mongoose.model('UserProgress', userProgressSchema);