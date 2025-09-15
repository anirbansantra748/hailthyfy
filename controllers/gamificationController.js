const HealthChallenge = require('../models/HealthChallenge');
const UserProgress = require('../models/UserProgress');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

/**
 * Gamification Controller
 * Handles CRUD operations for challenges, progress tracking, achievements, and badges
 */

// ====================== HEALTH CHALLENGES ======================

// Get all challenges with filters
exports.getChallenges = async (req, res) => {
    try {
        const { 
            category, 
            difficulty, 
            status = 'active', 
            page = 1, 
            limit = 12,
            search,
            sortBy = 'popularity'
        } = req.query;

        const query = { isPublic: true };
        
        // Apply filters
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (status === 'active') {
            query.isActive = true;
            const now = new Date();
            query['duration.start'] = { $lte: now };
            query['duration.end'] = { $gte: now };
        }

        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }

        // Sorting options
        let sortOptions = {};
        switch (sortBy) {
            case 'popularity':
                sortOptions = { 'statistics.popularityScore': -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'difficulty':
                sortOptions = { difficulty: 1 };
                break;
            case 'participants':
                sortOptions = { 'statistics.totalParticipants': -1 };
                break;
            default:
                sortOptions = { 'statistics.popularityScore': -1 };
        }

        const challenges = await HealthChallenge.find(query)
            .populate('createdBy', 'name profilePicture')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await HealthChallenge.countDocuments(query);

        res.json({
            success: true,
            data: {
                challenges,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch challenges',
            details: error.message
        });
    }
};

// Get single challenge by ID
exports.getChallengeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const challenge = await HealthChallenge.findById(id)
            .populate('createdBy', 'name profilePicture')
            .populate('participants.user', 'name profilePicture');

        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }

        // Check if current user is participating
        let userProgress = null;
        if (userId) {
            userProgress = await UserProgress.findOne({ 
                user: userId, 
                challenge: id 
            });
        }

        res.json({
            success: true,
            data: {
                challenge,
                userProgress,
                isParticipating: !!userProgress
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch challenge',
            details: error.message
        });
    }
};

// Create new challenge
exports.createChallenge = async (req, res) => {
    try {
        console.log('Creating challenge with data:', req.body);
        
        // Transform the data to match the schema
        const challengeData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            type: req.body.type,
            difficulty: req.body.difficulty,
            target: {
                value: parseInt(req.body.target?.value || req.body.targetValue),
                unit: req.body.target?.unit || req.body.targetUnit,
                description: req.body.target?.description || `Reach ${req.body.targetValue || req.body.target?.value} ${req.body.targetUnit || req.body.target?.unit}`
            },
            duration: {
                start: new Date(req.body.duration?.start || req.body.startDate),
                end: new Date(req.body.duration?.end || req.body.endDate)
            },
            rewards: {
                points: parseInt(req.body.rewards?.points || req.body.rewardPoints) || 100,
                badges: req.body.rewards?.badges || [],
                achievements: req.body.rewards?.achievements || []
            },
            instructions: req.body.instructions || '',
            tips: Array.isArray(req.body.tips) ? req.body.tips : (req.body.tips ? req.body.tips.split('\n').filter(tip => tip.trim()) : []),
            tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
            isPublic: req.body.isPublic === 'true' || req.body.isPublic === true,
            isActive: req.body.isActive !== false,
            createdBy: req.user.id,
            statistics: {
                totalParticipants: 0,
                completedParticipants: 0,
                averageProgress: 0,
                popularityScore: 0
            },
            participants: []
        };

        console.log('Transformed challenge data:', challengeData);

        const challenge = new HealthChallenge(challengeData);
        await challenge.save();

        console.log('Challenge created successfully:', challenge._id);

        res.status(201).json({
            success: true,
            data: challenge,
            message: 'Challenge created successfully'
        });
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to create challenge',
            details: error.message
        });
    }
};

