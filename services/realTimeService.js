/**
 * Real-time Service for Health Challenges
 * Handles Socket.IO events for live updates, notifications, and leaderboard changes
 */

class RealTimeService {
    constructor(io) {
        this.io = io;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.id}`);

            // Join user-specific room for personalized notifications
            socket.on('join user room', (userId) => {
                socket.join(`user_${userId}`);
                console.log(`👤 User ${userId} joined personal room`);
            });

            // Join challenge-specific room for challenge updates
            socket.on('join challenge room', (challengeId) => {
                socket.join(`challenge_${challengeId}`);
                console.log(`🏆 User joined challenge ${challengeId} room`);
            });

            // Join global leaderboard room
            socket.on('join leaderboard', () => {
                socket.join('global_leaderboard');
                console.log(`🏅 User joined global leaderboard room`);
            });

            // Handle progress updates
            socket.on('progress update', (data) => {
                this.handleProgressUpdate(socket, data);
            });

            // Handle challenge completion
            socket.on('challenge completed', (data) => {
                this.handleChallengeCompletion(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.id}`);
            });
        });
    }

    // ====================== USER NOTIFICATIONS ======================

    /**
     * Send notification to specific user
     * @param {string} userId - User ID
     * @param {Object} notification - Notification data
     */
    notifyUser(userId, notification) {
        this.io.to(`user_${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date(),
            id: this.generateNotificationId()
        });

        console.log(`📬 Notification sent to user ${userId}:`, notification.title);
    }

    /**
     * Send badge earned notification
     * @param {string} userId - User ID
     * @param {Object} badge - Badge object
     */
    notifyBadgeEarned(userId, badge) {
        const notification = {
            type: 'badge_earned',
            title: 'New Badge Earned! 🏅',
            message: `Congratulations! You've earned the "${badge.name}" badge!`,
            icon: badge.icon,
            color: badge.color || '#ffc107',
            badge: {
                id: badge._id,
                name: badge.name,
                description: badge.description,
                tier: badge.tier,
                rarity: badge.rarity
            },
            action: {
                text: 'View Badge',
                url: `/challenges/badges?highlight=${badge._id}`
            }
        };

        this.notifyUser(userId, notification);
        
        // Also broadcast to global feed for popular badges
        if (['rare', 'epic', 'legendary'].includes(badge.rarity)) {
            this.broadcastGlobalAchievement(userId, 'badge', badge);
        }
    }

    /**
     * Send achievement unlocked notification
     * @param {string} userId - User ID
     * @param {Object} achievement - Achievement object
     */
    notifyAchievementUnlocked(userId, achievement) {
        const notification = {
            type: 'achievement_unlocked',
            title: 'Achievement Unlocked! 🏆',
            message: `Amazing! You've unlocked the "${achievement.title}" achievement!`,
            icon: achievement.icon,
            color: achievement.color || '#28a745',
            achievement: {
                id: achievement._id,
                title: achievement.title,
                description: achievement.description,
                difficulty: achievement.difficulty,
                rarity: achievement.rarity,
                points: achievement.totalPointsValue
            },
            action: {
                text: 'View Achievement',
                url: `/challenges/achievements?highlight=${achievement._id}`
            }
        };

        this.notifyUser(userId, notification);
        
        // Broadcast rare achievements globally
        if (['rare', 'epic', 'legendary', 'mythical'].includes(achievement.rarity)) {
            this.broadcastGlobalAchievement(userId, 'achievement', achievement);
        }
    }

    /**
     * Send streak milestone notification
     * @param {string} userId - User ID
     * @param {number} streakDays - Streak days achieved
     * @param {number} points - Points earned
     */
    notifyStreakMilestone(userId, streakDays, points) {
        const notification = {
            type: 'streak_milestone',
            title: 'Streak Milestone! 🔥',
            message: `Incredible! You've maintained a ${streakDays}-day streak!`,
            icon: '🔥',
            color: '#dc3545',
            data: {
                streakDays,
                pointsEarned: points
            },
            action: {
                text: 'View Progress',
                url: '/challenges/profile'
            }
        };

        this.notifyUser(userId, notification);
        
        // Broadcast major streaks
        if (streakDays >= 30) {
            this.io.to('global_leaderboard').emit('streak_celebration', {
                userId,
                streakDays,
                timestamp: new Date()
            });
        }
    }

    // ====================== CHALLENGE UPDATES ======================

    /**
     * Broadcast challenge progress update
     * @param {string} challengeId - Challenge ID
     * @param {Object} progressData - Progress data
     */
    broadcastChallengeProgress(challengeId, progressData) {
        this.io.to(`challenge_${challengeId}`).emit('challenge progress update', {
            challengeId,
            ...progressData,
            timestamp: new Date()
        });

        console.log(`🏆 Challenge ${challengeId} progress broadcasted`);
    }

    /**
     * Broadcast new participant joined challenge
     * @param {string} challengeId - Challenge ID
     * @param {Object} userData - User data
     */
    broadcastNewParticipant(challengeId, userData) {
        this.io.to(`challenge_${challengeId}`).emit('new participant', {
            challengeId,
            user: userData,
            timestamp: new Date()
        });

        console.log(`👥 New participant broadcasted for challenge ${challengeId}`);
    }

    /**
     * Broadcast challenge completion
     * @param {string} challengeId - Challenge ID
     * @param {Object} userData - User data
     */
    broadcastChallengeCompletion(challengeId, userData) {
        this.io.to(`challenge_${challengeId}`).emit('challenge completion', {
            challengeId,
            user: userData,
            timestamp: new Date()
        });

        // Also notify global leaderboard
        this.io.to('global_leaderboard').emit('challenge completed', {
            challengeId,
            user: userData,
            timestamp: new Date()
        });

        console.log(`🎉 Challenge completion broadcasted for ${challengeId}`);
    }

    // ====================== LEADERBOARD UPDATES ======================

    /**
     * Update global leaderboard in real-time
     * @param {Array} leaderboardData - Updated leaderboard data
     */
    updateGlobalLeaderboard(leaderboardData) {
        this.io.to('global_leaderboard').emit('leaderboard update', {
            leaderboard: leaderboardData,
            timestamp: new Date()
        });

        console.log('🏅 Global leaderboard updated');
    }

    /**
     * Update challenge-specific leaderboard
     * @param {string} challengeId - Challenge ID
     * @param {Array} leaderboardData - Updated leaderboard data
     */
    updateChallengeLeaderboard(challengeId, leaderboardData) {
        this.io.to(`challenge_${challengeId}`).emit('challenge leaderboard update', {
            challengeId,
            leaderboard: leaderboardData,
            timestamp: new Date()
        });

        console.log(`🏆 Challenge ${challengeId} leaderboard updated`);
    }

    // ====================== GLOBAL BROADCASTS ======================

    /**
     * Broadcast global achievement for community engagement
     * @param {string} userId - User ID
     * @param {string} type - 'badge' or 'achievement'
     * @param {Object} item - Badge or Achievement object
     */
    broadcastGlobalAchievement(userId, type, item) {
        // Don't broadcast if we don't have user info
        if (!userId) return;

        this.io.emit('global achievement', {
            type,
            userId,
            item: {
                id: item._id,
                name: item.name || item.title,
                description: item.description,
                icon: item.icon,
                rarity: item.rarity,
                color: item.color
            },
            timestamp: new Date()
        });

        console.log(`🌟 Global ${type} achievement broadcasted`);
    }

    /**
     * Send system-wide announcement
     * @param {Object} announcement - Announcement data
     */
    sendSystemAnnouncement(announcement) {
        this.io.emit('system announcement', {
            ...announcement,
            timestamp: new Date(),
            id: this.generateNotificationId()
        });

        console.log('📢 System announcement sent:', announcement.title);
    }

    // ====================== EVENT HANDLERS ======================

    /**
     * Handle progress update from client
     * @param {Object} socket - Socket instance
     * @param {Object} data - Progress data
     */
    handleProgressUpdate(socket, data) {
        const { userId, challengeId, progress, isNewRecord } = data;

        // Broadcast to challenge participants
        if (challengeId) {
            this.broadcastChallengeProgress(challengeId, {
                userId,
                progress,
                isNewRecord
            });
        }

        // Send feedback to user
        socket.emit('progress update confirmed', {
            success: true,
            message: 'Progress updated successfully!',
            timestamp: new Date()
        });
    }

    /**
     * Handle challenge completion from client
     * @param {Object} socket - Socket instance
     * @param {Object} data - Completion data
     */
    handleChallengeCompletion(socket, data) {
        const { userId, challengeId, completionTime, finalProgress } = data;

        // Broadcast completion to challenge and global rooms
        this.broadcastChallengeCompletion(challengeId, {
            userId,
            completionTime,
            finalProgress
        });

        // Send congratulations to user
        socket.emit('completion celebration', {
            message: '🎉 Congratulations on completing the challenge!',
            confetti: true,
            timestamp: new Date()
        });
    }

    // ====================== UTILITY METHODS ======================

    /**
     * Generate unique notification ID
     * @returns {string} Unique ID
     */
    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get room participant count
     * @param {string} room - Room name
     * @returns {number} Number of participants
     */
    getRoomSize(room) {
        const roomObj = this.io.sockets.adapter.rooms.get(room);
        return roomObj ? roomObj.size : 0;
    }

    /**
     * Send real-time analytics update
     * @param {Object} analytics - Analytics data
     */
    sendAnalyticsUpdate(analytics) {
        this.io.emit('analytics update', {
            ...analytics,
            timestamp: new Date()
        });
    }
}

module.exports = RealTimeService;