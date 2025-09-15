const healthAnalyticsService = require('../services/healthAnalyticsService');
const aiHealthPredictionService = require('../services/aiHealthPredictionService');
const User = require('../models/User');

/**
 * Health Analytics Controller
 * Handles drug interaction checking and health risk predictions
 */

class HealthAnalyticsController {
    
    /**
     * Render the drug interaction checker page
     * GET /drug-interaction-checker
     */
    async renderDrugInteractionPage(req, res) {
        try {
            const user = req.user;
            let userMedications = [];
            let recentInteractionCheck = null;

            if (user && user.currentMedications && user.currentMedications.length > 0) {
                userMedications = user.currentMedications;
            }

            res.render('health-analytics/drug-interaction', {
                title: 'Drug Interaction Checker | Healthfy',
                user: user,
                userMedications,
                recentInteractionCheck,
                popularDrugs: [
                    { name: 'Paracetamol', category: 'Pain Relief', icon: '💊' },
                    { name: 'Aspirin', category: 'Pain Relief', icon: '💊' },
                    { name: 'Metformin', category: 'Diabetes', icon: '💉' },
                    { name: 'Lisinopril', category: 'Blood Pressure', icon: '❤️' },
                    { name: 'Atorvastatin', category: 'Cholesterol', icon: '🩸' },
                    { name: 'Omeprazole', category: 'Acid Reflux', icon: '🔥' }
                ]
            });

        } catch (error) {
            console.error('❌ [DRUG INTERACTION] Error rendering page:', error);
            res.status(500).render('error/500', {
                title: 'Error | Healthfy',
                message: 'Failed to load drug interaction checker',
                error: error
            });
        }
    }

    /**
     * Check drug interactions
     * POST /drug-interaction-checker/check
     */
    async checkDrugInteractions(req, res) {
        try {
            const { medications } = req.body;
            const user = req.user;

            // Validate input
            if (!medications || !Array.isArray(medications) || medications.length < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide at least one medication'
                });
            }

            // Filter out empty medication names
            const validMedications = medications.filter(med => med && med.trim().length > 0);
            
