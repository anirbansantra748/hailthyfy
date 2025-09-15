const User = require('../models/User');

/**
 * Advanced Health Analytics Service
 * Provides AI-powered drug interactions, health predictions, and risk assessments
 */

class HealthAnalyticsService {
    constructor() {
        // Comprehensive drug database with interactions
        this.drugDatabase = {
            'paracetamol': {
                name: 'Paracetamol',
                category: 'Analgesic',
                sideEffects: ['nausea', 'rash', 'liver_damage'],
                contraindications: ['liver_disease', 'alcohol_abuse'],
                interactions: ['warfarin', 'alcohol'],
                allergens: ['acetaminophen'],
                dosage: { min: 500, max: 4000, unit: 'mg/day' }
            },
            'aspirin': {
                name: 'Aspirin',
                category: 'NSAID',
                sideEffects: ['stomach_irritation', 'bleeding', 'tinnitus'],
                contraindications: ['peptic_ulcer', 'bleeding_disorders', 'pregnancy'],
                interactions: ['warfarin', 'metformin', 'alcohol'],
                allergens: ['salicylates'],
                dosage: { min: 75, max: 4000, unit: 'mg/day' }
            },
            'metformin': {
                name: 'Metformin',
                category: 'Antidiabetic',
                sideEffects: ['nausea', 'diarrhea', 'metallic_taste'],
                contraindications: ['kidney_disease', 'liver_disease', 'heart_failure'],
                interactions: ['aspirin', 'alcohol', 'insulin'],
                allergens: ['metformin'],
                dosage: { min: 500, max: 2000, unit: 'mg/day' }
            },
            'warfarin': {
                name: 'Warfarin',
                category: 'Anticoagulant',
                sideEffects: ['bleeding', 'bruising', 'hair_loss'],
                contraindications: ['pregnancy', 'recent_surgery', 'bleeding_disorders'],
                interactions: ['aspirin', 'paracetamol', 'alcohol'],
                allergens: ['warfarin'],
                dosage: { min: 1, max: 10, unit: 'mg/day' }
            },
            'insulin': {
                name: 'Insulin',
                category: 'Antidiabetic',
                sideEffects: ['hypoglycemia', 'weight_gain', 'injection_site_reactions'],
                contraindications: ['hypoglycemia'],
                interactions: ['metformin', 'alcohol'],
                allergens: ['human_insulin'],
                dosage: { min: 10, max: 100, unit: 'units/day' }
            },
            'lisinopril': {
                name: 'Lisinopril',
                category: 'ACE Inhibitor',
                sideEffects: ['dry_cough', 'dizziness', 'hyperkalemia'],
                contraindications: ['pregnancy', 'angioedema_history', 'kidney_disease'],
                interactions: ['potassium_supplements', 'nsaids'],
                allergens: ['ace_inhibitors'],
                dosage: { min: 5, max: 40, unit: 'mg/day' }
            },
            'atorvastatin': {
                name: 'Atorvastatin',
                category: 'Statin',
                sideEffects: ['muscle_pain', 'liver_enzyme_elevation', 'digestive_issues'],
                contraindications: ['liver_disease', 'pregnancy', 'muscle_disorders'],
                interactions: ['grapefruit', 'alcohol', 'antibiotics'],
                allergens: ['statins'],
                dosage: { min: 10, max: 80, unit: 'mg/day' }
            }
        };

        // Disease risk factors and symptoms
        this.riskFactors = {
            diabetes: {
                factors: ['family_history', 'obesity', 'age', 'sedentary_lifestyle', 'high_blood_sugar'],
                biomarkers: ['hba1c', 'fasting_glucose', 'bmi'],
                symptoms: ['excessive_thirst', 'frequent_urination', 'fatigue', 'blurred_vision']
            },
            heart_disease: {
                factors: ['high_cholesterol', 'high_blood_pressure', 'smoking', 'diabetes', 'family_history'],
                biomarkers: ['cholesterol', 'blood_pressure', 'heart_rate'],
                symptoms: ['chest_pain', 'shortness_of_breath', 'fatigue', 'swelling']
            },
            hypertension: {
                factors: ['obesity', 'high_sodium_diet', 'alcohol', 'stress', 'family_history'],
                biomarkers: ['systolic_bp', 'diastolic_bp', 'heart_rate'],
                symptoms: ['headache', 'dizziness', 'chest_pain', 'vision_problems']
            },
            obesity: {
                factors: ['sedentary_lifestyle', 'poor_diet', 'genetics', 'medications'],
                biomarkers: ['bmi', 'body_fat_percentage', 'waist_circumference'],
                symptoms: ['fatigue', 'joint_pain', 'sleep_apnea', 'depression']
            }
        };
    }