// Update challenge
exports.updateChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const challenge = await HealthChallenge.findById(id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }

        // Check if user is creator or admin
        if (challenge.createdBy.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this challenge'
            });
        }

        const updatedChallenge = await HealthChallenge.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedChallenge,
            message: 'Challenge updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Failed to update challenge',
            details: error.message
        });
    }
};

// Delete challenge
exports.deleteChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const challenge = await HealthChallenge.findById(id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }

        // Check if user is creator or admin
        if (challenge.createdBy.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this challenge'
            });
        }

        await HealthChallenge.findByIdAndDelete(id);
        
        // Also delete related user progress records
        await UserProgress.deleteMany({ challenge: id });

        res.json({
            success: true,
            message: 'Challenge deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete challenge',
            details: error.message
        });
    }
};

// Join challenge
exports.joinChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const challenge = await HealthChallenge.findById(id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }

        if (!challenge.isCurrentlyActive) {
            return res.status(400).json({
                success: false,
                error: 'Challenge is not currently active'
            });
        }

        // Check if already participating
        const existingProgress = await UserProgress.findOne({ 
            user: userId, 
            challenge: id 
        });

        if (existingProgress) {
            return res.status(400).json({
                success: false,
                error: 'Already participating in this challenge'
            });
        }

        // Create user progress record
        const userProgress = new UserProgress({
            user: userId,
            challenge: id,
            status: 'active',
            progress: {
                current: 0,
                target: challenge.target.value,
                percentage: 0,
                unit: challenge.target.unit
            },
            timestamps: {
                startedAt: new Date()
            }
        });

        await userProgress.save();

        // Add user to challenge participants
        await challenge.addParticipant(userId);

        res.json({
            success: true,
            data: userProgress,
            message: 'Successfully joined challenge'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Failed to join challenge',
            details: error.message
        });
    }
};

// Leave challenge
exports.leaveChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const userProgress = await UserProgress.findOne({ 
            user: userId, 
            challenge: id 
        });

        if (!userProgress) {
            return res.status(404).json({
                success: false,
                error: 'Not participating in this challenge'
            });
        }

        // Update status to abandoned
        userProgress.status = 'abandoned';
        await userProgress.save();

        // Remove from challenge participants
        const challenge = await HealthChallenge.findById(id);
        if (challenge) {
            await challenge.removeParticipant(userId);
        }

        res.json({
            success: true,
            message: 'Left challenge successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to leave challenge',
            details: error.message
        });
    }
};

// ====================== PROGRESS TRACKING ======================

// Get user's progress in a specific challenge
exports.getUserProgress = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user.id;

        const progress = await UserProgress.findOne({ 
            user: userId, 
            challenge: challengeId 
        })
        .populate('challenge', 'title category target duration')
        .populate('rewards.badgesEarned.badge')
        .populate('rewards.achievementsUnlocked.achievement');

        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Progress not found for this challenge'
            });
        }

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress',
            details: error.message
        });
    }
};

// Update progress for a challenge
exports.updateProgress = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { value, notes, mood, difficulty } = req.body;
        const userId = req.user.id;

        const progress = await UserProgress.findOne({ 
            user: userId, 
            challenge: challengeId 
        });

        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Progress not found for this challenge'
            });
        }

        if (progress.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Challenge is already completed'
            });
        }

        // Add daily entry
        await progress.addDailyEntry(value, notes, mood, difficulty);

        // Check for badge and achievement eligibility
        await checkAndAwardRewards(userId);

        res.json({
            success: true,
            data: progress,
            message: 'Progress updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Failed to update progress',
            details: error.message
        });
    }
};

// Get all user's active challenges
exports.getUserChallenges = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const query = { user: userId };
        if (status) query.status = status;

        const challenges = await UserProgress.find(query)
            .populate('challenge', 'title category difficulty target duration media')
            .populate('rewards.badgesEarned.badge', 'name icon color')
            .sort({ 'timestamps.lastUpdatedAt': -1 });

        res.json({
            success: true,
            data: challenges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user challenges',
            details: error.message
        });
    }
};