            if (validMedications.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide valid medication names'
                });
            }

            // Get user profile for personalized checking
            let userProfile = {
                allergies: [],
                medicalHistory: [],
                currentMedications: [],
                age: null,
                gender: null
            };

            if (user) {
                userProfile = {
                    allergies: user.allergies || [],
                    medicalHistory: user.medicalHistory || [],
                    currentMedications: user.currentMedications || [],
                    age: user.age,
                    gender: user.gender,
                    bloodPressure: user.bloodPressure,
                    bloodSugar: user.bloodSugar,
                    lifestyle: user.lifestyle
                };
            }

            // Check interactions using the health analytics service
            const interactionResults = await healthAnalyticsService.checkDrugInteractions(
                validMedications, 
                userProfile
            );

            // Add timestamp and user info
            interactionResults.timestamp = new Date().toISOString();
            interactionResults.checkedMedications = validMedications;
            interactionResults.userPersonalized = !!user;

            // Save interaction check to user's history if logged in
            if (user) {
                await saveInteractionCheck(user._id, interactionResults);
            }

            res.json({
                success: true,
                data: interactionResults,
                message: `Interaction check completed for ${validMedications.length} medication(s)`
            });

        } catch (error) {
            console.error('❌ [DRUG INTERACTION] Check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check drug interactions',
                error: error.message
            });
        }
    }

    /**
     * Render Health Predictions Dashboard
     * GET /health-predictions
     */
    async renderHealthPredictionsDashboard(req, res) {
        try {
            const user = req.user;

            if (!user) {
                req.flash('error', 'Please log in to view health predictions.');
                return res.redirect('/users/login');
            }

            // Get latest prediction if available
            const latestPrediction = user.aiPredictions && user.aiPredictions.length > 0 
                ? user.aiPredictions[user.aiPredictions.length - 1] 
                : null;

            // Check data completeness
            const dataCompleteness = assessDataCompleteness(user);

            res.render('health-analytics/predictions-dashboard', {
                title: 'AI Health Predictions | Healthfy',
                user: user,
                latestPrediction,
                dataCompleteness,
                riskScores: user.riskScores || {},
                canGeneratePrediction: dataCompleteness.score >= 60
            });

        } catch (error) {
            console.error('❌ [PREDICTIONS DASHBOARD] Error:', error);
            req.flash('error', 'Failed to load predictions dashboard.');
            res.redirect('/users/profile');
        }
    }

    /**
     * Render Analytics Index Page
     * GET /analytics
     */
    async renderAnalyticsIndex(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                req.flash('error', 'Please log in to access analytics.');
                return res.redirect('/users/login');
            }

            res.render('analytics/index', {
                title: 'Healthcare Analytics Suite | Healthfy',
                user: user
            });

        } catch (error) {
            console.error('❌ [ANALYTICS INDEX] Error rendering:', error);
            req.flash('error', 'Failed to load analytics index.');
            res.redirect('/dashboard');
        }
    }

    /**
     * Render Comprehensive Analytics Dashboard
     * GET /analytics/dashboard
     */
    async renderAnalyticsDashboard(req, res) {
        try {
            const user = req.user;
            
            // Check if user has access (logged in users now have access)
            if (!user) {
                req.flash('error', 'Please log in to access analytics dashboard.');
                return res.redirect('/users/login');
            }

            // Determine access level
            const hasFullAccess = ['admin', 'doctor'].includes(user.role);
            const accessLevel = hasFullAccess ? 'full' : 'basic';

            res.render('analytics/dashboard', {
                title: 'Healthcare Analytics Dashboard | Healthfy',
                user: user,
                accessLevel: accessLevel,
                hasFullAccess: hasFullAccess
            });

        } catch (error) {
            console.error('❌ [ANALYTICS DASHBOARD] Error rendering:', error);
            req.flash('error', 'Failed to load analytics dashboard.');
            res.redirect('/dashboard');
        }
    }

    /**
     * Render Analytics Overview Page
     * GET /analytics/overview
     */
    async renderAnalyticsOverview(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                req.flash('error', 'Please log in to access analytics overview.');
                return res.redirect('/users/login');
            }

            res.render('analytics/overview', {
                title: 'Healthcare Analytics Overview | Healthfy',
                user: user
            });

        } catch (error) {
            console.error('❌ [ANALYTICS OVERVIEW] Error rendering:', error);
            req.flash('error', 'Failed to load analytics overview.');
            res.redirect('/analytics/dashboard');
        }
    }

    /**
     * Render Patient Journey Analytics Page
     * GET /analytics/patient-journey
     */
    async renderPatientJourneyPage(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                req.flash('error', 'Please log in to access patient journey analytics.');
                return res.redirect('/users/login');
            }

            res.render('analytics/patient-journey', {
                title: 'Patient Journey Analytics | Healthfy',
                user: user
            });

        } catch (error) {
            console.error('❌ [PATIENT JOURNEY] Error rendering:', error);
            req.flash('error', 'Failed to load patient journey analytics.');
            res.redirect('/analytics/dashboard');
        }
    }

    /**
     * Get Analytics Overview Data
     * GET /api/analytics/overview
     */
    async getAnalyticsOverview(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Get date range from query parameters
            const { startDate, endDate } = req.query;
            const dateFilter = this.buildDateFilter(startDate, endDate);

            // Fetch real data from database
            const [totalPatients, totalDoctors, totalAppointments, activeConsultations, recentAppointments] = await Promise.all([
                User.countDocuments({ role: 'user' }),
                User.countDocuments({ role: 'doctor' }),
                this.getAppointmentCount(dateFilter),
                this.getActiveConsultations(),
                this.getRecentAppointments(dateFilter)
            ]);

            // Calculate changes (simulated for now - would need historical data)
            const changes = {
                patients: this.calculateChange(totalPatients, 'patients'),
                consultations: this.calculateChange(activeConsultations, 'consultations'),
                satisfaction: 2.1, // Would come from feedback data
                alerts: -15.2 // Would come from alerts system
            };

            // Generate patient flow data
            const patientFlow = await this.generatePatientFlowData(dateFilter);

            // Get health conditions distribution
            const conditions = await this.getHealthConditionsData();

            // Get response time metrics
            const responseTime = await this.getResponseTimeMetrics();

            // Get medication adherence data
            const medicationAdherence = await this.getMedicationAdherenceData();

            const overviewData = {
                totalPatients,
                activeConsultations,
                avgSatisfaction: 4.6, // Would come from ratings
                criticalAlerts: 7, // Would come from alerts system
                changes,
                patientFlow,
                conditions,
                responseTime,
                medicationAdherence
            };

            res.json({
                success: true,
                data: overviewData
            });

        } catch (error) {
            console.error('❌ [ANALYTICS OVERVIEW] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch analytics overview',
                error: error.message
            });
        }
    }

    /**
     * Get Patient Journey Analytics Data
     * GET /api/analytics/patient-journey
     */
    async getPatientJourneyAnalytics(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { startDate, endDate } = req.query;
            const dateFilter = this.buildDateFilter(startDate, endDate);

            // Fetch patient journey data from appointments and consultations
            const journeyStages = await this.getPatientJourneyStages(dateFilter);
            const journeyConnections = await this.getPatientJourneyConnections(dateFilter);
            const journeyMetrics = await this.getJourneyMetrics(dateFilter);
            const commonPaths = await this.getCommonPatientPaths(dateFilter);

            const journeyData = {
                journeyStages,
                journeyConnections,
                journeyMetrics,
                commonPaths
            };

            res.json({
                success: true,
                data: journeyData
            });

        } catch (error) {
            console.error('❌ [PATIENT JOURNEY ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patient journey analytics',
                error: error.message
            });
        }
    }

    /**
     * Get Medical Trends Analytics Data
     * GET /api/analytics/medical-trends
     */
    async getMedicalTrendsAnalytics(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { startDate, endDate } = req.query;
            const dateFilter = this.buildDateFilter(startDate, endDate);

            // Fetch medical trends data
            const [consultationTrends, conditionTrends, treatmentEffectiveness, medicationTrends] = await Promise.all([
                this.getConsultationTrends(dateFilter),
                this.getConditionTrends(dateFilter),
                this.getTreatmentEffectiveness(dateFilter),
                this.getMedicationTrends(dateFilter)
            ]);

            const trendsData = {
                consultationTrends,
                conditionTrends,
                treatmentEffectiveness,
                medicationTrends
            };

            res.json({
                success: true,
                data: trendsData
            });

        } catch (error) {
            console.error('❌ [MEDICAL TRENDS ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medical trends analytics',
                error: error.message
            });
        }
    }

    /**
     * Get Doctor Performance Analytics Data
     * GET /api/analytics/doctor-performance
     */
    async getDoctorPerformanceAnalytics(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { startDate, endDate } = req.query;
            const dateFilter = this.buildDateFilter(startDate, endDate);

            // Fetch doctor performance data
            const [doctors, performanceMetrics, avgSatisfaction, treatmentSuccessRate, consultationsThisMonth] = await Promise.all([
                this.getDoctorsData(dateFilter),
                this.getDoctorPerformanceMetrics(dateFilter),
                this.getAverageSatisfaction(dateFilter),
                this.getTreatmentSuccessRate(dateFilter),
                this.getConsultationsThisMonth(dateFilter)
            ]);

            const performanceData = {
                totalDoctors: doctors.length,
                avgSatisfaction,
                avgResponseTime: '18 min', // Would calculate from actual data
                treatmentSuccessRate,
                consultationsThisMonth,
                doctors,
                performanceMetrics,
                distributionData: this.calculatePerformanceDistribution(performanceMetrics)
            };

            res.json({
                success: true,
                data: performanceData
            });

        } catch (error) {
            console.error('❌ [DOCTOR PERFORMANCE ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch doctor performance analytics',
                error: error.message
            });
        }
    }

    /**
     * Generate comprehensive AI health predictions
     * POST /health-predictions/generate
     */
    async generateHealthPredictions(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required for health predictions'
                });
            }

            // Check if user has sufficient health data
            const dataCompleteness = assessDataCompleteness(user);
            
            if (dataCompleteness.score < 40) {
                return res.json({
                    success: false,
                    requiresMoreData: true,
                    missingData: dataCompleteness.missing,
                    message: 'Please complete your health profile for accurate predictions. At least 40% profile completion required.',
                    currentCompleteness: dataCompleteness.score
                });
            }

            // Generate comprehensive AI predictions
            const analysis = await aiHealthPredictionService.analyzeHealthRisks(user);

            // Save predictions to user profile
            await aiHealthPredictionService.savePredictionToProfile(user._id, analysis);

            // Update health assessment count
            await User.findByIdAndUpdate(user._id, {
                $inc: { healthAssessmentCount: 1 }
            });

            res.json({
                success: true,
                data: analysis,
                message: 'Health risk analysis completed successfully',
                timestamp: analysis.timestamp
            });

        } catch (error) {
            console.error('❌ [GENERATE PREDICTIONS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate health predictions',
                error: error.message
            });
        }
    }

    /**
     * Get detailed prediction analysis
     * GET /health-predictions/detailed/:predictionId
     */
    async getDetailedPrediction(req, res) {
        try {
            const user = req.user;
            const { predictionId } = req.params;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required'
                });
            }

            // Find the specific prediction
            const prediction = user.aiPredictions.find(p => p._id.toString() === predictionId);
            
            if (!prediction) {
                return res.status(404).json({
                    success: false,
                    message: 'Prediction not found'
                });
            }

            // Get additional analysis if needed
            const detailedAnalysis = {
                prediction: prediction,
                user: {
                    name: user.name,
                    age: user.age,
                    gender: user.gender,
                    bmi: user.bmi
                },
                historicalTrends: getHistoricalTrends(user),
                comparisonWithPrevious: comparePredictions(user.aiPredictions, predictionId)
            };

            res.json({
                success: true,
                data: detailedAnalysis
            });

        } catch (error) {
            console.error('❌ [DETAILED PREDICTION] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get detailed prediction',
                error: error.message
            });
        }
    }

    /**
     * Legacy health predictions method (for backward compatibility)
     * POST /health-predictions
     */
    async getHealthPredictions(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required for health predictions'
                });
            }

            // Check if user has sufficient health data
            const hasHealthData = hasMinimumHealthData(user);
            
            if (!hasHealthData.sufficient) {
                return res.json({
                    success: true,
                    requiresMoreData: true,
                    missingData: hasHealthData.missing,
                    message: 'Please complete your health profile for accurate predictions',
                profileCompleteness: calculateProfileCompleteness(user)
                });
            }

            // Get health predictions
            const predictions = await healthAnalyticsService.predictHealthRisks(user);

            // Update user's risk scores in database
            await updateUserRiskScores(user._id, predictions);

            res.json({
                success: true,
                data: predictions,
                profileCompleteness: calculateProfileCompleteness(user),
                lastUpdated: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ [HEALTH PREDICTIONS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate health predictions',
                error: error.message
            });
        }
    }

    /**
     * Get drug suggestions/autocomplete
     * GET /drug-interaction-checker/suggestions?q=query
     */
    async getDrugSuggestions(req, res) {
        try {
            const { q: query } = req.query;

            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Query too short'
                });
            }

            const suggestions = searchDrugDatabase(query);

            res.json({
                success: true,
                data: suggestions,
                message: `Found ${suggestions.length} suggestions`
            });

        } catch (error) {
            console.error('❌ [DRUG SUGGESTIONS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get drug suggestions',
                error: error.message
            });
        }
    }

    /**
     * Update user medications
     * POST /users/medications/update
     */
    async updateUserMedications(req, res) {
        try {
            const { medications } = req.body;
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required'
                });
            }

            // Validate medications
            const validMedications = medications
                .filter(med => med && med.trim().length > 0)
                .map(med => med.trim());

            // Update user's current medications
            await User.findByIdAndUpdate(user._id, {
                currentMedications: validMedications,
                updatedAt: new Date()
            });

            // Check for interactions with new medication list
            let interactionResults = null;
            if (validMedications.length > 1) {
                interactionResults = await healthAnalyticsService.checkDrugInteractions(
                    validMedications,
                    user
                );
            }

            res.json({
                success: true,
                message: 'Medications updated successfully',
                data: {
                    medications: validMedications,
                    interactionCheck: interactionResults
                }
            });

        } catch (error) {
            console.error('❌ [UPDATE MEDICATIONS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update medications',
                error: error.message
            });
        }
    }

    /**
     * Get user's interaction check history
     * GET /users/interaction-history
     */
    async getInteractionHistory(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required'
                });
            }

            // Get interaction history from user's interaction logs
            const interactionHistory = user.interactionChecks || [];

            res.json({
                success: true,
                data: {
                    history: interactionHistory.slice(-10), // Last 10 checks
                    totalChecks: interactionHistory.length,
                    lastCheck: interactionHistory.length > 0 ? interactionHistory[interactionHistory.length - 1] : null
                }
            });

        } catch (error) {
            console.error('❌ [INTERACTION HISTORY] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get interaction history',
                error: error.message
            });
        }
    }

    /**
     * Render Analytics Dashboard
     * GET /analytics/dashboard
     */
    async renderAnalyticsDashboard(req, res) {
        try {
            const user = req.user;

            if (!user) {
                req.flash('error', 'Please log in to access analytics.');
                return res.redirect('/users/login');
            }

            // Allow access for all logged-in users, but provide different views based on role
            const hasFullAccess = user.role === 'admin' || user.role === 'doctor';
            const accessLevel = user.role || 'user';

            res.render('analytics/dashboard', {
                title: 'Healthcare Analytics Dashboard | Healthfy',
                user: user,
                hasFullAccess: hasFullAccess,
                accessLevel: accessLevel,
                layout: 'main'
            });

        } catch (error) {
            console.error('❌ [ANALYTICS DASHBOARD] Error:', error);
            req.flash('error', 'Failed to load analytics dashboard.');
            res.redirect('/users/dashboard');
        }
    }

    /**
     * Get Analytics Overview Data
     * GET /api/analytics/overview
     */
    async getAnalyticsOverview(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to access analytics'
                });
            }

            // Allow access but provide different data based on role
            const hasFullAccess = user.role === 'admin' || user.role === 'doctor';

            // Get overview analytics from health analytics service
            const overviewData = await generateAnalyticsOverview();

            res.json({
                success: true,
                data: overviewData
            });

        } catch (error) {
            console.error('❌ [ANALYTICS OVERVIEW] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics overview',
                error: error.message
            });
        }
    }

    /**
     * Get Patient Journey Analytics
     * GET /api/analytics/patient-journey
     */
    async getPatientJourneyAnalytics(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to access analytics'
                });
            }

            const { timeRange = 90, condition, patientId } = req.query;
            
            // Get patient journey analytics
            const journeyData = await generatePatientJourneyAnalytics({
                timeRange: parseInt(timeRange),
                condition,
                patientId
            });

            res.json({
                success: true,
                data: journeyData
            });

        } catch (error) {
            console.error('❌ [PATIENT JOURNEY ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get patient journey analytics',
                error: error.message
            });
        }
    }

    /**
     * Get Medical Trends Analytics
     * GET /api/analytics/medical-trends
     */
    async getMedicalTrendsAnalytics(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to access analytics'
                });
            }

            const { timeRange = 90, metric = 'consultations', department } = req.query;
            
            // Get medical trends analytics
            const trendsData = await generateMedicalTrendsAnalytics({
                timeRange: parseInt(timeRange),
                metric,
                department
            });

            res.json({
                success: true,
                data: trendsData
            });

        } catch (error) {
            console.error('❌ [MEDICAL TRENDS ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get medical trends analytics',
                error: error.message
            });
        }
    }

    /**
     * Get Doctor Performance Analytics
     * GET /api/analytics/doctor-performance
     */
    async getDoctorPerformanceAnalytics(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to access analytics'
                });
            }

            const { timeRange = 30, doctorId } = req.query;
            
            // Get doctor performance analytics
            const performanceData = await generateDoctorPerformanceAnalytics({
                timeRange: parseInt(timeRange),
                doctorId
            });

            res.json({
                success: true,
                data: performanceData
            });

        } catch (error) {
            console.error('❌ [DOCTOR PERFORMANCE ANALYTICS] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get doctor performance analytics',
                error: error.message
            });
        }
    }

}