    /**
     * Check drug interactions for a list of medications
     * @param {Array} medications - List of medication names
     * @param {Object} userProfile - User's health profile
     * @returns {Object} Interaction analysis results
     */
    async checkDrugInteractions(medications, userProfile) {
        const interactions = {
            severe: [],
            moderate: [],
            mild: [],
            allergicReactions: [],
            contraindications: [],
            recommendations: []
        };

        const normalizedMeds = medications.map(med => med.toLowerCase().trim());

        // Check each medication pair for interactions
        for (let i = 0; i < normalizedMeds.length; i++) {
            for (let j = i + 1; j < normalizedMeds.length; j++) {
                const med1 = this.drugDatabase[normalizedMeds[i]];
                const med2 = this.drugDatabase[normalizedMeds[j]];

                if (med1 && med2) {
                    // Check if drugs interact with each other
                    if (med1.interactions.includes(normalizedMeds[j]) || 
                        med2.interactions.includes(normalizedMeds[i])) {
                        
                        const interaction = {
                            drug1: med1.name,
                            drug2: med2.name,
                            severity: this.calculateInteractionSeverity(med1, med2),
                            description: this.getInteractionDescription(med1, med2),
                            recommendation: this.getInteractionRecommendation(med1, med2)
                        };

                        if (interaction.severity === 'severe') {
                            interactions.severe.push(interaction);
                        } else if (interaction.severity === 'moderate') {
                            interactions.moderate.push(interaction);
                        } else {
                            interactions.mild.push(interaction);
                        }
                    }
                }
            }
        }

        // Check for allergic reactions
        if (userProfile.allergies && userProfile.allergies.length > 0) {
            normalizedMeds.forEach(medName => {
                const med = this.drugDatabase[medName];
                if (med) {
                    const allergyMatch = med.allergens.find(allergen => 
                        userProfile.allergies.some(userAllergy => 
                            userAllergy.toLowerCase().includes(allergen.toLowerCase())
                        )
                    );

                    if (allergyMatch) {
                        interactions.allergicReactions.push({
                            medication: med.name,
                            allergen: allergyMatch,
                            userAllergy: userProfile.allergies.find(a => 
                                a.toLowerCase().includes(allergyMatch.toLowerCase())
                            ),
                            severity: 'high',
                            action: 'AVOID - Consult doctor immediately'
                        });
                    }
                }
            });
        }

        // Check contraindications based on medical history
        if (userProfile.medicalHistory && userProfile.medicalHistory.length > 0) {
            normalizedMeds.forEach(medName => {
                const med = this.drugDatabase[medName];
                if (med) {
                    const contraindication = med.contraindications.find(condition => 
                        userProfile.medicalHistory.some(history => 
                            history.toLowerCase().includes(condition.toLowerCase())
                        )
                    );

                    if (contraindication) {
                        interactions.contraindications.push({
                            medication: med.name,
                            condition: contraindication,
                            userCondition: userProfile.medicalHistory.find(h => 
                                h.toLowerCase().includes(contraindication.toLowerCase())
                            ),
                            risk: 'high',
                            action: 'Consult healthcare provider before taking'
                        });
                    }
                }
            });
        }

        // Generate recommendations
        interactions.recommendations = this.generateRecommendations(interactions, userProfile);
        interactions.riskScore = this.calculateOverallRiskScore(interactions);
        interactions.summary = this.generateInteractionSummary(interactions);

        return interactions;
    }

    /**
     * Predict health risks based on user data using AI algorithms
     * @param {Object} userProfile - Complete user health profile
     * @returns {Object} Health risk predictions
     */
    async predictHealthRisks(userProfile) {
        const predictions = {
            diabetes: this.predictDiabetesRisk(userProfile),
            heartDisease: this.predictHeartDiseaseRisk(userProfile),
            hypertension: this.predictHypertensionRisk(userProfile),
            obesity: this.predictObesityRisk(userProfile),
            overallHealthScore: 0,
            recommendations: [],
            criticalAlerts: [],
            trends: this.analyzeTrends(userProfile)
        };

        // Calculate overall health score
        predictions.overallHealthScore = this.calculateOverallHealthScore(predictions);

        // Generate personalized recommendations
        predictions.recommendations = this.generateHealthRecommendations(predictions, userProfile);

        // Check for critical alerts
        predictions.criticalAlerts = this.generateCriticalAlerts(predictions, userProfile);

        return predictions;
    }

    /**
     * Predict diabetes risk using multiple factors
     */
    predictDiabetesRisk(profile) {
        let riskScore = 0;
        const factors = [];

        // BMI factor (0-30 points)
        if (profile.bmi) {
            if (profile.bmi >= 30) {
                riskScore += 30;
                factors.push({ factor: 'Obesity (BMI ≥30)', impact: 'high', points: 30 });
            } else if (profile.bmi >= 25) {
                riskScore += 20;
                factors.push({ factor: 'Overweight (BMI 25-29.9)', impact: 'moderate', points: 20 });
            } else if (profile.bmi >= 23) {
                riskScore += 10;
                factors.push({ factor: 'Slightly overweight (BMI 23-24.9)', impact: 'low', points: 10 });
            }
        }

        // Age factor (0-20 points)
        if (profile.age) {
            if (profile.age >= 65) {
                riskScore += 20;
                factors.push({ factor: 'Age ≥65 years', impact: 'high', points: 20 });
            } else if (profile.age >= 45) {
                riskScore += 15;
                factors.push({ factor: 'Age 45-64 years', impact: 'moderate', points: 15 });
            } else if (profile.age >= 35) {
                riskScore += 10;
                factors.push({ factor: 'Age 35-44 years', impact: 'low', points: 10 });
            }
        }

        // Blood sugar factors (0-25 points)
        if (profile.bloodSugar) {
            if (profile.bloodSugar.hba1c) {
                if (profile.bloodSugar.hba1c >= 6.5) {
                    riskScore += 25;
                    factors.push({ factor: 'HbA1c ≥6.5% (Diabetic range)', impact: 'critical', points: 25 });
                } else if (profile.bloodSugar.hba1c >= 5.7) {
                    riskScore += 20;
                    factors.push({ factor: 'HbA1c 5.7-6.4% (Prediabetic)', impact: 'high', points: 20 });
                }
            }

            if (profile.bloodSugar.fasting) {
                if (profile.bloodSugar.fasting >= 126) {
                    riskScore += 25;
                    factors.push({ factor: 'Fasting glucose ≥126 mg/dL', impact: 'critical', points: 25 });
                } else if (profile.bloodSugar.fasting >= 100) {
                    riskScore += 15;
                    factors.push({ factor: 'Fasting glucose 100-125 mg/dL', impact: 'moderate', points: 15 });
                }
            }
        }

        // Blood pressure factor (0-15 points)
        if (profile.bloodPressure) {
            if (profile.bloodPressure.systolic >= 140 || profile.bloodPressure.diastolic >= 90) {
                riskScore += 15;
                factors.push({ factor: 'High blood pressure', impact: 'moderate', points: 15 });
            }
        }

        // Lifestyle factors (0-20 points)
        if (profile.lifestyle) {
            if (profile.lifestyle.exerciseFrequency === 'none') {
                riskScore += 15;
                factors.push({ factor: 'No exercise', impact: 'moderate', points: 15 });
            } else if (profile.lifestyle.exerciseFrequency === 'low') {
                riskScore += 10;
                factors.push({ factor: 'Low exercise frequency', impact: 'low', points: 10 });
            }

            if (profile.lifestyle.smoking) {
                riskScore += 10;
                factors.push({ factor: 'Smoking', impact: 'moderate', points: 10 });
            }
        }

        // Family history (0-15 points)
        if (profile.familyHistory && profile.familyHistory.some(h => h.toLowerCase().includes('diabetes'))) {
            riskScore += 15;
            factors.push({ factor: 'Family history of diabetes', impact: 'moderate', points: 15 });
        }

        // Calculate percentage and risk level
        const percentage = Math.min(Math.round((riskScore / 100) * 100), 100);
        let riskLevel, color, recommendation;

        if (percentage >= 70) {
            riskLevel = 'Very High';
            color = '#dc2626';
            recommendation = 'Immediate medical consultation required. High probability of diabetes.';
        } else if (percentage >= 50) {
            riskLevel = 'High';
            color = '#ea580c';
            recommendation = 'Schedule diabetes screening within 1 month. Lifestyle changes recommended.';
        } else if (percentage >= 30) {
            riskLevel = 'Moderate';
            color = '#d97706';
            recommendation = 'Annual diabetes screening recommended. Consider lifestyle modifications.';
        } else if (percentage >= 15) {
            riskLevel = 'Low-Moderate';
            color = '#16a34a';
            recommendation = 'Maintain healthy lifestyle. Screen every 2-3 years.';
        } else {
            riskLevel = 'Low';
            color = '#059669';
            recommendation = 'Continue current healthy habits. Regular check-ups recommended.';
        }

        return {
            score: percentage,
            riskLevel,
            color,
            factors,
            recommendation,
            nextAction: this.getNextAction('diabetes', riskLevel),
            preventionTips: this.getDiabetesPreventionTips(riskLevel)
        };
    }