// Get leaderboard for a challenge
exports.getChallengeLeaderboard = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { limit = 10 } = req.query;

        const leaderboard = await UserProgress.getLeaderboard(challengeId, parseInt(limit));

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard',
            details: error.message
        });
    }
};

// ====================== BADGES ======================

// Get all badges
exports.getBadges = async (req, res) => {
    try {
        const { category, rarity, earned } = req.query;
        const userId = req.user?.id;

        let query = { isActive: true };
        if (category) query.category = category;
        if (rarity) query.rarity = rarity;

        const badges = await Badge.find(query)
            .sort({ tier: 1, rarity: 1, name: 1 });

        // If user is logged in and wants to see earned badges
        if (userId && earned === 'true') {
            const userProgress = await UserProgress.find({ user: userId })
                .populate('rewards.badgesEarned.badge');
            
            const earnedBadgeIds = userProgress.flatMap(p => 
                p.rewards.badgesEarned.map(b => b.badge._id.toString())
            );

            badges.forEach(badge => {
                badge._doc.isEarned = earnedBadgeIds.includes(badge._id.toString());
            });
        }

        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges',
            details: error.message
        });
    }
};

// Get user's earned badges
exports.getUserBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        const userProgress = await UserProgress.find({ user: userId })
            .populate({
                path: 'rewards.badgesEarned.badge',
                select: 'name description icon color tier rarity rewards'
            });

        const earnedBadges = userProgress.flatMap(progress => 
            progress.rewards.badgesEarned.map(badgeEarned => ({
                badge: badgeEarned.badge,
                earnedAt: badgeEarned.earnedAt,
                challengeTitle: progress.challenge?.title
            }))
        );

        res.json({
            success: true,
            data: earnedBadges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user badges',
            details: error.message
        });
    }
};

// ====================== ACHIEVEMENTS ======================

// Get all achievements
exports.getAchievements = async (req, res) => {
    try {
        const { category, difficulty, rarity } = req.query;
        const userId = req.user?.id;

        let query = { isActive: true, isSecret: false };
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (rarity) query.rarity = rarity;

        const achievements = await Achievement.find(query)
            .populate('rewards.badges', 'name icon color')
            .sort({ difficulty: 1, rarity: 1 });

        // Calculate progress for logged-in users
        if (userId) {
            const userStats = await calculateUserStats(userId);
            const userAchievements = await getUserAchievements(userId);

            achievements.forEach(achievement => {
                achievement._doc.progress = achievement.calculateProgress(userStats);
                achievement._doc.isUnlocked = userAchievements.some(ua => 
                    ua.achievement.toString() === achievement._id.toString()
                );
            });
        }

        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch achievements',
            details: error.message
        });
    }
};

// Get user's unlocked achievements
exports.getUserAchievements = async (req, res) => {
    try {
        const userId = req.user.id;

        const userProgress = await UserProgress.find({ user: userId })
            .populate({
                path: 'rewards.achievementsUnlocked.achievement',
                select: 'title description icon color difficulty rarity rewards'
            });

        const unlockedAchievements = userProgress.flatMap(progress => 
            progress.rewards.achievementsUnlocked.map(achievementUnlocked => ({
                achievement: achievementUnlocked.achievement,
                unlockedAt: achievementUnlocked.unlockedAt,
                challengeTitle: progress.challenge?.title
            }))
        );

        res.json({
            success: true,
            data: unlockedAchievements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user achievements',
            details: error.message
        });
    }
};

// ====================== STATISTICS & ANALYTICS ======================