// Helper functions

/**
 * Check if user has minimum health data for predictions
 */
function hasMinimumHealthData(user) {
    const required = {
        basic: ['age', 'gender', 'height', 'weight'],
        optional: ['bloodPressure', 'bloodSugar', 'cholesterol', 'lifestyle']
    };

    const missing = [];
    let score = 0;

    // Check required fields
    required.basic.forEach(field => {
        if (!user[field] || (typeof user[field] === 'object' && Object.keys(user[field]).length === 0)) {
            missing.push(field);
        } else {
            score += 25; // Each required field is worth 25 points
        }
    });

    // Check optional fields for bonus points
    required.optional.forEach(field => {
        if (user[field] && (typeof user[field] !== 'object' || Object.keys(user[field]).length > 0)) {
            score += 10; // Each optional field is worth 10 points
        }
    });

    return {
        sufficient: missing.length === 0 && score >= 70,
        score,
        missing,
        completeness: Math.min(score, 100)
    };
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(user) {
    const fields = {
        // Basic info (40 points)
        name: 5,
        email: 5,
        age: 5,
        gender: 5,
        phone: 5,
        address: 5,
        profileImage: 5,
        dob: 5,

        // Health profile (40 points)
        height: 5,
        weight: 5,
        bloodGroup: 5,
        bloodPressure: 5,
        bloodSugar: 5,
        cholesterol: 5,
        heartRate: 5,
        lifestyle: 5,

        // Medical history (20 points)
        allergies: 5,
        medicalHistory: 5,
        currentMedications: 5,
        familyHistory: 5
    };

    let completed = 0;
    let total = 0;

    Object.entries(fields).forEach(([field, points]) => {
        total += points;
        
        const value = user[field];
        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
                if (value.length > 0) completed += points;
            } else if (typeof value === 'object') {
                if (Object.keys(value).length > 0) completed += points;
            } else if (typeof value === 'string') {
                if (value.trim().length > 0) completed += points;
            } else {
                completed += points;
            }
        }
    });

    return Math.round((completed / total) * 100);
}