    /**
     * Predict heart disease risk
     */
    predictHeartDiseaseRisk(profile) {
        let riskScore = 0;
        const factors = [];

        // Age and gender factors
        if (profile.age && profile.gender) {
            if (profile.gender === 'male' && profile.age >= 45) {
                riskScore += 20;
                factors.push({ factor: 'Male, age ≥45', impact: 'high', points: 20 });
            } else if (profile.gender === 'female' && profile.age >= 55) {
                riskScore += 20;
                factors.push({ factor: 'Female, age ≥55', impact: 'high', points: 20 });
            }
        }

        // Cholesterol factors
        if (profile.cholesterol) {
            if (profile.cholesterol.total >= 240) {
                riskScore += 25;
                factors.push({ factor: 'High total cholesterol (≥240)', impact: 'high', points: 25 });
            } else if (profile.cholesterol.total >= 200) {
                riskScore += 15;
                factors.push({ factor: 'Borderline cholesterol (200-239)', impact: 'moderate', points: 15 });
            }

            if (profile.cholesterol.hdl <= 40) {
                riskScore += 20;
                factors.push({ factor: 'Low HDL cholesterol (≤40)', impact: 'high', points: 20 });
            }

            if (profile.cholesterol.ldl >= 160) {
                riskScore += 20;
                factors.push({ factor: 'High LDL cholesterol (≥160)', impact: 'high', points: 20 });
            }
        }

        // Blood pressure
        if (profile.bloodPressure) {
            if (profile.bloodPressure.systolic >= 140 || profile.bloodPressure.diastolic >= 90) {
                riskScore += 20;
                factors.push({ factor: 'High blood pressure', impact: 'high', points: 20 });
            }
        }

        // Smoking
        if (profile.lifestyle?.smoking) {
            riskScore += 25;
            factors.push({ factor: 'Current smoker', impact: 'high', points: 25 });
        }

        // Diabetes
        if (profile.bloodSugar?.hba1c >= 6.5 || profile.medicalHistory?.some(h => h.toLowerCase().includes('diabetes'))) {
            riskScore += 20;
            factors.push({ factor: 'Diabetes', impact: 'high', points: 20 });
        }

        // Family history
        if (profile.familyHistory?.some(h => h.toLowerCase().includes('heart') || h.toLowerCase().includes('cardiac'))) {
            riskScore += 15;
            factors.push({ factor: 'Family history of heart disease', impact: 'moderate', points: 15 });
        }

        // Calculate percentage and risk level
        const percentage = Math.min(Math.round((riskScore / 100) * 100), 100);
        let riskLevel, color, recommendation;

        if (percentage >= 70) {
            riskLevel = 'Very High';
            color = '#dc2626';
            recommendation = 'Urgent cardiology consultation recommended. High risk for heart disease.';
        } else if (percentage >= 50) {
            riskLevel = 'High';
            color = '#ea580c';
            recommendation = 'Cardiology screening within 3 months. Aggressive lifestyle changes needed.';
        } else if (percentage >= 30) {
            riskLevel = 'Moderate';
            color = '#d97706';
            recommendation = 'Annual cardiac screening. Focus on diet and exercise.';
        } else if (percentage >= 15) {
            riskLevel = 'Low-Moderate';
            color = '#16a34a';
            recommendation = 'Maintain heart-healthy lifestyle. Screen every 2 years.';
        } else {
            riskLevel = 'Low';
            color = '#059669';
            recommendation = 'Excellent! Continue current healthy habits.';
        }

        return {
            score: percentage,
            riskLevel,
            color,
            factors,
            recommendation,
            nextAction: this.getNextAction('heart_disease', riskLevel),
            preventionTips: this.getHeartDiseasePreventionTips(riskLevel)
        };
    }

