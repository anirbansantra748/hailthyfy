const mongoose = require('mongoose');

/**
 * Health Challenge Schema
 * Represents individual health challenges that users can participate in
 */
const healthChallengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: [
            'fitness', 'nutrition', 'mental-health', 'sleep', 
            'hydration', 'meditation', 'social', 'medical'
        ]
    },
    type: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'one-time', 'ongoing']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    target: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            required: true,
            enum: [
                'steps', 'minutes', 'hours', 'days', 'times', 
                'glasses', 'servings', 'kg', 'lbs', 'calories', 'points'
            ]
        },
        description: String
    },
    duration: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    rewards: {
        points: {
            type: Number,
            default: 0
        },
        badges: [{
            name: String,
            icon: String,
            description: String
        }],
        achievements: [{
            name: String,
            description: String,
            icon: String
        }]
    },
    rules: [{
        type: String,
        description: String
    }],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'paused', 'abandoned'],
            default: 'active'
        }
    }],
    statistics: {
        totalParticipants: {
            type: Number,
            default: 0
        },
        completedParticipants: {
            type: Number,
            default: 0
        },
        averageProgress: {
            type: Number,
            default: 0
        },
        popularityScore: {
            type: Number,
            default: 0
        }
    },
    media: {
        icon: String,
        images: [String],
        video: String
    },
    instructions: String,
    tips: [String],
    relatedChallenges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthChallenge'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for checking if challenge is currently active
healthChallengeSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    return this.isActive && now >= this.duration.start && now <= this.duration.end;
});

// Virtual for challenge progress percentage
healthChallengeSchema.virtual('completionRate').get(function() {
    if (this.statistics.totalParticipants === 0) return 0;
    return (this.statistics.completedParticipants / this.statistics.totalParticipants) * 100;
});

// Index for efficient queries
healthChallengeSchema.index({ category: 1, isActive: 1 });
healthChallengeSchema.index({ 'duration.start': 1, 'duration.end': 1 });
healthChallengeSchema.index({ difficulty: 1, type: 1 });
healthChallengeSchema.index({ 'statistics.popularityScore': -1 });

// Static methods
healthChallengeSchema.statics.getActivechallenges = function() {
    const now = new Date();
    return this.find({
        isActive: true,
        'duration.start': { $lte: now },
        'duration.end': { $gte: now }
    }).populate('createdBy', 'name email');
};

healthChallengeSchema.statics.getChallengesByCategory = function(category) {
    return this.find({ category, isActive: true })
        .sort({ 'statistics.popularityScore': -1 });
};

healthChallengeSchema.statics.getPopularChallenges = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ 'statistics.popularityScore': -1 })
        .limit(limit);
};

// Instance methods
healthChallengeSchema.methods.addParticipant = async function(userId) {
    const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
    if (!existingParticipant) {
        this.participants.push({ user: userId });
        this.statistics.totalParticipants += 1;
        await this.save();
    }
    return this;
};

healthChallengeSchema.methods.removeParticipant = async function(userId) {
    this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
    this.statistics.totalParticipants = Math.max(0, this.statistics.totalParticipants - 1);
    await this.save();
    return this;
};

healthChallengeSchema.methods.updatePopularityScore = async function() {
    // Calculate popularity based on participants, completion rate, and recency
    const ageInDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - ageInDays);
    const participantScore = Math.min(this.statistics.totalParticipants * 2, 100);
    const completionScore = this.completionRate;
    
    this.statistics.popularityScore = (recencyScore * 0.3) + (participantScore * 0.4) + (completionScore * 0.3);
    await this.save();
    return this;
};

module.exports = mongoose.model('HealthChallenge', healthChallengeSchema);