/**
 * Save interaction check to user's history
 */
async function saveInteractionCheck(userId, interactionResults) {
    try {
        const interactionRecord = {
            timestamp: new Date(),
            medications: interactionResults.checkedMedications,
            riskScore: interactionResults.riskScore,
            summary: interactionResults.summary,
            severeCount: interactionResults.severe.length,
            moderateCount: interactionResults.moderate.length,
            mildCount: interactionResults.mild.length,
            allergyCount: interactionResults.allergicReactions.length
        };

        await User.findByIdAndUpdate(userId, {
            $push: {
                'interactionChecks': {
                    $each: [interactionRecord],
                    $slice: -20 // Keep only last 20 checks
                }
            }
        });

    } catch (error) {
        console.error('❌ [SAVE INTERACTION] Error:', error);
    }
}

/**
 * Update user's risk scores in database
 */
async function updateUserRiskScores(userId, predictions) {
    try {
        const riskScores = {
            diabetes: predictions.diabetes.score,
            heartDisease: predictions.heartDisease.score,
            hypertension: predictions.hypertension.score,
            obesity: predictions.obesity.score
        };

        const aiPrediction = {
            type: 'comprehensive_health_assessment',
            score: predictions.overallHealthScore,
            model: 'healthfy_risk_assessment_v1',
            date: new Date(),
            details: {
                diabetes: predictions.diabetes.riskLevel,
                heartDisease: predictions.heartDisease.riskLevel,
                hypertension: predictions.hypertension.riskLevel,
                obesity: predictions.obesity.riskLevel
            }
        };

        await User.findByIdAndUpdate(userId, {
            riskScores,
            $push: {
                aiPredictions: {
                    $each: [aiPrediction],
                    $slice: -10 // Keep only last 10 predictions
                }
            },
            lastHealthAssessment: new Date()
        });

    } catch (error) {
        console.error('❌ [UPDATE RISK SCORES] Error:', error);
    }
}