    /**
     * Predict hypertension risk
     */
    predictHypertensionRisk(profile) {
        let riskScore = 0;
        const factors = [];

        // Current blood pressure
        if (profile.bloodPressure) {
            const systolic = profile.bloodPressure.systolic;
            const diastolic = profile.bloodPressure.diastolic;

            if (systolic >= 140 || diastolic >= 90) {
                riskScore += 30;
                factors.push({ factor: 'Current hypertension', impact: 'critical', points: 30 });
            } else if (systolic >= 130 || diastolic >= 80) {
                riskScore += 20;
                factors.push({ factor: 'Stage 1 hypertension', impact: 'high', points: 20 });
            } else if (systolic >= 120 || diastolic >= 80) {
                riskScore += 10;
                factors.push({ factor: 'Elevated blood pressure', impact: 'moderate', points: 10 });
            }
        }

        // Age factor
        if (profile.age >= 65) {
            riskScore += 20;
            factors.push({ factor: 'Age ≥65 years', impact: 'high', points: 20 });
        } else if (profile.age >= 45) {
            riskScore += 10;
            factors.push({ factor: 'Age 45-64 years', impact: 'moderate', points: 10 });
        }

        // BMI
        if (profile.bmi >= 30) {
            riskScore += 15;
            factors.push({ factor: 'Obesity (BMI ≥30)', impact: 'moderate', points: 15 });
        } else if (profile.bmi >= 25) {
            riskScore += 10;
            factors.push({ factor: 'Overweight (BMI 25-29.9)', impact: 'low', points: 10 });
        }

        // Lifestyle factors
        if (profile.lifestyle) {
            if (profile.lifestyle.smoking) {
                riskScore += 15;
                factors.push({ factor: 'Smoking', impact: 'moderate', points: 15 });
            }

            if (profile.lifestyle.alcohol) {
                riskScore += 10;
                factors.push({ factor: 'Regular alcohol consumption', impact: 'low', points: 10 });
            }

            if (profile.lifestyle.exerciseFrequency === 'none') {
                riskScore += 15;
                factors.push({ factor: 'No regular exercise', impact: 'moderate', points: 15 });
            }

            if (profile.lifestyle.stressLevel >= 7) {
                riskScore += 10;
                factors.push({ factor: 'High stress level', impact: 'moderate', points: 10 });
            }
        }

        // Family history
        if (profile.familyHistory?.some(h => h.toLowerCase().includes('hypertension') || h.toLowerCase().includes('blood pressure'))) {
            riskScore += 15;
            factors.push({ factor: 'Family history of hypertension', impact: 'moderate', points: 15 });
        }

        const percentage = Math.min(Math.round((riskScore / 100) * 100), 100);
        let riskLevel, color, recommendation;

        if (percentage >= 70) {
            riskLevel = 'Very High';
            color = '#dc2626';
            recommendation = 'Immediate medical attention required. Blood pressure management needed.';
        } else if (percentage >= 50) {
            riskLevel = 'High';
            color = '#ea580c';
            recommendation = 'Monitor blood pressure regularly. Consider medication consultation.';
        } else if (percentage >= 30) {
            riskLevel = 'Moderate';
            color = '#d97706';
            recommendation = 'Lifestyle modifications recommended. Monitor blood pressure monthly.';
        } else {
            riskLevel = 'Low';
            color = '#059669';
            recommendation = 'Maintain current healthy lifestyle. Annual check-ups sufficient.';
        }

        return {
            score: percentage,
            riskLevel,
            color,
            factors,
            recommendation,
            nextAction: this.getNextAction('hypertension', riskLevel),
            preventionTips: this.getHypertensionPreventionTips(riskLevel)
        };
    }

    /**
     * Predict obesity risk
     */
    predictObesityRisk(profile) {
        let riskScore = 0;
        const factors = [];

        // Current BMI
        if (profile.bmi) {
            if (profile.bmi >= 30) {
                riskScore += 40;
                factors.push({ factor: 'Currently obese (BMI ≥30)', impact: 'critical', points: 40 });
            } else if (profile.bmi >= 25) {
                riskScore += 25;
                factors.push({ factor: 'Currently overweight (BMI 25-29.9)', impact: 'high', points: 25 });
            } else if (profile.bmi >= 23) {
                riskScore += 15;
                factors.push({ factor: 'Upper normal BMI (23-24.9)', impact: 'moderate', points: 15 });
            }
        }

        // Lifestyle factors
        if (profile.lifestyle) {
            if (profile.lifestyle.exerciseFrequency === 'none') {
                riskScore += 20;
                factors.push({ factor: 'No regular exercise', impact: 'high', points: 20 });
            } else if (profile.lifestyle.exerciseFrequency === 'low') {
                riskScore += 10;
                factors.push({ factor: 'Low exercise frequency', impact: 'moderate', points: 10 });
            }

            if (profile.lifestyle.sleepHours < 6) {
                riskScore += 15;
                factors.push({ factor: 'Insufficient sleep (<6 hours)', impact: 'moderate', points: 15 });
            }

            if (profile.lifestyle.stressLevel >= 7) {
                riskScore += 10;
                factors.push({ factor: 'High stress level', impact: 'moderate', points: 10 });
            }
        }

        // Age factor
        if (profile.age >= 40) {
            riskScore += 10;
            factors.push({ factor: 'Age-related metabolism slowdown', impact: 'low', points: 10 });
        }

        const percentage = Math.min(Math.round((riskScore / 100) * 100), 100);
        let riskLevel, color, recommendation;

        if (percentage >= 70) {
            riskLevel = 'Very High';
            color = '#dc2626';
            recommendation = 'Immediate lifestyle intervention required. Consider professional help.';
        } else if (percentage >= 50) {
            riskLevel = 'High';
            color = '#ea580c';
            recommendation = 'Significant lifestyle changes needed. Focus on diet and exercise.';
        } else if (percentage >= 30) {
            riskLevel = 'Moderate';
            color = '#d97706';
            recommendation = 'Preventive measures recommended. Maintain healthy habits.';
        } else {
            riskLevel = 'Low';
            color = '#059669';
            recommendation = 'Excellent! Continue maintaining healthy weight.';
        }

        return {
            score: percentage,
            riskLevel,
            color,
            factors,
            recommendation,
            nextAction: this.getNextAction('obesity', riskLevel),
            preventionTips: this.getObesityPreventionTips(riskLevel)
        };
    }

    // Helper methods
    calculateInteractionSeverity(drug1, drug2) {
        // Simple algorithm - in real world, this would be much more complex
        const criticalPairs = [
            ['warfarin', 'aspirin'],
            ['insulin', 'alcohol'],
            ['metformin', 'alcohol']
        ];

        const drugPair = [drug1.name.toLowerCase(), drug2.name.toLowerCase()].sort();
        
        for (const criticalPair of criticalPairs) {
            if (JSON.stringify(criticalPair.sort()) === JSON.stringify(drugPair)) {
                return 'severe';
            }
        }

        return drug1.category === drug2.category ? 'moderate' : 'mild';
    }

    getInteractionDescription(drug1, drug2) {
        return `${drug1.name} and ${drug2.name} may interact, potentially affecting their effectiveness or increasing side effects.`;
    }

    getInteractionRecommendation(drug1, drug2) {
        return `Consult your healthcare provider about timing and dosage adjustments for ${drug1.name} and ${drug2.name}.`;
    }

