const HealthChallenge = require('../models/HealthChallenge');
const UserProgress = require('../models/UserProgress');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

/**
 * Gamification Service
 * Handles points calculation, badge awarding, achievement unlocking, and reward systems
 */

class GamificationService {
    
    // ====================== POINTS SYSTEM ======================

    /**
     * Calculate points for a specific action
     * @param {string} action - The action performed
     * @param {Object} context - Additional context for calculation
     * @returns {number} Points awarded
     */
    static calculatePoints(action, context = {}) {
        const basePoints = {
            'daily_entry': 10,
            'challenge_join': 25,
            'challenge_complete': 100,
            'streak_milestone': 50,
            'consistency_bonus': 30,
            'social_interaction': 15,
            'milestone_reached': 75,
            'badge_earned': 50,
            'achievement_unlocked': 200,
            'helping_others': 20,
            'perfect_week': 150,
            'category_completion': 300
        };

        let points = basePoints[action] || 0;

        // Apply multipliers based on context
        switch (action) {
            case 'challenge_complete':
                // Bonus for difficulty
                if (context.difficulty === 'expert') points *= 2;
                else if (context.difficulty === 'advanced') points *= 1.5;
                else if (context.difficulty === 'intermediate') points *= 1.2;
                
                // Bonus for consistency
                if (context.consistencyScore > 90) points += 100;
                else if (context.consistencyScore > 80) points += 50;
                
                break;
                
            case 'streak_milestone':
                // Progressive streak bonuses
                const streakDays = context.streakDays || 1;
                if (streakDays >= 100) points = 1000;
                else if (streakDays >= 50) points = 500;
                else if (streakDays >= 30) points = 300;
                else if (streakDays >= 14) points = 150;
                else if (streakDays >= 7) points = 75;
                break;
                
            case 'daily_entry':
                // Bonus for consecutive days
                const consecutiveDays = context.consecutiveDays || 1;
                if (consecutiveDays > 30) points = 25;
                else if (consecutiveDays > 14) points = 20;
                else if (consecutiveDays > 7) points = 15;
                break;
        }

        return Math.round(points);
    }