/**
 * Search drug database for autocomplete suggestions
 */
function searchDrugDatabase(query) {
    const commonDrugs = [
        { name: 'Paracetamol', category: 'Analgesic', description: 'Pain relief and fever reduction' },
        { name: 'Aspirin', category: 'NSAID', description: 'Pain relief and anti-inflammatory' },
        { name: 'Ibuprofen', category: 'NSAID', description: 'Pain relief and anti-inflammatory' },
        { name: 'Metformin', category: 'Antidiabetic', description: 'Type 2 diabetes medication' },
        { name: 'Insulin', category: 'Antidiabetic', description: 'Diabetes hormone therapy' },
        { name: 'Lisinopril', category: 'ACE Inhibitor', description: 'Blood pressure medication' },
        { name: 'Atorvastatin', category: 'Statin', description: 'Cholesterol lowering medication' },
        { name: 'Warfarin', category: 'Anticoagulant', description: 'Blood thinner' },
        { name: 'Amoxicillin', category: 'Antibiotic', description: 'Bacterial infection treatment' },
        { name: 'Omeprazole', category: 'PPI', description: 'Acid reflux medication' },
        { name: 'Dolo 650', category: 'Analgesic', description: 'Paracetamol brand for pain relief' },
        { name: 'Crocin', category: 'Analgesic', description: 'Paracetamol brand for fever' },
        { name: 'Combiflam', category: 'NSAID', description: 'Combination pain reliever' },
        { name: 'Azithromycin', category: 'Antibiotic', description: 'Antibiotic for infections' },
        { name: 'Cetirizine', category: 'Antihistamine', description: 'Allergy medication' },
        { name: 'Pantoprazole', category: 'PPI', description: 'Acid reducer' },
        { name: 'Levothyroxine', category: 'Hormone', description: 'Thyroid hormone replacement' },
        { name: 'Amlodipine', category: 'Calcium Channel Blocker', description: 'Blood pressure medication' }
    ];

    const queryLower = query.toLowerCase();
    return commonDrugs
        .filter(drug => 
            drug.name.toLowerCase().includes(queryLower) ||
            drug.category.toLowerCase().includes(queryLower)
        )
        .slice(0, 8)
        .map(drug => ({
            ...drug,
            id: drug.name.toLowerCase().replace(/\s+/g, '_')
        }));
}