    generateRecommendations(interactions, userProfile) {
        const recommendations = [];

        if (interactions.severe.length > 0) {
            recommendations.push({
                type: 'critical',
                message: 'URGENT: Severe drug interactions detected. Contact your doctor immediately.',
                action: 'immediate_consultation'
            });
        }

        if (interactions.allergicReactions.length > 0) {
            recommendations.push({
                type: 'warning',
                message: 'Allergic reactions possible. Avoid these medications and seek alternatives.',
                action: 'avoid_medication'
            });
        }

        if (interactions.moderate.length > 0) {
            recommendations.push({
                type: 'caution',
                message: 'Moderate interactions detected. Monitor for side effects and consult your pharmacist.',
                action: 'monitor_effects'
            });
        }

        return recommendations;
    }

    calculateOverallRiskScore(interactions) {
        let score = 0;
        score += interactions.severe.length * 10;
        score += interactions.allergicReactions.length * 8;
        score += interactions.contraindications.length * 6;
        score += interactions.moderate.length * 4;
        score += interactions.mild.length * 2;

        return Math.min(score, 100);
    }

    generateInteractionSummary(interactions) {
        const total = interactions.severe.length + interactions.moderate.length + interactions.mild.length;
        
        if (total === 0 && interactions.allergicReactions.length === 0 && interactions.contraindications.length === 0) {
            return {
                status: 'safe',
                message: 'No significant interactions detected. Your medications appear to be safe together.',
                color: '#059669'
            };
        }

        if (interactions.severe.length > 0 || interactions.allergicReactions.length > 0) {
            return {
                status: 'critical',
                message: `${interactions.severe.length + interactions.allergicReactions.length} critical interactions detected. Immediate medical consultation required.`,
                color: '#dc2626'
            };
        }

        if (interactions.moderate.length > 0 || interactions.contraindications.length > 0) {
            return {
                status: 'caution',
                message: `${interactions.moderate.length + interactions.contraindications.length} moderate interactions detected. Monitor closely and consult healthcare provider.`,
                color: '#ea580c'
            };
        }

        return {
            status: 'mild',
            message: `${interactions.mild.length} mild interactions detected. Generally safe but monitor for any unusual effects.`,
            color: '#d97706'
        };
    }

    calculateOverallHealthScore(predictions) {
        const weights = { diabetes: 0.25, heartDisease: 0.30, hypertension: 0.25, obesity: 0.20 };
        let totalScore = 0;

        totalScore += (100 - predictions.diabetes.score) * weights.diabetes;
        totalScore += (100 - predictions.heartDisease.score) * weights.heartDisease;
        totalScore += (100 - predictions.hypertension.score) * weights.hypertension;
        totalScore += (100 - predictions.obesity.score) * weights.obesity;

        return Math.round(totalScore);
    }

    generateHealthRecommendations(predictions, profile) {
        const recommendations = [];

        // Critical recommendations based on highest risk
        const risks = [
            { type: 'diabetes', data: predictions.diabetes },
            { type: 'heartDisease', data: predictions.heartDisease },
            { type: 'hypertension', data: predictions.hypertension },
            { type: 'obesity', data: predictions.obesity }
        ].sort((a, b) => b.data.score - a.data.score);

        // Top 3 recommendations
        risks.slice(0, 3).forEach(risk => {
            if (risk.data.score >= 30) {
                recommendations.push({
                    category: risk.type,
                    priority: risk.data.score >= 70 ? 'critical' : risk.data.score >= 50 ? 'high' : 'moderate',
                    title: `${risk.type.charAt(0).toUpperCase() + risk.type.slice(1)} Risk Management`,
                    description: risk.data.recommendation,
                    actions: risk.data.preventionTips.slice(0, 3)
                });
            }
        });

        return recommendations;
    }

    generateCriticalAlerts(predictions, profile) {
        const alerts = [];

        Object.entries(predictions).forEach(([condition, data]) => {
            if (data.score >= 70) {
                alerts.push({
                    condition,
                    severity: 'critical',
                    message: `Very high risk for ${condition}. Immediate medical consultation recommended.`,
                    action: 'Schedule appointment within 48 hours',
                    color: '#dc2626'
                });
            }
        });

        // Check for critical vitals
        if (profile.bloodPressure) {
            if (profile.bloodPressure.systolic >= 180 || profile.bloodPressure.diastolic >= 120) {
                alerts.push({
                    condition: 'Hypertensive Crisis',
                    severity: 'emergency',
                    message: 'Blood pressure is dangerously high. Seek emergency medical care immediately.',
                    action: 'Emergency room visit required',
                    color: '#dc2626'
                });
            }
        }

        if (profile.bloodSugar?.fasting >= 400) {
            alerts.push({
                condition: 'Severe Hyperglycemia',
                severity: 'emergency',
                message: 'Extremely high blood sugar levels. Emergency medical attention required.',
                action: 'Emergency room visit required',
                color: '#dc2626'
            });
        }

        return alerts;
    }

    analyzeTrends(profile) {
        const trends = {
            weight: { trend: 'stable', change: 0, period: '3 months' },
            bloodPressure: { trend: 'stable', change: 0, period: '3 months' },
            bloodSugar: { trend: 'stable', change: 0, period: '3 months' },
            summary: 'Insufficient historical data for trend analysis'
        };

        if (profile.healthLogs && profile.healthLogs.length >= 3) {
            const recent = profile.healthLogs.slice(-3);
            const oldest = recent[0];
            const newest = recent[recent.length - 1];

            // Weight trend
            if (oldest.weight && newest.weight) {
                const weightChange = newest.weight - oldest.weight;
                trends.weight = {
                    trend: weightChange > 2 ? 'increasing' : weightChange < -2 ? 'decreasing' : 'stable',
                    change: Math.round(weightChange * 10) / 10,
                    period: '3 months'
                };
            }

            // Blood pressure trend
            if (oldest.bloodPressure && newest.bloodPressure) {
                const bpChange = (newest.bloodPressure.systolic + newest.bloodPressure.diastolic) - 
                                (oldest.bloodPressure.systolic + oldest.bloodPressure.diastolic);
                trends.bloodPressure = {
                    trend: bpChange > 10 ? 'increasing' : bpChange < -10 ? 'decreasing' : 'stable',
                    change: Math.round(bpChange),
                    period: '3 months'
                };
            }

            trends.summary = 'Trends calculated from recent health logs';
        }

        return trends;
    }

