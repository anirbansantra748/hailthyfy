const User = require('../models/User');

/**
 * Advanced AI Health Prediction Service
 * Provides comprehensive health risk analysis using AI algorithms
 * Analyzes user health data to predict future health risks and diseases
 */

class AIHealthPredictionService {
    constructor() {
        // Health risk thresholds and scoring systems
        this.healthMetrics = {
            bmi: {
                underweight: { min: 0, max: 18.5, risk: 'moderate', score: 15 },
                normal: { min: 18.5, max: 25, risk: 'low', score: 0 },
                overweight: { min: 25, max: 30, risk: 'moderate', score: 20 },
                obese: { min: 30, max: 35, risk: 'high', score: 35 },
                severelyObese: { min: 35, max: 50, risk: 'critical', score: 50 }
            },
            bloodPressure: {
                optimal: { systolic: [0, 120], diastolic: [0, 80], risk: 'low', score: 0 },
                normal: { systolic: [120, 130], diastolic: [80, 85], risk: 'low', score: 5 },
                high_normal: { systolic: [130, 140], diastolic: [85, 90], risk: 'moderate', score: 15 },
                stage1: { systolic: [140, 160], diastolic: [90, 100], risk: 'high', score: 30 },
                stage2: { systolic: [160, 180], diastolic: [100, 110], risk: 'critical', score: 45 },
                crisis: { systolic: [180, 300], diastolic: [110, 200], risk: 'emergency', score: 60 }
            },
            bloodSugar: {
                normal_fasting: { min: 70, max: 100, risk: 'low', score: 0 },
                prediabetic_fasting: { min: 100, max: 126, risk: 'moderate', score: 25 },
                diabetic_fasting: { min: 126, max: 400, risk: 'high', score: 50 },
                normal_hba1c: { min: 4, max: 5.7, risk: 'low', score: 0 },
                prediabetic_hba1c: { min: 5.7, max: 6.5, risk: 'moderate', score: 25 },
                diabetic_hba1c: { min: 6.5, max: 15, risk: 'high', score: 50 }
            },
            cholesterol: {
                optimal_total: { min: 0, max: 200, risk: 'low', score: 0 },
                borderline_total: { min: 200, max: 240, risk: 'moderate', score: 15 },
                high_total: { min: 240, max: 500, risk: 'high', score: 30 },
                low_hdl: { min: 0, max: 40, risk: 'high', score: 25 },
                normal_hdl: { min: 40, max: 60, risk: 'moderate', score: 10 },
                high_hdl: { min: 60, max: 100, risk: 'protective', score: -10 },
                optimal_ldl: { min: 0, max: 100, risk: 'low', score: 0 },
                near_optimal_ldl: { min: 100, max: 130, risk: 'low', score: 5 },
                borderline_ldl: { min: 130, max: 160, risk: 'moderate', score: 15 },
                high_ldl: { min: 160, max: 190, risk: 'high', score: 25 },
                very_high_ldl: { min: 190, max: 500, risk: 'critical', score: 35 }
            }
        };

        // Disease prediction models
        this.diseaseModels = {
            diabetes: {
                name: 'Type 2 Diabetes',
                factors: ['bmi', 'bloodSugar', 'age', 'familyHistory', 'lifestyle', 'bloodPressure'],
                weights: { bmi: 0.25, bloodSugar: 0.35, age: 0.15, familyHistory: 0.15, lifestyle: 0.10 }
            },
            heartDisease: {
                name: 'Cardiovascular Disease',
                factors: ['cholesterol', 'bloodPressure', 'age', 'gender', 'smoking', 'diabetes'],
                weights: { cholesterol: 0.30, bloodPressure: 0.30, age: 0.20, smoking: 0.15, gender: 0.05 }
            },
            hypertension: {
                name: 'High Blood Pressure',
                factors: ['bloodPressure', 'bmi', 'age', 'lifestyle', 'familyHistory'],
                weights: { bloodPressure: 0.40, bmi: 0.20, age: 0.15, lifestyle: 0.15, familyHistory: 0.10 }
            },
            obesity: {
                name: 'Obesity',
                factors: ['bmi', 'lifestyle', 'age', 'familyHistory'],
                weights: { bmi: 0.50, lifestyle: 0.30, age: 0.10, familyHistory: 0.10 }
            },
            stroke: {
                name: 'Stroke',
                factors: ['bloodPressure', 'cholesterol', 'age', 'smoking', 'diabetes'],
                weights: { bloodPressure: 0.35, cholesterol: 0.25, age: 0.20, smoking: 0.15, diabetes: 0.05 }
            },
            kidneyDisease: {
                name: 'Chronic Kidney Disease',
                factors: ['bloodPressure', 'diabetes', 'age', 'familyHistory'],
                weights: { bloodPressure: 0.30, diabetes: 0.30, age: 0.25, familyHistory: 0.15 }
            }
        };
    }

