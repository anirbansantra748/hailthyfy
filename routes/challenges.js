const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Create middleware functions that match our routes
const authenticateUser = (req, res, next) => {
    // Set user to null if not authenticated, but continue
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        req.user = null;
    }
    next();
};

const requireAuth = isLoggedIn;

// Apply user authentication middleware to get user info if available
router.use(authenticateUser);

// ====================== WEB ROUTES (EJS Views) ======================

// Challenge dashboard page
router.get('/', async (req, res) => {
    try {
        res.render('challenges/dashboard', {
            title: 'Health Challenges - Healthfy',
            user: req.user,
            path: '/challenges'
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error - Healthfy',
            error: 'Failed to load challenges dashboard',
            user: req.user
        });
    }
});

// Individual challenge page
router.get('/challenge/:id', async (req, res) => {
    try {
        res.render('challenges/challenge', {
            title: 'Challenge Details - Healthfy',
            user: req.user,
            challengeId: req.params.id,
            path: '/challenges'
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error - Healthfy',
            error: 'Failed to load challenge details',
            user: req.user
        });
    }
});

// Create challenge page (requires auth)
router.get('/create', requireAuth, (req, res) => {
    res.render('challenges/create', {
        title: 'Create Challenge - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

// User's challenges page (requires auth)
router.get('/my-challenges', requireAuth, (req, res) => {
    res.render('challenges/my-challenges', {
        title: 'My Challenges - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

// Progress tracking page (requires auth)
router.get('/progress/:challengeId', requireAuth, (req, res) => {
    res.render('challenges/progress', {
        title: 'Challenge Progress - Healthfy',
        user: req.user,
        challengeId: req.params.challengeId,
        path: '/challenges'
    });
});

// Leaderboard page (global)
router.get('/leaderboard', (req, res) => {
    res.render('challenges/leaderboard', {
        title: 'Global Leaderboard - Healthfy',
        user: req.user,
        challengeId: null,
        path: '/challenges'
    });
});

// Leaderboard page (challenge-specific)
router.get('/leaderboard/:challengeId', (req, res) => {
    res.render('challenges/leaderboard', {
        title: 'Challenge Leaderboard - Healthfy',
        user: req.user,
        challengeId: req.params.challengeId,
        path: '/challenges'
    });
});

// Badges page
router.get('/badges', (req, res) => {
    res.render('challenges/badges', {
        title: 'Badges - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

// Achievements page
router.get('/achievements', (req, res) => {
    res.render('challenges/achievements', {
        title: 'Achievements - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

// User profile with gamification stats (requires auth)
router.get('/profile', requireAuth, (req, res) => {
    res.render('challenges/profile', {
        title: 'My Progress - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

// ====================== API ROUTES ======================

// Challenge CRUD operations
router.get('/api/challenges', gamificationController.getChallenges);
router.get('/api/challenges/:id', gamificationController.getChallengeById);
router.post('/api/challenges', requireAuth, gamificationController.createChallenge);
router.put('/api/challenges/:id', requireAuth, gamificationController.updateChallenge);
router.delete('/api/challenges/:id', requireAuth, gamificationController.deleteChallenge);

// Challenge participation
router.post('/api/challenges/:id/join', requireAuth, gamificationController.joinChallenge);
router.post('/api/challenges/:id/leave', requireAuth, gamificationController.leaveChallenge);

// Progress tracking
router.get('/api/progress/:challengeId', requireAuth, gamificationController.getUserProgress);
router.post('/api/progress/:challengeId', requireAuth, gamificationController.updateProgress);
router.get('/api/my-challenges', requireAuth, gamificationController.getUserChallenges);

// Leaderboards
router.get('/api/leaderboard/:challengeId', gamificationController.getChallengeLeaderboard);
router.get('/api/leaderboard', gamificationController.getGlobalLeaderboard);

// Badges
router.get('/api/badges', gamificationController.getBadges);
router.get('/api/my-badges', requireAuth, gamificationController.getUserBadges);

// Achievements
router.get('/api/achievements', gamificationController.getAchievements);
router.get('/api/my-achievements', requireAuth, gamificationController.getUserAchievements);

// User statistics
router.get('/api/stats', requireAuth, gamificationController.getUserStats);

// ====================== ADMIN ROUTES (if needed) ======================

// Admin routes for managing challenges, badges, and achievements
router.get('/admin', requireAuth, (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).render('error', {
            title: 'Access Denied - Healthfy',
            error: 'Admin access required',
            user: req.user
        });
    }

    res.render('challenges/admin', {
        title: 'Challenge Admin - Healthfy',
        user: req.user,
        path: '/challenges'
    });
});

module.exports = router;