// Get user's overall gamification stats
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await calculateUserStats(userId);
        
        // Get additional data
        const totalChallenges = await UserProgress.countDocuments({ user: userId });
        const completedChallenges = await UserProgress.countDocuments({ 
            user: userId, 
            status: 'completed' 
        });
        const activeChallenges = await UserProgress.countDocuments({ 
            user: userId, 
            status: 'active' 
        });

        const topPerformers = await UserProgress.getTopPerformers(5);
        const userRank = topPerformers.findIndex(performer => 
            performer._id.toString() === userId
        ) + 1;

        res.json({
            success: true,
            data: {
                ...stats,
                totalChallenges,
                completedChallenges,
                activeChallenges,
                completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0,
                globalRank: userRank || 'Unranked'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user stats',
            details: error.message
        });
    }
};

// Get global leaderboard
exports.getGlobalLeaderboard = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const leaderboard = await UserProgress.getTopPerformers(parseInt(limit));
        
        // Populate user details
        const populatedLeaderboard = await User.populate(leaderboard, {
            path: '_id',
            select: 'name profilePicture email'
        });

        res.json({
            success: true,
            data: populatedLeaderboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch global leaderboard',
            details: error.message
        });
    }
};

// ====================== HELPER FUNCTIONS ======================

// Calculate comprehensive user statistics
async function calculateUserStats(userId) {
    const userProgress = await UserProgress.find({ user: userId });
    
    const stats = {
        challenges_completed: userProgress.filter(p => p.status === 'completed').length,
        total_points: userProgress.reduce((sum, p) => sum + p.rewards.pointsEarned, 0),
        streak_days: Math.max(...userProgress.map(p => p.streak.longest), 0),
        consistency_score: userProgress.length > 0 
            ? userProgress.reduce((sum, p) => sum + p.performance.consistencyScore, 0) / userProgress.length 
            : 0,
        badges_earned: userProgress.reduce((sum, p) => sum + p.rewards.badgesEarned.length, 0),
        social_interactions: 0, // This would need to be tracked separately
        days_active: userProgress.reduce((sum, p) => sum + p.daysActive, 0),
        categories_mastered: [...new Set(userProgress.map(p => p.challenge?.category))].length,
        milestones_reached: userProgress.reduce((sum, p) => 
            sum + p.milestones.filter(m => m.isAchieved).length, 0),
        improvements_made: userProgress.filter(p => p.performance.averageDailyProgress > 0).length,
        goals_achieved: userProgress.filter(p => p.progress.percentage >= 100).length,
        time_spent: userProgress.reduce((sum, p) => sum + p.daysActive, 0)
    };

    return stats;
}

// Get user's achievements
async function getUserAchievements(userId) {
    const userProgress = await UserProgress.find({ user: userId });
    return userProgress.flatMap(p => p.rewards.achievementsUnlocked);
}

// Check and award eligible rewards
async function checkAndAwardRewards(userId) {
    const userStats = await calculateUserStats(userId);
    const userAchievements = await getUserAchievements(userId);

    // Check for eligible badges
    const eligibleBadges = await Badge.findEligibleBadges(userStats);
    
    for (const badge of eligibleBadges) {
        // Check if user already has this badge
        const hasBadge = await UserProgress.findOne({
            user: userId,
            'rewards.badgesEarned.badge': badge._id
        });

        if (!hasBadge) {
            // Award badge to most recent active progress
            const activeProgress = await UserProgress.findOne({
                user: userId,
                status: 'active'
            });

            if (activeProgress) {
                await activeProgress.awardBadge(badge._id);
                await badge.awardToUser(userId);
            }
        }
    }

    // Check for eligible achievements
    const eligibleAchievements = await Achievement.findEligibleAchievements(userStats, userAchievements);
    
    for (const achievement of eligibleAchievements) {
        // Check if user already has this achievement
        const hasAchievement = await UserProgress.findOne({
            user: userId,
            'rewards.achievementsUnlocked.achievement': achievement._id
        });

        if (!hasAchievement) {
            // Award achievement to most recent active progress
            const activeProgress = await UserProgress.findOne({
                user: userId,
                status: 'active'
            });

            if (activeProgress) {
                await activeProgress.unlockAchievement(achievement._id);
                await achievement.unlockForUser(userId);
            }
        }
    }
}