    // Prevention tips methods
    getDiabetesPreventionTips(riskLevel) {
        const tips = {
            'Very High': [
                'Monitor blood sugar levels daily',
                'Follow a strict diabetic diet plan',
                'Take prescribed medications as directed',
                'Exercise for 30 minutes daily (with doctor approval)',
                'Attend regular endocrinologist appointments'
            ],
            'High': [
                'Reduce refined sugar and carbohydrate intake',
                'Increase fiber-rich foods in your diet',
                'Exercise at least 150 minutes per week',
                'Monitor blood sugar weekly',
                'Maintain a healthy weight'
            ],
            'Moderate': [
                'Choose whole grains over refined grains',
                'Include more vegetables and lean proteins',
                'Stay physically active most days',
                'Monitor portion sizes',
                'Get regular health check-ups'
            ],
            'Low': [
                'Maintain a balanced, healthy diet',
                'Stay active with regular exercise',
                'Maintain a healthy weight',
                'Get annual health screenings'
            ]
        };

        return tips[riskLevel] || tips['Low'];
    }

    getHeartDiseasePreventionTips(riskLevel) {
        const tips = {
            'Very High': [
                'Take prescribed heart medications as directed',
                'Follow a cardiac diet (low sodium, low saturated fat)',
                'Monitor blood pressure and heart rate daily',
                'Participate in cardiac rehabilitation if recommended',
                'Attend regular cardiology appointments'
            ],
            'High': [
                'Reduce sodium intake to less than 2300mg daily',
                'Include omega-3 rich foods (fish, nuts)',
                'Exercise as approved by your doctor',
                'Quit smoking immediately if you smoke',
                'Manage stress through relaxation techniques'
            ],
            'Moderate': [
                'Eat a heart-healthy diet rich in fruits and vegetables',
                'Exercise regularly (aim for 150 minutes/week)',
                'Maintain a healthy weight',
                'Limit alcohol consumption',
                'Don\'t smoke'
            ],
            'Low': [
                'Continue heart-healthy eating habits',
                'Stay physically active',
                'Manage stress effectively',
                'Get regular health screenings'
            ]
        };

        return tips[riskLevel] || tips['Low'];
    }

    getHypertensionPreventionTips(riskLevel) {
        const tips = {
            'Very High': [
                'Take blood pressure medications as prescribed',
                'Monitor blood pressure daily',
                'Follow DASH diet strictly',
                'Limit sodium to 1500mg daily',
                'Attend regular medical check-ups'
            ],
            'High': [
                'Reduce sodium intake significantly',
                'Increase potassium-rich foods',
                'Exercise regularly (with medical clearance)',
                'Manage stress through relaxation techniques',
                'Limit alcohol consumption'
            ],
            'Moderate': [
                'Follow a low-sodium diet',
                'Include more fruits and vegetables',
                'Stay physically active',
                'Maintain a healthy weight',
                'Practice stress management'
            ],
            'Low': [
                'Maintain healthy eating habits',
                'Stay active and exercise regularly',
                'Manage stress effectively',
                'Get regular blood pressure checks'
            ]
        };

        return tips[riskLevel] || tips['Low'];
    }

    getObesityPreventionTips(riskLevel) {
        const tips = {
            'Very High': [
                'Work with a registered dietitian',
                'Consider medically supervised weight loss program',
                'Track calories and food intake daily',
                'Exercise as recommended by healthcare provider',
                'Address any underlying medical conditions'
            ],
            'High': [
                'Create a structured meal plan',
                'Increase physical activity gradually',
                'Track your weight weekly',
                'Reduce portion sizes',
                'Avoid processed and high-calorie foods'
            ],
            'Moderate': [
                'Eat balanced, nutritious meals',
                'Stay active with regular exercise',
                'Monitor your weight monthly',
                'Choose healthy snacks',
                'Stay hydrated'
            ],
            'Low': [
                'Maintain current healthy habits',
                'Continue regular physical activity',
                'Eat a balanced diet',
                'Monitor weight occasionally'
            ]
        };

        return tips[riskLevel] || tips['Low'];
    }

    getNextAction(condition, riskLevel) {
        const actions = {
            diabetes: {
                'Very High': 'Schedule endocrinologist appointment within 1 week',
                'High': 'Schedule diabetes screening within 1 month',
                'Moderate': 'Annual diabetes screening recommended',
                'Low': 'Continue healthy lifestyle, screen every 3 years'
            },
            heart_disease: {
                'Very High': 'Urgent cardiology consultation required',
                'High': 'Schedule cardiac screening within 3 months',
                'Moderate': 'Annual cardiac check-up recommended',
                'Low': 'Continue heart-healthy habits, screen every 2 years'
            },
            hypertension: {
                'Very High': 'Immediate blood pressure management required',
                'High': 'Weekly blood pressure monitoring',
                'Moderate': 'Monthly blood pressure checks',
                'Low': 'Annual blood pressure screening'
            },
            obesity: {
                'Very High': 'Consult healthcare provider for weight management plan',
                'High': 'Create structured weight loss plan',
                'Moderate': 'Focus on maintaining current weight',
                'Low': 'Continue healthy weight maintenance'
            }
        };

        return actions[condition]?.[riskLevel] || 'Continue healthy lifestyle habits';
    }