    /**
     * Main function to predict comprehensive health risks
     * @param {Object} userProfile - Complete user health data
     * @returns {Object} Comprehensive health risk analysis
     */
    async analyzeHealthRisks(userProfile) {
        try {
            // Calculate BMI if not present
            if (!userProfile.bmi && userProfile.height && userProfile.weight) {
                const heightInMeters = userProfile.height / 100;
                userProfile.bmi = Math.round((userProfile.weight / (heightInMeters * heightInMeters)) * 10) / 10;
            }

            // Calculate age if not present but DOB is available
            if (!userProfile.age && userProfile.dob) {
                const today = new Date();
                const birthDate = new Date(userProfile.dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                userProfile.age = age;
            }

            const analysis = {
                timestamp: new Date(),
                userId: userProfile._id,
                predictions: {},
                overallHealthScore: 0,
                riskAlerts: [],
                recommendations: [],
                criticalFindings: [],
                trends: {},
                nextActions: []
            };

            // Analyze each disease risk
            for (const [diseaseKey, model] of Object.entries(this.diseaseModels)) {
                analysis.predictions[diseaseKey] = this.predictDiseaseRisk(diseaseKey, model, userProfile);
            }

            // Calculate overall health score
            analysis.overallHealthScore = this.calculateOverallHealthScore(analysis.predictions);

            // Generate risk alerts
            analysis.riskAlerts = this.generateRiskAlerts(analysis.predictions, userProfile);

            // Generate personalized recommendations
            analysis.recommendations = this.generatePersonalizedRecommendations(analysis.predictions, userProfile);

            // Identify critical findings
            analysis.criticalFindings = this.identifyCriticalFindings(analysis.predictions, userProfile);

            // Analyze trends if historical data exists
            analysis.trends = this.analyzeTrends(userProfile);

            // Generate next actions
            analysis.nextActions = this.generateNextActions(analysis.predictions);

            return analysis;

        } catch (error) {
            console.error('❌ [AI HEALTH PREDICTION] Analysis error:', error);
            throw new Error('Failed to analyze health risks: ' + error.message);
        }
    }

    /**
     * Predict risk for a specific disease
     */
    predictDiseaseRisk(diseaseKey, model, profile) {
        let totalScore = 0;
        const factors = [];
        const maxPossibleScore = 100;

        // Analyze each factor
        model.factors.forEach(factor => {
            const factorScore = this.calculateFactorScore(factor, profile);
            const weightedScore = factorScore * (model.weights[factor] || 0.1);
            totalScore += weightedScore;

            if (factorScore > 0) {
                factors.push({
                    name: this.getFactorDisplayName(factor),
                    score: factorScore,
                    impact: this.getImpactLevel(factorScore),
                    description: this.getFactorDescription(factor, profile)
                });
            }
        });

        // Normalize score to 0-100
        const riskScore = Math.min(Math.round(totalScore), 100);

        // Determine risk level and recommendations
        const riskAssessment = this.assessRiskLevel(riskScore);

        return {
            disease: model.name,
            score: riskScore,
            riskLevel: riskAssessment.level,
            color: riskAssessment.color,
            probability: this.calculateProbability(riskScore),
            factors: factors.sort((a, b) => b.score - a.score),
            recommendation: riskAssessment.recommendation,
            preventionTips: this.getPreventionTips(diseaseKey, riskScore),
            timeFrame: this.getTimeFrame(riskScore),
            confidence: this.calculatePredictionConfidence(factors.length, profile)
        };
    }

    /**
     * Calculate factor-specific scores
     */
    calculateFactorScore(factor, profile) {
        switch (factor) {
            case 'bmi':
                if (!profile.bmi) return 0;
                return this.scoreBMI(profile.bmi);

            case 'bloodPressure':
                if (!profile.bloodPressure) return 0;
                return this.scoreBloodPressure(profile.bloodPressure);

            case 'bloodSugar':
                if (!profile.bloodSugar) return 0;
                return this.scoreBloodSugar(profile.bloodSugar);

            case 'cholesterol':
                if (!profile.cholesterol) return 0;
                return this.scoreCholesterol(profile.cholesterol);

            case 'age':
                if (!profile.age) return 0;
                return this.scoreAge(profile.age);

            case 'gender':
                return this.scoreGender(profile.gender, factor);

            case 'lifestyle':
                if (!profile.lifestyle) return 0;
                return this.scoreLifestyle(profile.lifestyle);

            case 'familyHistory':
                if (!profile.familyHistory) return 0;
                return this.scoreFamilyHistory(profile.familyHistory, factor);

            case 'smoking':
                return profile.lifestyle?.smoking ? 25 : 0;

            case 'diabetes':
                return this.checkForDiabetes(profile) ? 30 : 0;

            default:
                return 0;
        }
    }

    /**
     * BMI Scoring
     */
    scoreBMI(bmi) {
        for (const [category, range] of Object.entries(this.healthMetrics.bmi)) {
            if (bmi >= range.min && (bmi < range.max || range.max === 50)) {
                return range.score;
            }
        }
        return 0;
    }

    /**
     * Blood Pressure Scoring
     */
    scoreBloodPressure(bp) {
        if (!bp.systolic || !bp.diastolic) return 0;

        let maxScore = 0;
        for (const [category, range] of Object.entries(this.healthMetrics.bloodPressure)) {
            if (bp.systolic >= range.systolic[0] && bp.systolic < range.systolic[1] &&
                bp.diastolic >= range.diastolic[0] && bp.diastolic < range.diastolic[1]) {
                maxScore = Math.max(maxScore, range.score);
            }
        }
        return maxScore;
    }

    /**
     * Blood Sugar Scoring
     */
    scoreBloodSugar(bloodSugar) {
        let maxScore = 0;

        // Check fasting glucose
        if (bloodSugar.fasting) {
            if (bloodSugar.fasting >= 126) maxScore = Math.max(maxScore, 50);
            else if (bloodSugar.fasting >= 100) maxScore = Math.max(maxScore, 25);
        }

        // Check HbA1c
        if (bloodSugar.hba1c) {
            if (bloodSugar.hba1c >= 6.5) maxScore = Math.max(maxScore, 50);
            else if (bloodSugar.hba1c >= 5.7) maxScore = Math.max(maxScore, 25);
        }

        // Check post-meal glucose
        if (bloodSugar.postMeal) {
            if (bloodSugar.postMeal >= 200) maxScore = Math.max(maxScore, 45);
            else if (bloodSugar.postMeal >= 140) maxScore = Math.max(maxScore, 20);
        }

        return maxScore;
    }

    /**
     * Cholesterol Scoring
     */
    scoreCholesterol(cholesterol) {
        let totalScore = 0;

        // Total cholesterol
        if (cholesterol.total) {
            if (cholesterol.total >= 240) totalScore += 30;
            else if (cholesterol.total >= 200) totalScore += 15;
        }

        // HDL cholesterol (protective when high)
        if (cholesterol.hdl) {
            if (cholesterol.hdl <= 40) totalScore += 25;
            else if (cholesterol.hdl >= 60) totalScore -= 10; // Protective
        }

        // LDL cholesterol
        if (cholesterol.ldl) {
            if (cholesterol.ldl >= 190) totalScore += 35;
            else if (cholesterol.ldl >= 160) totalScore += 25;
            else if (cholesterol.ldl >= 130) totalScore += 15;
        }

        // Triglycerides
        if (cholesterol.triglycerides) {
            if (cholesterol.triglycerides >= 500) totalScore += 20;
            else if (cholesterol.triglycerides >= 200) totalScore += 15;
            else if (cholesterol.triglycerides >= 150) totalScore += 10;
        }

        return Math.max(0, totalScore);
    }

    /**
     * Age Scoring
     */
    scoreAge(age) {
        if (age >= 75) return 30;
        if (age >= 65) return 25;
        if (age >= 55) return 20;
        if (age >= 45) return 15;
        if (age >= 35) return 10;
        if (age >= 25) return 5;
        return 0;
    }

    /**
     * Lifestyle Scoring
     */
    scoreLifestyle(lifestyle) {
        let score = 0;

        // Exercise frequency
        if (lifestyle.exerciseFrequency === 'none') score += 20;
        else if (lifestyle.exerciseFrequency === 'low') score += 15;
        else if (lifestyle.exerciseFrequency === 'moderate') score += 5;

        // Smoking
        if (lifestyle.smoking) score += 25;

        // Alcohol
        if (lifestyle.alcohol) score += 10;

        // Sleep
        if (lifestyle.sleepHours) {
            if (lifestyle.sleepHours < 6 || lifestyle.sleepHours > 9) score += 10;
        }

        // Stress level
        if (lifestyle.stressLevel) {
            if (lifestyle.stressLevel >= 8) score += 15;
            else if (lifestyle.stressLevel >= 6) score += 10;
        }

        // Diet
        if (lifestyle.diet === 'non-vegetarian') score += 5;

        return score;
    }

    /**
     * Family History Scoring
     */
    scoreFamilyHistory(familyHistory, disease) {
        if (!familyHistory || !Array.isArray(familyHistory)) return 0;

        const diseaseKeywords = {
            diabetes: ['diabetes', 'diabetic', 'blood sugar', 'insulin'],
            heartDisease: ['heart', 'cardiac', 'coronary', 'heart attack', 'angina'],
            hypertension: ['blood pressure', 'hypertension', 'high bp'],
            stroke: ['stroke', 'brain attack', 'cerebral'],
            kidneyDisease: ['kidney', 'renal', 'dialysis']
        };

        const keywords = diseaseKeywords[disease] || [];
        
        for (const history of familyHistory) {
            const historyLower = history.toLowerCase();
            for (const keyword of keywords) {
                if (historyLower.includes(keyword)) {
                    return 20; // Family history adds significant risk
                }
            }
        }

        return 0;
    }

    /**
     * Check for existing diabetes
     */
    checkForDiabetes(profile) {
        // Check medical history
        if (profile.medicalHistory && Array.isArray(profile.medicalHistory)) {
            const hasdiabetes = profile.medicalHistory.some(condition => 
                condition.toLowerCase().includes('diabetes') || 
                condition.toLowerCase().includes('diabetic')
            );
            if (hasdiabetes) return true;
        }

        // Check current medications
        if (profile.currentMedications && Array.isArray(profile.currentMedications)) {
            const diabeticMeds = ['metformin', 'insulin', 'glipizide', 'glyburide'];
            const hasDiabeticMed = profile.currentMedications.some(med => 
                diabeticMeds.some(diabeticMed => 
                    med.toLowerCase().includes(diabeticMed)
                )
            );
            if (hasDiabeticMed) return true;
        }

        // Check blood sugar levels
        if (profile.bloodSugar) {
            if (profile.bloodSugar.hba1c >= 6.5 || profile.bloodSugar.fasting >= 126) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate overall health score
     */
    calculateOverallHealthScore(predictions) {
        const diseaseScores = Object.values(predictions).map(p => p.score);
        const averageRisk = diseaseScores.reduce((sum, score) => sum + score, 0) / diseaseScores.length;
        
        // Convert risk to health score (inverse relationship)
        return Math.max(0, 100 - Math.round(averageRisk));
    }

    /**
     * Assess risk level based on score
     */
    assessRiskLevel(score) {
        if (score >= 80) return {
            level: 'Critical',
            color: '#dc2626',
            recommendation: 'Immediate medical attention required. Schedule urgent consultation.'
        };
        if (score >= 60) return {
            level: 'High',
            color: '#ea580c',
            recommendation: 'High risk detected. Schedule medical consultation within 1-2 weeks.'
        };
        if (score >= 40) return {
            level: 'Moderate',
            color: '#d97706',
            recommendation: 'Moderate risk. Consider lifestyle changes and regular monitoring.'
        };
        if (score >= 20) return {
            level: 'Low-Moderate',
            color: '#16a34a',
            recommendation: 'Some risk factors present. Focus on prevention and healthy habits.'
        };
        return {
            level: 'Low',
            color: '#059669',
            recommendation: 'Low risk. Continue healthy lifestyle and regular check-ups.'
        };
    }

    /**
     * Calculate probability percentage
     */
    calculateProbability(score) {
        // Convert risk score to probability
        if (score >= 80) return '70-90%';
        if (score >= 60) return '50-70%';
        if (score >= 40) return '30-50%';
        if (score >= 20) return '15-30%';
        return '5-15%';
    }

    /**
     * Generate risk alerts
     */
    generateRiskAlerts(predictions, profile) {
        const alerts = [];

        Object.entries(predictions).forEach(([disease, prediction]) => {
            if (prediction.score >= 60) {
                alerts.push({
                    type: 'high_risk',
                    disease: prediction.disease,
                    severity: prediction.riskLevel,
                    message: `High risk of ${prediction.disease} detected (${prediction.score}% risk score)`,
                    action: prediction.recommendation,
                    urgency: prediction.score >= 80 ? 'immediate' : 'soon',
                    color: prediction.color
                });
            }
        });

        // Add specific alerts for critical values
        if (profile.bloodPressure) {
            if (profile.bloodPressure.systolic >= 180 || profile.bloodPressure.diastolic >= 110) {
                alerts.push({
                    type: 'critical_vital',
                    severity: 'Emergency',
                    message: 'Blood pressure in crisis range - seek immediate medical attention',
                    action: 'Call emergency services or go to ER immediately',
                    urgency: 'emergency',
                    color: '#dc2626'
                });
            }
        }

        return alerts.sort((a, b) => {
            const urgencyOrder = { 'emergency': 0, 'immediate': 1, 'soon': 2 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });
    }

    /**
     * Generate personalized recommendations
     */
    generatePersonalizedRecommendations(predictions, profile) {
        const recommendations = [];

        // BMI-based recommendations
        if (profile.bmi) {
            if (profile.bmi >= 30) {
                recommendations.push({
                    category: 'Weight Management',
                    priority: 'high',
                    title: 'Weight Loss Program',
                    description: 'Consider a structured weight loss program with medical supervision',
                    action: 'Consult nutritionist and consider bariatric evaluation',
                    timeframe: '3-6 months'
                });
            } else if (profile.bmi >= 25) {
                recommendations.push({
                    category: 'Weight Management',
                    priority: 'medium',
                    title: 'Weight Reduction',
                    description: 'Aim to lose 5-10% of current body weight through diet and exercise',
                    action: 'Create caloric deficit of 500-750 calories daily',
                    timeframe: '3-6 months'
                });
            }
        }

        // Exercise recommendations
        if (profile.lifestyle?.exerciseFrequency === 'none' || profile.lifestyle?.exerciseFrequency === 'low') {
            recommendations.push({
                category: 'Physical Activity',
                priority: 'high',
                title: 'Increase Physical Activity',
                description: 'Aim for at least 150 minutes of moderate aerobic activity per week',
                action: 'Start with 30 minutes walking 5 days a week, gradually increase intensity',
                timeframe: '2-4 weeks to establish routine'
            });
        }

        // Diet recommendations
        const highRiskDiseases = Object.entries(predictions)
            .filter(([_, pred]) => pred.score >= 40)
            .map(([disease, _]) => disease);

        if (highRiskDiseases.includes('diabetes') || highRiskDiseases.includes('heartDisease')) {
            recommendations.push({
                category: 'Nutrition',
                priority: 'high',
                title: 'Heart-Healthy Diet',
                description: 'Adopt Mediterranean-style diet rich in vegetables, fruits, whole grains, and lean proteins',
                action: 'Reduce processed foods, limit sodium to <2300mg daily, increase fiber intake',
                timeframe: '2-3 weeks for adaptation'
            });
        }

        // Smoking cessation
        if (profile.lifestyle?.smoking) {
            recommendations.push({
                category: 'Lifestyle',
                priority: 'critical',
                title: 'Smoking Cessation',
                description: 'Quitting smoking is the single most important step to reduce health risks',
                action: 'Consider nicotine replacement therapy, counseling, or prescription medications',
                timeframe: 'Start immediately'
            });
        }

        // Stress management
        if (profile.lifestyle?.stressLevel >= 7) {
            recommendations.push({
                category: 'Mental Health',
                priority: 'medium',
                title: 'Stress Management',
                description: 'High stress levels contribute to multiple health risks',
                action: 'Practice meditation, yoga, or consider counseling. Aim for 7-8 hours sleep nightly',
                timeframe: '2-4 weeks to see benefits'
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Get prevention tips for specific diseases
     */
    getPreventionTips(disease, riskScore) {
        const tips = {
            diabetes: [
                'Maintain healthy weight (BMI 18.5-24.9)',
                'Exercise regularly - at least 150 min/week moderate activity',
                'Eat a balanced diet rich in fiber, low in processed foods',
                'Limit sugary drinks and refined carbohydrates',
                'Get regular blood sugar screenings',
                'Manage stress through relaxation techniques',
                'Get adequate sleep (7-9 hours nightly)',
                'Stay hydrated with water'
            ],
            heartDisease: [
                'Follow heart-healthy diet (Mediterranean or DASH)',
                'Exercise regularly to strengthen heart muscle',
                'Maintain healthy blood pressure (<120/80)',
                'Keep cholesterol levels in check',
                'Don\'t smoke and avoid secondhand smoke',
                'Limit alcohol consumption',
                'Manage diabetes if present',
                'Maintain healthy weight'
            ],
            hypertension: [
                'Reduce sodium intake (<2300mg daily)',
                'Increase potassium-rich foods (bananas, oranges)',
                'Exercise regularly to lower blood pressure',
                'Maintain healthy weight',
                'Limit alcohol consumption',
                'Manage stress effectively',
                'Get adequate sleep',
                'Monitor blood pressure regularly'
            ],
            obesity: [
                'Create sustainable caloric deficit',
                'Focus on whole, unprocessed foods',
                'Increase physical activity gradually',
                'Track food intake and portions',
                'Stay hydrated with water',
                'Get adequate sleep for hormone regulation',
                'Build muscle through resistance training',
                'Consider professional support if needed'
            ]
        };

        return tips[disease] || [];
    }

    /**
     * Generate next recommended actions
     */
    generateNextActions(predictions) {
        const actions = [];
        
        Object.entries(predictions).forEach(([disease, prediction]) => {
            if (prediction.score >= 60) {
                actions.push({
                    priority: 'high',
                    action: `Schedule ${prediction.disease.toLowerCase()} screening`,
                    timeline: prediction.score >= 80 ? 'Within 1 week' : 'Within 1 month',
                    type: 'medical_consultation'
                });
            } else if (prediction.score >= 40) {
                actions.push({
                    priority: 'medium',
                    action: `Annual ${prediction.disease.toLowerCase()} monitoring`,
                    timeline: 'Next 3-6 months',
                    type: 'preventive_screening'
                });
            }
        });

        return actions.sort((a, b) => {
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Save prediction results to user profile
     */
    async savePredictionToProfile(userId, analysis) {
        try {
            const predictionRecord = {
                type: 'comprehensive_health_prediction',
                score: analysis.overallHealthScore,
                model: 'healthfy_ai_prediction_v2',
                date: new Date(),
                details: {
                    predictions: analysis.predictions,
                    riskAlerts: analysis.riskAlerts,
                    criticalFindings: analysis.criticalFindings
                },
                confidence: this.calculateOverallConfidence(analysis.predictions)
            };

            // Update risk scores in user profile
            const riskScores = {};
            Object.entries(analysis.predictions).forEach(([disease, pred]) => {
                riskScores[disease] = pred.score;
            });

            await User.findByIdAndUpdate(userId, {
                riskScores: riskScores,
                $push: {
                    aiPredictions: {
                        $each: [predictionRecord],
                        $slice: -20 // Keep last 20 predictions
                    }
                },
                lastHealthAssessment: new Date()
            });

            console.log('✅ [AI PREDICTION] Saved prediction results for user:', userId);
            return true;

        } catch (error) {
            console.error('❌ [AI PREDICTION] Error saving results:', error);
            return false;
        }
    }

    // Helper methods for display formatting
    getFactorDisplayName(factor) {
        const names = {
            bmi: 'Body Mass Index',
            bloodPressure: 'Blood Pressure',
            bloodSugar: 'Blood Sugar Levels',
            cholesterol: 'Cholesterol Levels',
            age: 'Age Factor',
            lifestyle: 'Lifestyle Factors',
            familyHistory: 'Family History',
            smoking: 'Smoking Status',
            diabetes: 'Existing Diabetes'
        };
        return names[factor] || factor;
    }

    getImpactLevel(score) {
        if (score >= 30) return 'high';
        if (score >= 15) return 'moderate';
        return 'low';
    }

    getFactorDescription(factor, profile) {
        // Return specific description based on user's data
        switch (factor) {
            case 'bmi':
                if (profile.bmi >= 30) return `BMI of ${profile.bmi} indicates obesity`;
                if (profile.bmi >= 25) return `BMI of ${profile.bmi} indicates overweight`;
                return `BMI of ${profile.bmi} is in normal range`;
            // Add more specific descriptions as needed
            default:
                return '';
        }
    }

    getTimeFrame(score) {
        if (score >= 80) return '1-2 years';
        if (score >= 60) return '2-5 years';
        if (score >= 40) return '5-10 years';
        return '10+ years';
    }

    calculatePredictionConfidence(factorsCount, profile) {
        let confidence = Math.min(factorsCount * 10, 70);
        
        // Boost confidence based on data completeness
        const importantFields = ['age', 'bmi', 'bloodPressure', 'bloodSugar', 'cholesterol'];
        const completedFields = importantFields.filter(field => {
            return profile[field] !== null && profile[field] !== undefined;
        }).length;
        
        confidence += (completedFields / importantFields.length) * 30;
        
        return Math.min(Math.round(confidence), 95);
    }

    calculateOverallConfidence(predictions) {
        const confidences = Object.values(predictions).map(p => p.confidence);
        return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length);
    }

    analyzeTrends(profile) {
        // Analyze trends from health logs if available
        const trends = {
            weight: 'stable',
            bloodPressure: 'stable',
            bloodSugar: 'stable',
            message: 'Insufficient historical data for trend analysis'
        };

        if (profile.healthLogs && profile.healthLogs.length > 1) {
            trends.message = 'Trend analysis based on recent health logs';
            // Add trend analysis logic here
        }

        return trends;
    }

    identifyCriticalFindings(predictions, profile) {
        const critical = [];

        // Check for emergency conditions
        if (profile.bloodPressure) {
            if (profile.bloodPressure.systolic >= 180 || profile.bloodPressure.diastolic >= 110) {
                critical.push({
                    finding: 'Hypertensive Crisis',
                    value: `${profile.bloodPressure.systolic}/${profile.bloodPressure.diastolic} mmHg`,
                    severity: 'emergency',
                    action: 'Seek immediate emergency care'
                });
            }
        }

        // Check for very high disease risks
        Object.entries(predictions).forEach(([disease, pred]) => {
            if (pred.score >= 80) {
                critical.push({
                    finding: `Very High ${pred.disease} Risk`,
                    value: `${pred.score}% risk score`,
                    severity: 'critical',
                    action: 'Schedule urgent medical consultation'
                });
            }
        });

        return critical;
    }
}

module.exports = new AIHealthPredictionService();