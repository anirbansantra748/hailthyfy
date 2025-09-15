const express = require('express');
const router = express.Router();
const healthAnalyticsController = require('../controllers/healthAnalyticsController');
const { isLoggedIn } = require('../middleware/isLoggedIn');

/**
 * Health Analytics Routes
 * Drug interaction checking and health risk predictions
 */

// Drug Interaction Checker Routes
router.get('/drug-interaction-checker', healthAnalyticsController.renderDrugInteractionPage);
router.post('/drug-interaction-checker/check', healthAnalyticsController.checkDrugInteractions);
router.get('/drug-interaction-checker/suggestions', healthAnalyticsController.getDrugSuggestions);

// AI Health Predictions Routes (requires login)
router.get('/health-predictions', isLoggedIn, healthAnalyticsController.renderHealthPredictionsDashboard);
router.post('/health-predictions/generate', isLoggedIn, healthAnalyticsController.generateHealthPredictions);
router.get('/health-predictions/detailed/:predictionId', isLoggedIn, healthAnalyticsController.getDetailedPrediction);
router.post('/health-predictions', isLoggedIn, healthAnalyticsController.getHealthPredictions);

// User Medication Management (requires login)
router.post('/users/medications/update', isLoggedIn, healthAnalyticsController.updateUserMedications);
router.get('/users/interaction-history', isLoggedIn, healthAnalyticsController.getInteractionHistory);

// Comprehensive Analytics Dashboard Routes (Admin/Doctor access)
router.get('/analytics', isLoggedIn, healthAnalyticsController.renderAnalyticsIndex);
router.get('/analytics/dashboard', isLoggedIn, healthAnalyticsController.renderAnalyticsDashboard);
router.get('/analytics/overview', isLoggedIn, healthAnalyticsController.renderAnalyticsOverview);
router.get('/analytics/patient-journey', isLoggedIn, healthAnalyticsController.renderPatientJourneyPage);

// Analytics API Routes (Admin/Doctor access)
router.get('/api/analytics/overview', isLoggedIn, healthAnalyticsController.getAnalyticsOverview);
router.get('/api/analytics/patient-journey', isLoggedIn, healthAnalyticsController.getPatientJourneyAnalytics);
router.get('/api/analytics/medical-trends', isLoggedIn, healthAnalyticsController.getMedicalTrendsAnalytics);
router.get('/api/analytics/doctor-performance', isLoggedIn, healthAnalyticsController.getDoctorPerformanceAnalytics);

module.exports = router;