    /**
     * Process Patient Journey Analytics
     * @param {Object} filters - Filter parameters for journey analysis
     * @returns {Object} Patient journey metrics and visualization data
     */
    async processPatientJourneyAnalytics(filters = {}) {
        try {
            const { timeRange = 90, condition, patientId } = filters;
            
            // In a real application, this would query the database
            let baseQuery = {
                createdAt: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
            };
            
            if (condition) {
                baseQuery['medicalHistory'] = { $in: [new RegExp(condition, 'i')] };
            }
            
            if (patientId) {
                baseQuery['_id'] = patientId;
            }

            // Simulate patient journey stages with realistic data
            const totalPatients = await User.countDocuments(baseQuery) || 1000;
            
            const journeyStages = [
                { 
                    stage: 'Registration', 
                    patients: totalPatients, 
                    avgTime: 1,
                    description: 'Patient registration and initial data collection'
                },
                { 
                    stage: 'Initial Consultation', 
                    patients: Math.floor(totalPatients * 0.92), 
                    avgTime: 2,
                    description: 'First consultation with healthcare provider'
                },
                { 
                    stage: 'Diagnosis', 
                    patients: Math.floor(totalPatients * 0.85), 
                    avgTime: 5,
                    description: 'Medical diagnosis and assessment'
                },
                { 
                    stage: 'Treatment Planning', 
                    patients: Math.floor(totalPatients * 0.78), 
                    avgTime: 3,
                    description: 'Development of treatment plan'
                },
                { 
                    stage: 'Treatment', 
                    patients: Math.floor(totalPatients * 0.72), 
                    avgTime: 21,
                    description: 'Active treatment phase'
                },
                { 
                    stage: 'Follow-up', 
                    patients: Math.floor(totalPatients * 0.68), 
                    avgTime: 14,
                    description: 'Post-treatment monitoring'
                },
                { 
                    stage: 'Recovery/Maintenance', 
                    patients: Math.floor(totalPatients * 0.62), 
                    avgTime: 30,
                    description: 'Recovery and long-term maintenance'
                }
            ];

            const dropoffPoints = this.calculateDropoffPoints(journeyStages);
            const pathAnalysis = this.analyzeCommonPaths(journeyStages);
            
            return {
                journeyStages,
                dropoffPoints,
                pathAnalysis,
                metrics: {
                    totalPatients,
                    completionRate: Math.round((journeyStages[journeyStages.length - 1].patients / totalPatients) * 100),
                    avgJourneyTime: this.calculateAverageJourneyTime(journeyStages),
                    criticalDropoffs: dropoffPoints.filter(p => p.dropoffRate > 15)
                },
                filters
            };
            
        } catch (error) {
            console.error('Error processing patient journey analytics:', error);
            throw error;
        }
    }

    /**
     * Process Medical Trends Analytics
     * @param {Object} filters - Filter parameters for trends analysis
     * @returns {Object} Medical trends data and insights
     */
    async processMedicalTrendsAnalytics(filters = {}) {
        try {
            const { timeRange = 90, metric = 'consultations', department } = filters;
            
            // Generate time series data for various medical metrics
            const trendsData = {
                consultationVolume: this.generateConsultationTrends(timeRange),
                diseasePrevalence: this.generateDiseasePrevalenceTrends(timeRange),
                treatmentOutcomes: this.generateTreatmentOutcomeTrends(timeRange),
                medicationUsage: this.generateMedicationUsageTrends(timeRange),
                seasonalPatterns: this.identifySeasonalPatterns(timeRange),
                emergingTrends: this.identifyEmergingTrends(timeRange)
            };
            
            // Department-specific data if requested
            if (department) {
                trendsData.departmentSpecific = this.generateDepartmentTrends(department, timeRange);
            }
            
            return {
                ...trendsData,
                insights: this.generateTrendsInsights(trendsData),
                predictions: this.generateTrendsPredictions(trendsData),
                filters
            };
            
        } catch (error) {
            console.error('Error processing medical trends analytics:', error);
            throw error;
        }
    }

    /**
     * Process Doctor Performance Analytics
     * @param {Object} filters - Filter parameters for performance analysis
     * @returns {Object} Doctor performance metrics and comparisons
     */
    async processDoctorPerformanceAnalytics(filters = {}) {
        try {
            const { timeRange = 30, doctorId, department, metric } = filters;
            
            // Get doctor data (in real app, from database)
            const doctors = await this.getDoctorPerformanceData(timeRange, doctorId, department);
            
            const performanceMetrics = {
                patientSatisfaction: this.calculateSatisfactionMetrics(doctors),
                responseTimeAnalysis: this.analyzeResponseTimes(doctors),
                treatmentSuccessRates: this.calculateSuccessRates(doctors),
                workloadAnalysis: this.analyzeWorkloadDistribution(doctors),
                performanceRankings: this.generatePerformanceRankings(doctors),
                improvementAreas: this.identifyImprovementAreas(doctors)
            };
            
            return {
                doctors,
                performanceMetrics,
                benchmarks: this.generatePerformanceBenchmarks(doctors),
                recommendations: this.generatePerformanceRecommendations(performanceMetrics),
                trends: this.analyzePerformanceTrends(doctors, timeRange),
                filters
            };
            
        } catch (error) {
            console.error('Error processing doctor performance analytics:', error);
            throw error;
        }
    }

    // Helper methods for analytics processing
    calculateDropoffPoints(stages) {
        const dropoffs = [];
        
        for (let i = 1; i < stages.length; i++) {
            const current = stages[i];
            const previous = stages[i - 1];
            const dropoffCount = previous.patients - current.patients;
            const dropoffRate = Math.round((dropoffCount / previous.patients) * 100);
            
            dropoffs.push({
                from: previous.stage,
                to: current.stage,
                dropoffCount,
                dropoffRate,
                severity: dropoffRate > 20 ? 'high' : dropoffRate > 10 ? 'medium' : 'low'
            });
        }
        
        return dropoffs;
    }

    analyzeCommonPaths(stages) {
        // Simulate common patient paths
        return [
            {
                path: stages.slice(0, -1).map(s => s.stage).join(' → '),
                percentage: 45,
                avgTime: stages.reduce((sum, s) => sum + s.avgTime, 0),
                successRate: 78
            },
            {
                path: 'Registration → Consultation → Diagnosis → Treatment',
                percentage: 28,
                avgTime: 31,
                successRate: 82
            },
            {
                path: 'Emergency → Diagnosis → Treatment → Follow-up',
                percentage: 15,
                avgTime: 25,
                successRate: 85
            }
        ];
    }

    calculateAverageJourneyTime(stages) {
        const totalTime = stages.reduce((sum, stage) => sum + stage.avgTime, 0);
        return `${totalTime} days`;
    }

    generateConsultationTrends(timeRange) {
        return this.generateTimeSeriesData(timeRange, 15, 85, 'consultations');
    }

    generateDiseasePrevalenceTrends(timeRange) {
        return {
            'Diabetes': this.generateTimeSeriesData(timeRange, 20, 35, 'cases'),
            'Hypertension': this.generateTimeSeriesData(timeRange, 25, 45, 'cases'),
            'Heart Disease': this.generateTimeSeriesData(timeRange, 15, 30, 'cases'),
            'Respiratory Issues': this.generateTimeSeriesData(timeRange, 10, 25, 'cases')
        };
    }