    /**
     * Award points to user's most recent active progress
     * @param {string} userId - User ID
     * @param {number} points - Points to award
     * @param {string} reason - Reason for awarding points
     */
    static async awardPoints(userId, points, reason = 'General activity') {
        try {
            const activeProgress = await UserProgress.findOne({
                user: userId,
                status: 'active'
            }).sort({ 'timestamps.lastUpdatedAt': -1 });

            if (activeProgress) {
                activeProgress.rewards.pointsEarned += points;
                await activeProgress.save();
                
                // Update user's total points (if User model has totalPoints field)
                await User.findByIdAndUpdate(userId, {
                    $inc: { totalPoints: points }
                });
                
                return { success: true, pointsAwarded: points, reason };
            }
            
            return { success: false, error: 'No active challenges found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================== BADGE SYSTEM ======================

    /**
     * Check and award eligible badges to user
     * @param {string} userId - User ID
     * @returns {Array} Array of newly awarded badges
     */
    static async checkAndAwardBadges(userId) {
        try {
            const userStats = await this.calculateUserStats(userId);
            const eligibleBadges = await Badge.findEligibleBadges(userStats);
            const awardedBadges = [];

            for (const badge of eligibleBadges) {
                // Check if user already has this badge
                const hasBadge = await UserProgress.findOne({
                    user: userId,
                    'rewards.badgesEarned.badge': badge._id
                });

                if (!hasBadge) {
                    // Award badge
                    const activeProgress = await UserProgress.findOne({
                        user: userId,
                        status: { $in: ['active', 'completed'] }
                    }).sort({ 'timestamps.lastUpdatedAt': -1 });

                    if (activeProgress) {
                        await activeProgress.awardBadge(badge._id);
                        await badge.awardToUser(userId);
                        
                        // Award points for earning badge
                        const badgePoints = badge.getPointsValue();
                        await this.awardPoints(userId, badgePoints, `Badge earned: ${badge.name}`);
                        
                        awardedBadges.push(badge);
                    }
                }
            }

            return awardedBadges;
        } catch (error) {
            console.error('Error checking badges:', error);
            return [];
        }
    }

    /**
     * Create custom badge for special achievements
     * @param {Object} badgeData - Badge data
     * @returns {Object} Created badge
     */
    static async createCustomBadge(badgeData) {
        try {
            const badge = new Badge({
                ...badgeData,
                isActive: true,
                metadata: {
                    createdBy: badgeData.createdBy,
                    version: '1.0'
                }
            });

            return await badge.save();
        } catch (error) {
            throw new Error(`Failed to create custom badge: ${error.message}`);
        }
    }

    // ====================== ACHIEVEMENT SYSTEM ======================

    /**
     * Check and unlock eligible achievements for user
     * @param {string} userId - User ID
     * @returns {Array} Array of newly unlocked achievements
     */
    static async checkAndUnlockAchievements(userId) {
        try {
            const userStats = await this.calculateUserStats(userId);
            const userAchievements = await this.getUserAchievements(userId);
            const eligibleAchievements = await Achievement.findEligibleAchievements(userStats, userAchievements);
            const unlockedAchievements = [];

            for (const achievement of eligibleAchievements) {
                // Check if user already has this achievement
                const hasAchievement = await UserProgress.findOne({
                    user: userId,
                    'rewards.achievementsUnlocked.achievement': achievement._id
                });

                if (!hasAchievement) {
                    // Unlock achievement
                    const activeProgress = await UserProgress.findOne({
                        user: userId,
                        status: { $in: ['active', 'completed'] }
                    }).sort({ 'timestamps.lastUpdatedAt': -1 });

                    if (activeProgress) {
                        await activeProgress.unlockAchievement(achievement._id);
                        await achievement.unlockForUser(userId);
                        
                        // Award points for achievement
                        const achievementPoints = achievement.totalPointsValue;
                        await this.awardPoints(userId, achievementPoints, `Achievement unlocked: ${achievement.title}`);
                        
                        // Award any associated badges
                        if (achievement.rewards.badges && achievement.rewards.badges.length > 0) {
                            for (const badgeId of achievement.rewards.badges) {
                                await activeProgress.awardBadge(badgeId);
                            }
                        }
                        
                        unlockedAchievements.push(achievement);
                    }
                }
            }

            return unlockedAchievements;
        } catch (error) {
            console.error('Error checking achievements:', error);
            return [];
        }
    }

    // ====================== LEVEL SYSTEM ======================

    /**
     * Calculate user level based on total points
     * @param {number} totalPoints - Total points earned
     * @returns {Object} Level information
     */
    static calculateLevel(totalPoints) {
        const levels = [
            { level: 1, minPoints: 0, maxPoints: 499, title: 'Beginner', color: '#28a745' },
            { level: 2, minPoints: 500, maxPoints: 1499, title: 'Explorer', color: '#17a2b8' },
            { level: 3, minPoints: 1500, maxPoints: 3999, title: 'Enthusiast', color: '#ffc107' },
            { level: 4, minPoints: 4000, maxPoints: 7999, title: 'Dedicated', color: '#fd7e14' },
            { level: 5, minPoints: 8000, maxPoints: 14999, title: 'Champion', color: '#e83e8c' },
            { level: 6, minPoints: 15000, maxPoints: 24999, title: 'Expert', color: '#6f42c1' },
            { level: 7, minPoints: 25000, maxPoints: 49999, title: 'Master', color: '#495057' },
            { level: 8, minPoints: 50000, maxPoints: 99999, title: 'Legend', color: '#dc3545' },
            { level: 9, minPoints: 100000, maxPoints: 199999, title: 'Hero', color: '#343a40' },
            { level: 10, minPoints: 200000, maxPoints: Infinity, title: 'Mythical', color: '#6610f2' }
        ];

        const currentLevel = levels.find(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints) || levels[0];
        const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
        
        const progressToNext = nextLevel 
            ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 
            : 100;

        return {
            current: currentLevel,
            next: nextLevel,
            progress: Math.round(progressToNext),
            pointsToNext: nextLevel ? nextLevel.minPoints - totalPoints : 0
        };
    }

    // ====================== STREAK SYSTEM ======================

    /**
     * Update user's streak information
     * @param {string} userId - User ID
     * @param {string} challengeId - Challenge ID
     */
    static async updateStreak(userId, challengeId) {
        try {
            const progress = await UserProgress.findOne({
                user: userId,
                challenge: challengeId
            });

            if (!progress) return null;

            const oldStreak = progress.streak.current;
            progress.updateStreak();
            await progress.save();

            const newStreak = progress.streak.current;

            // Award streak milestone points
            if (newStreak > oldStreak && [7, 14, 30, 50, 100].includes(newStreak)) {
                const streakPoints = this.calculatePoints('streak_milestone', { streakDays: newStreak });
                await this.awardPoints(userId, streakPoints, `${newStreak}-day streak!`);
            }

            return progress.streak;
        } catch (error) {
            console.error('Error updating streak:', error);
            return null;
        }
    }

    // ====================== SOCIAL FEATURES ======================

    /**
     * Award points for social interactions
     * @param {string} userId - User ID
     * @param {string} interactionType - Type of interaction
     * @param {Object} context - Additional context
     */
    static async awardSocialPoints(userId, interactionType, context = {}) {
        const socialActions = {
            'comment': 5,
            'like': 2,
            'share': 10,
            'encourage': 15,
            'help': 20,
            'mentor': 30
        };

        const points = socialActions[interactionType] || 0;
        if (points > 0) {
            await this.awardPoints(userId, points, `Social interaction: ${interactionType}`);
        }
    }

    // ====================== ANALYTICS & INSIGHTS ======================

    /**
     * Calculate comprehensive user statistics
     * @param {string} userId - User ID
     * @returns {Object} User statistics
     */
    static async calculateUserStats(userId) {
        try {
            const userProgress = await UserProgress.find({ user: userId })
                .populate('challenge', 'category difficulty');
            
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const stats = {
                // Basic counts
                challenges_completed: userProgress.filter(p => p.status === 'completed').length,
                challenges_active: userProgress.filter(p => p.status === 'active').length,
                total_challenges: userProgress.length,
                
                // Points and rewards
                total_points: userProgress.reduce((sum, p) => sum + p.rewards.pointsEarned, 0),
                badges_earned: userProgress.reduce((sum, p) => sum + p.rewards.badgesEarned.length, 0),
                achievements_unlocked: userProgress.reduce((sum, p) => sum + p.rewards.achievementsUnlocked.length, 0),
                
                // Performance metrics
                streak_days: Math.max(...userProgress.map(p => p.streak.longest), 0),
                current_streak: Math.max(...userProgress.map(p => p.streak.current), 0),
                consistency_score: userProgress.length > 0 
                    ? userProgress.reduce((sum, p) => sum + p.performance.consistencyScore, 0) / userProgress.length 
                    : 0,
                average_motivation: userProgress.length > 0
                    ? userProgress.reduce((sum, p) => sum + p.performance.motivationLevel, 0) / userProgress.length
                    : 5,
                
                // Activity metrics
                days_active: userProgress.reduce((sum, p) => sum + p.daysActive, 0),
                recent_activity: userProgress.filter(p => 
                    p.timestamps.lastUpdatedAt >= thirtyDaysAgo
                ).length,
                
                // Category analysis
                categories_participated: [...new Set(userProgress.map(p => p.challenge?.category))].filter(Boolean).length,
                favorite_category: this.getFavoriteCategory(userProgress),
                
                // Difficulty analysis
                difficulty_distribution: this.getDifficultyDistribution(userProgress),
                
                // Time-based metrics
                total_time_invested: userProgress.reduce((sum, p) => sum + p.daysActive, 0),
                average_completion_time: this.getAverageCompletionTime(userProgress),
                
                // Social metrics (placeholder - would need separate tracking)
                social_interactions: 0,
                helps_given: 0,
                encouragements_received: 0
            };

            return stats;
        } catch (error) {
            console.error('Error calculating user stats:', error);
            return {};
        }
    }

    /**
     * Get user's favorite category based on participation and completion
     * @param {Array} userProgress - User progress array
     * @returns {string} Favorite category
     */
    static getFavoriteCategory(userProgress) {
        const categoryStats = {};
        
        userProgress.forEach(p => {
            if (p.challenge?.category) {
                const category = p.challenge.category;
                if (!categoryStats[category]) {
                    categoryStats[category] = { count: 0, completed: 0, totalProgress: 0 };
                }
                categoryStats[category].count++;
                categoryStats[category].totalProgress += p.progress.percentage;
                if (p.status === 'completed') {
                    categoryStats[category].completed++;
                }
            }
        });

        let favorite = null;
        let maxScore = 0;

        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            const avgProgress = stats.totalProgress / stats.count;
            const completionRate = stats.completed / stats.count;
            const score = (stats.count * 0.3) + (avgProgress * 0.4) + (completionRate * 0.3);
            
            if (score > maxScore) {
                maxScore = score;
                favorite = category;
            }
        });

        return favorite;
    }

    /**
     * Get difficulty distribution of user's challenges
     * @param {Array} userProgress - User progress array
     * @returns {Object} Difficulty distribution
     */
    static getDifficultyDistribution(userProgress) {
        const distribution = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
        
        userProgress.forEach(p => {
            if (p.challenge?.difficulty) {
                distribution[p.challenge.difficulty] = (distribution[p.challenge.difficulty] || 0) + 1;
            }
        });

        return distribution;
    }

    /**
     * Calculate average completion time for challenges
     * @param {Array} userProgress - User progress array
     * @returns {number} Average completion time in days
     */
    static getAverageCompletionTime(userProgress) {
        const completed = userProgress.filter(p => 
            p.status === 'completed' && p.timestamps.startedAt && p.timestamps.completedAt
        );

        if (completed.length === 0) return 0;

        const totalDays = completed.reduce((sum, p) => {
            const days = Math.ceil((p.timestamps.completedAt - p.timestamps.startedAt) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);

        return Math.round(totalDays / completed.length);
    }

    /**
     * Get user's achievements
     * @param {string} userId - User ID
     * @returns {Array} User achievements
     */
    static async getUserAchievements(userId) {
        try {
            const userProgress = await UserProgress.find({ user: userId });
            return userProgress.flatMap(p => p.rewards.achievementsUnlocked);
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    // ====================== RECOMMENDATION SYSTEM ======================

    /**
     * Get personalized challenge recommendations
     * @param {string} userId - User ID
     * @returns {Array} Recommended challenges
     */
    static async getRecommendations(userId) {
        try {
            const userStats = await this.calculateUserStats(userId);
            const userProgress = await UserProgress.find({ user: userId });
            
            // Get categories user has participated in
            const participatedCategories = [...new Set(userProgress.map(p => p.challenge?.category))].filter(Boolean);
            
            // Get user's average difficulty level
            const avgDifficulty = this.getAverageUserDifficulty(userProgress);
            
            // Build recommendation query
            const recommendations = await HealthChallenge.find({
                isActive: true,
                isPublic: true,
                'duration.start': { $lte: new Date() },
                'duration.end': { $gte: new Date() },
                // Exclude challenges user is already in
                _id: { $nin: userProgress.map(p => p.challenge) }
            })
            .populate('createdBy', 'name')
            .sort({ 'statistics.popularityScore': -1 })
            .limit(10);

            // Score and sort recommendations
            return recommendations.map(challenge => ({
                challenge,
                score: this.calculateRecommendationScore(challenge, userStats, participatedCategories, avgDifficulty)
            }))
            .sort((a, b) => b.score - a.score)
            .map(r => r.challenge);
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    /**
     * Calculate recommendation score for a challenge
     * @param {Object} challenge - Challenge object
     * @param {Object} userStats - User statistics
     * @param {Array} participatedCategories - Categories user participated in
     * @param {string} avgDifficulty - User's average difficulty preference
     * @returns {number} Recommendation score
     */
    static calculateRecommendationScore(challenge, userStats, participatedCategories, avgDifficulty) {
        let score = 0;
        
        // Category familiarity bonus
        if (participatedCategories.includes(challenge.category)) {
            score += 20;
        }
        
        // Difficulty matching
        const difficultyScores = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        const userDiffScore = difficultyScores[avgDifficulty] || 1;
        const challengeDiffScore = difficultyScores[challenge.difficulty] || 1;
        
        if (Math.abs(userDiffScore - challengeDiffScore) <= 1) {
            score += 15;
        }
        
        // Popularity bonus
        score += Math.min(challenge.statistics.popularityScore / 10, 25);
        
        // Completion rate bonus
        if (challenge.completionRate > 70) {
            score += 10;
        }
        
        // New category exploration bonus
        if (!participatedCategories.includes(challenge.category)) {
            score += 5;
        }
        
        return score;
    }

    /**
     * Get user's average difficulty preference
     * @param {Array} userProgress - User progress array
     * @returns {string} Average difficulty
     */
    static getAverageUserDifficulty(userProgress) {
        const difficultyScores = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        
        let totalScore = 0;
        let count = 0;
        
        userProgress.forEach(p => {
            if (p.challenge?.difficulty) {
                totalScore += difficultyScores[p.challenge.difficulty] || 1;
                count++;
            }
        });
        
        if (count === 0) return 'beginner';
        
        const avgScore = totalScore / count;
        const difficulties = Object.keys(difficultyScores);
        
        return difficulties.reduce((prev, curr) => 
            Math.abs(difficultyScores[curr] - avgScore) < Math.abs(difficultyScores[prev] - avgScore) ? curr : prev
        );
    }

    // ====================== NOTIFICATION SYSTEM ======================

    /**
     * Generate achievement/badge notification data
     * @param {string} type - 'badge' or 'achievement'
     * @param {Object} item - Badge or Achievement object
     * @returns {Object} Notification data
     */
    static generateRewardNotification(type, item) {
        return {
            type: `${type}_earned`,
            title: type === 'badge' ? `New Badge: ${item.name}` : `Achievement Unlocked: ${item.title}`,
            message: item.description,
            icon: item.icon,
            color: item.color,
            points: type === 'badge' ? item.getPointsValue() : item.totalPointsValue,
            timestamp: new Date(),
            category: item.category,
            rarity: item.rarity
        };
    }
}

module.exports = GamificationService;