/**
 * Get popular drugs for quick selection
 */
function getPopularDrugs() {
    return [
        { name: 'Paracetamol', category: 'Pain Relief', icon: '💊' },
        { name: 'Aspirin', category: 'Pain Relief', icon: '💊' },
        { name: 'Metformin', category: 'Diabetes', icon: '💉' },
        { name: 'Lisinopril', category: 'Blood Pressure', icon: '❤️' },
        { name: 'Atorvastatin', category: 'Cholesterol', icon: '🩸' },
        { name: 'Omeprazole', category: 'Acid Reflux', icon: '🔥' }
    ];
}

/**
 * Assess data completeness for AI predictions
 */
function assessDataCompleteness(user) {
    const requiredFields = {
        // Critical fields (20 points each)
        age: { weight: 20, required: true },
        height: { weight: 20, required: true },
        weight: { weight: 20, required: true },
        gender: { weight: 15, required: true },
        
        // Important fields (10-15 points each)
        bloodPressure: { weight: 15, required: false },
        bloodSugar: { weight: 15, required: false },
        cholesterol: { weight: 15, required: false },
        
        // Lifestyle fields (5-10 points each)
        lifestyle: { weight: 10, required: false },
        allergies: { weight: 5, required: false },
        medicalHistory: { weight: 5, required: false },
        currentMedications: { weight: 5, required: false },
        familyHistory: { weight: 10, required: false }
    };

    let score = 0;
    const missing = [];
    const present = [];
    let totalPossible = 0;

    Object.entries(requiredFields).forEach(([field, config]) => {
        totalPossible += config.weight;
        const value = user[field];
        
        let hasValue = false;
        if (Array.isArray(value)) {
            hasValue = value.length > 0;
        } else if (typeof value === 'object' && value !== null) {
            hasValue = Object.keys(value).length > 0 && 
                      Object.values(value).some(v => v !== null && v !== undefined);
        } else {
            hasValue = value !== null && value !== undefined && value !== '';
        }

        if (hasValue) {
            score += config.weight;
            present.push(field);
        } else {
            missing.push({ field, weight: config.weight, required: config.required });
        }
    });

    const percentage = Math.round((score / totalPossible) * 100);
    
    return {
        score: percentage,
        missing: missing.filter(m => m.required || percentage < 60),
        present,
        level: percentage >= 80 ? 'Excellent' : 
               percentage >= 60 ? 'Good' : 
               percentage >= 40 ? 'Fair' : 'Insufficient',
        canGeneratePredictions: percentage >= 40
    };
}

/**
 * Get historical trends from user's data
 */