    generateTreatmentOutcomeTrends(timeRange) {
        return {
            'Success Rate': this.generateTimeSeriesData(timeRange, 75, 95, 'percentage'),
            'Readmission Rate': this.generateTimeSeriesData(timeRange, 5, 15, 'percentage'),
            'Patient Satisfaction': this.generateTimeSeriesData(timeRange, 4.0, 4.8, 'rating')
        };
    }

    generateMedicationUsageTrends(timeRange) {
        return {
            'Prescribed': this.generateTimeSeriesData(Math.min(timeRange, 30), 200, 400, 'prescriptions'),
            'Adherence Rate': this.generateTimeSeriesData(Math.min(timeRange, 30), 70, 90, 'percentage'),
            'Interactions Detected': this.generateTimeSeriesData(Math.min(timeRange, 30), 5, 20, 'interactions')
        };
    }

    identifySeasonalPatterns(timeRange) {
        if (timeRange < 90) return null;
        
        return {
            'Respiratory Issues': {
                peak: 'Winter',
                increase: '45%',
                reason: 'Cold and flu season'
            },
            'Allergies': {
                peak: 'Spring',
                increase: '60%',
                reason: 'Pollen and allergens'
            },
            'Heart Attacks': {
                peak: 'Winter',
                increase: '25%',
                reason: 'Cold weather and holiday stress'
            }
        };
    }

    identifyEmergingTrends(timeRange) {
        return [
            {
                trend: 'Mental Health Consultations',
                change: '+32%',
                period: `Last ${Math.min(timeRange, 60)} days`,
                significance: 'high'
            },
            {
                trend: 'Telemedicine Adoption',
                change: '+78%',
                period: `Last ${Math.min(timeRange, 90)} days`,
                significance: 'high'
            },
            {
                trend: 'Preventive Care Visits',
                change: '+15%',
                period: `Last ${Math.min(timeRange, 30)} days`,
                significance: 'medium'
            }
        ];
    }

    generateTimeSeriesData(days, min, max, label = 'value') {
        const data = [];
        const now = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add realistic variation with trends
            const baseValue = Math.floor(Math.random() * (max - min + 1)) + min;
            const seasonalVariation = Math.sin((days - i) / days * Math.PI * 2) * (max - min) * 0.1;
            const trendVariation = ((days - i) / days) * (max - min) * 0.05; // Slight upward trend
            
            const value = Math.max(min, Math.min(max, 
                Math.floor(baseValue + seasonalVariation + trendVariation)
            ));
            
            data.push({
                date: date.toISOString().split('T')[0],
                value: label === 'rating' ? +(value / 10).toFixed(1) : value,
                label
            });
        }
        
        return data;
    }

    async getDoctorPerformanceData(timeRange, doctorId, department) {
        // In real implementation, this would query the doctors collection
        const sampleDoctors = [
            { 
                id: 1, 
                name: 'Dr. Sarah Johnson', 
                specialty: 'Cardiology',
                department: 'Cardiology',
                rating: 4.8, 
                patients: 145, 
                consultations: 89,
                avgResponseTime: 12,
                successRate: 92
            },
            { 
                id: 2, 
                name: 'Dr. Michael Chen', 
                specialty: 'Internal Medicine',
                department: 'Internal Medicine',
                rating: 4.6, 
                patients: 189, 
                consultations: 134,
                avgResponseTime: 15,
                successRate: 88
            },
            { 
                id: 3, 
                name: 'Dr. Emily Rodriguez', 
                specialty: 'Pediatrics',
                department: 'Pediatrics',
                rating: 4.9, 
                patients: 203, 
                consultations: 156,
                avgResponseTime: 10,
                successRate: 94
            }
        ];
        
        let filteredDoctors = sampleDoctors;
        
        if (doctorId) {
            filteredDoctors = sampleDoctors.filter(d => d.id == doctorId);
        }
        
        if (department) {
            filteredDoctors = filteredDoctors.filter(d => 
                d.department.toLowerCase().includes(department.toLowerCase())
            );
        }
        
        return filteredDoctors;
    }

    calculateSatisfactionMetrics(doctors) {
        const ratings = doctors.map(d => d.rating);
        return {
            average: +(ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1),
            highest: Math.max(...ratings),
            lowest: Math.min(...ratings),
            distribution: this.calculateRatingDistribution(ratings)
        };
    }

    calculateRatingDistribution(ratings) {
        const distribution = { '5.0': 0, '4.5-4.9': 0, '4.0-4.4': 0, '<4.0': 0 };
        
        ratings.forEach(rating => {
            if (rating >= 5.0) distribution['5.0']++;
            else if (rating >= 4.5) distribution['4.5-4.9']++;
            else if (rating >= 4.0) distribution['4.0-4.4']++;
            else distribution['<4.0']++;
        });
        
        return distribution;
    }

    analyzeResponseTimes(doctors) {
        const times = doctors.map(d => d.avgResponseTime);
        return {
            average: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
            fastest: Math.min(...times),
            slowest: Math.max(...times),
            within15min: times.filter(t => t <= 15).length,
            beyond30min: times.filter(t => t > 30).length
        };
    }

    calculateSuccessRates(doctors) {
        const rates = doctors.map(d => d.successRate);
        return {
            average: Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length),
            highest: Math.max(...rates),
            lowest: Math.min(...rates),
            above90: rates.filter(r => r >= 90).length,
            below80: rates.filter(r => r < 80).length
        };
    }

    generateTrendsInsights(trendsData) {
        return [
            {
                insight: 'Mental health consultations showing significant increase',
                impact: 'high',
                recommendation: 'Consider expanding mental health services'
            },
            {
                insight: 'Treatment success rates improving across all departments',
                impact: 'positive',
                recommendation: 'Continue current quality improvement initiatives'
            },
            {
                insight: 'Seasonal pattern detected in respiratory conditions',
                impact: 'medium',
                recommendation: 'Prepare additional resources for winter season'
            }
        ];
    }

    generatePerformanceRecommendations(metrics) {
        return [
            {
                area: 'Response Time',
                current: `${metrics.responseTimeAnalysis.average} min average`,
                target: '< 15 min',
                recommendation: 'Implement automated triage system'
            },
            {
                area: 'Patient Satisfaction',
                current: `${metrics.patientSatisfaction.average}/5.0`,
                target: '> 4.5/5.0',
                recommendation: 'Focus on communication training for lower-rated doctors'
            }
        ];
    }
}

module.exports = new HealthAnalyticsService();