function getHistoricalTrends(user) {
    const trends = {
        weight: [],
        bloodPressure: [],
        bloodSugar: [],
        predictions: []
    };

    // Analyze health logs if available
    if (user.healthLogs && user.healthLogs.length > 1) {
        const recentLogs = user.healthLogs.slice(-6); // Last 6 entries
        
        trends.weight = recentLogs.map(log => ({
            date: log.date,
            value: log.weight,
            bmi: log.bmi
        })).filter(entry => entry.value);

        trends.bloodPressure = recentLogs.map(log => ({
            date: log.date,
            systolic: log.bloodPressure?.systolic,
            diastolic: log.bloodPressure?.diastolic
        })).filter(entry => entry.systolic);

        trends.bloodSugar = recentLogs.map(log => ({
            date: log.date,
            fasting: log.bloodSugar?.fasting,
            hba1c: log.bloodSugar?.hba1c
        })).filter(entry => entry.fasting || entry.hba1c);
    }

    // Analyze AI prediction trends
    if (user.aiPredictions && user.aiPredictions.length > 1) {
        trends.predictions = user.aiPredictions.slice(-5).map(pred => ({
            date: pred.date,
            overallScore: pred.score,
            details: pred.details
        }));
    }

    return trends;
}

/**
 * Compare current prediction with previous ones
 */
function comparePredictions(predictions, currentId) {
    if (!predictions || predictions.length < 2) {
        return { hasComparison: false, message: 'No previous predictions to compare' };
    }

    const currentIndex = predictions.findIndex(p => p._id.toString() === currentId);
    if (currentIndex < 1) {
        return { hasComparison: false, message: 'No previous prediction to compare with' };
    }

    const current = predictions[currentIndex];
    const previous = predictions[currentIndex - 1];

    const scoreDiff = current.score - previous.score;
    const trend = scoreDiff > 5 ? 'improved' : scoreDiff < -5 ? 'declined' : 'stable';

    return {
        hasComparison: true,
        previous: {
            date: previous.date,
            score: previous.score
        },
        current: {
            date: current.date,
            score: current.score
        },
        difference: scoreDiff,
        trend: trend,
        interpretation: interpretTrend(trend, scoreDiff)
    };
}

/**
 * Interpret prediction trends
 */
function interpretTrend(trend, scoreDiff) {
    switch (trend) {
        case 'improved':
            return `Your overall health score improved by ${scoreDiff} points. Keep up the good work!`;
        case 'declined':
            return `Your health score decreased by ${Math.abs(scoreDiff)} points. Consider reviewing lifestyle factors.`;
        case 'stable':
            return 'Your health metrics remain stable. Continue current health practices.';
        default:
            return 'Unable to determine trend.';
    }
}

/**
 * Generate Analytics Overview Data
 */
async function generateAnalyticsOverview() {
    try {
        // In a real application, these would come from database queries
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        const recentPredictions = await User.countDocuments({ 'aiPredictions.0': { $exists: true } });
        
        // Generate sample data for demonstration
        return {
            totalPatients: totalUsers || 2847,
            activeConsultations: Math.floor(totalUsers * 0.15) || 143,
            avgSatisfaction: 4.6,
            criticalAlerts: Math.floor(Math.random() * 20) + 5,
            changes: {
                patients: Math.round((Math.random() * 30 - 10) * 10) / 10,
                consultations: Math.round((Math.random() * 20 - 5) * 10) / 10,
                satisfaction: Math.round((Math.random() * 10 - 2) * 10) / 10,
                alerts: Math.round((Math.random() * 40 - 20) * 10) / 10
            },
            patientFlow: generateTimeSeriesData(30, 50, 200, 'patients'),
            conditions: {
                'Diabetes': Math.floor(totalUsers * 0.08) || 234,
                'Hypertension': Math.floor(totalUsers * 0.07) || 189,
                'Heart Disease': Math.floor(totalUsers * 0.05) || 145,
                'Asthma': Math.floor(totalUsers * 0.04) || 123,
                'Arthritis': Math.floor(totalUsers * 0.03) || 98,
                'Depression': Math.floor(totalUsers * 0.027) || 76
            },
            responseTime: {
                'Emergency': 5,
                'Urgent': 15,
                'Regular': 30,
                'Follow-up': 45
            },
            medicationAdherence: {
                'Excellent (90-100%)': 45,
                'Good (80-89%)': 32,
                'Fair (70-79%)': 15,
                'Poor (<70%)': 8
            }
        };
    } catch (error) {
        console.error('Error generating analytics overview:', error);
        throw error;
    }
}

/**
 * Generate Patient Journey Analytics
 */
async function generatePatientJourneyAnalytics({ timeRange, condition, patientId }) {
    try {
        // In a real application, these would be database queries filtered by parameters
        const basePatientCount = 1000;
        
        return {
            journeyStages: [
                { stage: 'Initial Consultation', patients: basePatientCount, avgTime: 2 },
                { stage: 'Diagnosis', patients: Math.floor(basePatientCount * 0.85), avgTime: 5 },
                { stage: 'Treatment Plan', patients: Math.floor(basePatientCount * 0.72), avgTime: 3 },
                { stage: 'Treatment', patients: Math.floor(basePatientCount * 0.68), avgTime: 14 },
                { stage: 'Follow-up', patients: Math.floor(basePatientCount * 0.52), avgTime: 7 },
                { stage: 'Recovery', patients: Math.floor(basePatientCount * 0.45), avgTime: 21 }
            ],
            journeyMetrics: {
                avgJourneyTime: '52 days',
                completionRate: 78,
                dropoffRate: 22
            },
            commonPaths: [
                {
                    path: 'Consultation → Diagnosis → Treatment → Recovery',
                    percentage: 45,
                    avgTime: 48
                },
                {
                    path: 'Consultation → Diagnosis → Referral → Treatment',
                    percentage: 28,
                    avgTime: 62
                },
                {
                    path: 'Emergency → Diagnosis → Treatment → Follow-up',
                    percentage: 15,
                    avgTime: 35
                }
            ],
            filters: {
                timeRange,
                condition,
                patientId
            }
        };
    } catch (error) {
        console.error('Error generating patient journey analytics:', error);
        throw error;
    }
}

/**
 * Generate Medical Trends Analytics
 */
async function generateMedicalTrendsAnalytics({ timeRange, metric, department }) {
    try {
        return {
            consultationTrends: generateTimeSeriesData(timeRange, 20, 80, 'consultations'),
            conditionTrends: {
                'Diabetes': generateTimeSeriesData(timeRange, 15, 25),
                'Hypertension': generateTimeSeriesData(timeRange, 12, 22),
                'Heart Disease': generateTimeSeriesData(timeRange, 8, 18),
                'Respiratory': generateTimeSeriesData(timeRange, 10, 20)
            },
            treatmentEffectiveness: {
                'Medication Therapy': 85 + Math.floor(Math.random() * 10),
                'Physical Therapy': 78 + Math.floor(Math.random() * 10),
                'Surgery': 92 + Math.floor(Math.random() * 6),
                'Counseling': 73 + Math.floor(Math.random() * 12),
                'Lifestyle Changes': 68 + Math.floor(Math.random() * 15)
            },
            medicationTrends: {
                'Prescribed': generateTimeSeriesData(Math.min(timeRange, 30), 150, 300, 'medications'),
                'Adherence': generateTimeSeriesData(Math.min(timeRange, 30), 70, 95, 'percentage'),
                'Interactions': generateTimeSeriesData(Math.min(timeRange, 30), 5, 25, 'interactions')
            },
            departmentData: department ? {
                department,
                consultations: generateTimeSeriesData(timeRange, 10, 50),
                satisfaction: 4.2 + Math.random() * 0.6
            } : null,
            filters: {
                timeRange,
                metric,
                department
            }
        };
    } catch (error) {
        console.error('Error generating medical trends analytics:', error);
        throw error;
    }
}

/**
 * Generate Doctor Performance Analytics
 */
async function generateDoctorPerformanceAnalytics({ timeRange, doctorId }) {
    try {
        const doctors = [
            { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', rating: 4.8, patients: 145, consultations: 67 },
            { id: 2, name: 'Dr. Michael Chen', specialty: 'Internal Medicine', rating: 4.6, patients: 189, consultations: 89 },
            { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', rating: 4.9, patients: 203, consultations: 134 },
            { id: 4, name: 'Dr. David Thompson', specialty: 'Orthopedics', rating: 4.5, patients: 156, consultations: 78 },
            { id: 5, name: 'Dr. Lisa Park', specialty: 'Dermatology', rating: 4.7, patients: 167, consultations: 92 }
        ];

        const doctorCount = await User.countDocuments({ role: 'doctor' }) || 25;
        
        return {
            totalDoctors: doctorCount,
            avgSatisfaction: 4.6,
            avgResponseTime: '18 min',
            treatmentSuccessRate: 84,
            consultationsThisMonth: Math.floor(doctorCount * 50),
            doctors: doctors,
            performanceMetrics: doctors.map(doc => ({
                name: doc.name,
                satisfaction: doc.rating,
                responseTime: Math.floor(Math.random() * 30) + 10,
                successRate: Math.floor(Math.random() * 20) + 75,
                consultations: doc.consultations
            })),
            distributionData: {
                'Excellent (4.5+)': 68,
                'Good (4.0-4.4)': 24,
                'Average (3.5-3.9)': 6,
                'Below Average (<3.5)': 2
            },
            individualDoctor: doctorId ? doctors.find(d => d.id == doctorId) : null,
            filters: {
                timeRange,
                doctorId
            }
        };
    } catch (error) {
        console.error('Error generating doctor performance analytics:', error);
        throw error;
    }
}

/**
 * Generate Time Series Data for Analytics
 */
function generateTimeSeriesData(days, min, max, label = 'value') {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Add some realistic variation
        const baseValue = Math.floor(Math.random() * (max - min + 1)) + min;
        const trend = Math.sin((days - i) / days * Math.PI) * (max - min) * 0.1;
        const value = Math.max(min, Math.min(max, Math.floor(baseValue + trend)));
        
        data.push({
            date: date.toISOString().split('T')[0],
            value: value,
            label: label
        });
    }
    
    return data;
}

module.exports = new HealthAnalyticsController();
