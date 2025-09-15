const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// 🤖 REVOLUTIONARY AI HEALTH ASSISTANT SERVICE
class HealthAIService {
    constructor() {
        console.log('🤖 [AI SERVICE] Initializing HealthAI Service...');
        
        // Check API key
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('🔑 [AI SERVICE] API Key status:', apiKey ? 
            (apiKey === 'demo-key' ? 'DEMO KEY (Invalid)' : `VALID (${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length-4)})`) : 
            'MISSING'
        );
        
        // Initialize Gemini AI (Free tier)
        this.genAI = new GoogleGenerativeAI(apiKey || 'demo-key');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        console.log('✅ [AI SERVICE] Gemini AI initialized with model: gemini-1.5-flash');
        
        // Health-focused system prompts
        this.systemPrompts = {
            english: `You are HealthyAI, a friendly medical assistant. Be CONCISE and CLEAR.
            
            RESPONSE RULES:
            - Keep responses SHORT (2-4 sentences max)
            - Use SIMPLE language, no medical jargon
            - Be helpful but not overwhelming
            - Add one relevant emoji per response 😊
            - If serious symptoms: recommend seeing doctor immediately
            
            User Context: {userInfo}
            
            Respond briefly and helpfully.`,
            
            hindi: `आप HealthyAI हैं, एक मित्रवत चिकित्सा सहायक। संक्षिप्त और स्पष्ट रहें।
            
            नियम:
            - बहुत छोटे उत्तर दें (2-4 वाक्य)
            - सरल भाषा का उपयोग करें
            - सहायक लेकिन बहुत विस्तृत नहीं
            - गंभीर लक्षणों के लिए: डॉक्टर से मिलने की सलाह दें
            
            उपयोगकर्ता संदर्भ: {userInfo}
            
            संक्षिप्त और सहायक उत्तर दें।`
        };
    }

    /**
     * Detect language from user message
     */
    detectLanguage(message) {
        // Simple language detection
        const hindiPattern = /[\u0900-\u097F]/;
        return hindiPattern.test(message) ? 'hindi' : 'english';
    }

    /**
     * Create personalized system prompt with user info
     */
    createPersonalizedPrompt(userInfo, language = 'english') {
        const basePrompt = this.systemPrompts[language];
        const userContext = this.formatUserContext(userInfo, language);
        return basePrompt.replace('{userInfo}', userContext);
    }

    /**
     * Format user context for AI
     */
    formatUserContext(userInfo, language) {
        if (!userInfo) return 'No user information available';
        
        const info = [];
        
        if (userInfo.name) {
            info.push(language === 'hindi' ? 
                `नाम: ${userInfo.name}` : 
                `Name: ${userInfo.name}`
            );
        }
        
        if (userInfo.age) {
            info.push(language === 'hindi' ? 
                `उम्र: ${userInfo.age} साल` : 
                `Age: ${userInfo.age} years`
            );
        }
        
        if (userInfo.gender) {
            info.push(language === 'hindi' ? 
                `लिंग: ${userInfo.gender}` : 
                `Gender: ${userInfo.gender}`
            );
        }
        
        if (userInfo.medicalHistory && userInfo.medicalHistory.length > 0) {
            info.push(language === 'hindi' ? 
                `चिकित्सा इतिहास: ${userInfo.medicalHistory.join(', ')}` : 
                `Medical History: ${userInfo.medicalHistory.join(', ')}`
            );
        }
        
        return info.join(', ') || (language === 'hindi' ? 
            'कोई उपयोगकर्ता जानकारी उपलब्ध नहीं' : 
            'No user information available'
        );
    }

    /**
     * Generate AI health response (with image analysis support)
     */
    async generateHealthResponse(userMessage, userInfo = null, conversationHistory = [], imageData = null) {
        console.log('\n💬 [AI SERVICE] ================== GENERATE RESPONSE ==================');
        console.log('📝 [AI SERVICE] Processing message:', userMessage);
        console.log('👥 [AI SERVICE] User info provided:', userInfo ? 'Yes' : 'No');
        console.log('📚 [AI SERVICE] Conversation history items:', conversationHistory.length);
        console.log('🖼️ [AI SERVICE] Image data provided:', imageData ? `Yes (${imageData.length} images)` : 'No');
        
        try {
            // Detect language
            const language = this.detectLanguage(userMessage);
            console.log('🌍 [AI SERVICE] Detected language:', language);
            
            // Create personalized prompt
            const systemPrompt = this.createPersonalizedPrompt(userInfo, language);
            console.log('📋 [AI SERVICE] System prompt created (length):', systemPrompt.length);
            
            // Build conversation context
            const conversationContext = this.buildConversationContext(
                conversationHistory, 
                userMessage, 
                systemPrompt, 
                language
            );
            console.log('💬 [AI SERVICE] Conversation context built (length):', conversationContext.length);
            console.log('📝 [AI SERVICE] Context preview:', conversationContext.substring(0, 200) + '...');
            
            console.log('🚀 [AI SERVICE] Sending request to Gemini AI...');
            
            let result, response, responseText;
            
            // Handle image analysis if images are provided
            if (imageData && imageData.length > 0) {
                console.log('🖼️ [AI SERVICE] Processing with image analysis...');
                result = await this.analyzeImagesWithText(conversationContext, imageData, language);
                response = await result.response;
                responseText = response.text();
            } else {
                // Generate text-only response from Gemini
                result = await this.model.generateContent(conversationContext);
                console.log('📡 [AI SERVICE] Gemini AI responded successfully');
                
                response = await result.response;
                responseText = response.text();
            }
            
            console.log('📝 [AI SERVICE] Response text received (length):', responseText.length);
            console.log('📝 [AI SERVICE] Response preview:', responseText.substring(0, 150) + '...');
            
            // Add safety disclaimer for serious symptoms
            const disclaimedResponse = this.addSafetyDisclaimer(responseText, language);
            console.log('🛡️ [AI SERVICE] Safety disclaimer checked and applied if needed');
            
            // Format response for better readability
            const finalResponse = this.formatResponse(disclaimedResponse, language);
            console.log('🎨 [AI SERVICE] Response formatted for better readability');
            
            const successResponse = {
                success: true,
                response: finalResponse,
                language: language,
                timestamp: new Date(),
                model: 'gemini-1.5-flash'
            };
            
            console.log('✅ [AI SERVICE] Response generated successfully');
            console.log('🏁 [AI SERVICE] ================== RESPONSE COMPLETE ==================\n');
            
            return successResponse;
            
        } catch (error) {
            console.error('\n💥 [AI SERVICE] ================== ERROR OCCURRED ==================');
            console.error('❌ [AI SERVICE] Error type:', error.constructor.name);
            console.error('❌ [AI SERVICE] Error message:', error.message);
            
            if (error.message.includes('API_KEY_INVALID')) {
                console.error('🔑 [AI SERVICE] ISSUE: Invalid or missing Gemini API key');
                console.error('🔑 [AI SERVICE] SOLUTION: Get API key from https://makersuite.google.com/app/apikey');
            } else if (error.message.includes('QUOTA_EXCEEDED')) {
                console.error('📈 [AI SERVICE] ISSUE: API quota exceeded');
                console.error('📈 [AI SERVICE] SOLUTION: Wait or upgrade your API plan');
            } else if (error.message.includes('Failed to fetch')) {
                console.error('🌐 [AI SERVICE] ISSUE: Network connection problem');
                console.error('🌐 [AI SERVICE] SOLUTION: Check internet connection');
            }
            
            console.error('📍 [AI SERVICE] Full error stack:', error.stack);
            
            // Fallback response
            const fallbackMessage = this.detectLanguage(userMessage) === 'hindi' ?
                'माफ करें, मैं अभी आपकी मदद नहीं कर सकता। कृपया बाद में कोशिश करें। 🤖' :
                'Sorry, I cannot help you right now. Please try again later. 🤖';
                
            const errorResponse = {
                success: false,
                response: fallbackMessage,
                error: error.message,
                timestamp: new Date()
            };
            
            console.log('🚑 [AI SERVICE] Returning fallback response');
            console.log('❌ [AI SERVICE] ================== ERROR HANDLED ==================\n');
            
            return errorResponse;
        }
    }

    /**
     * Build conversation context for AI
     */
    buildConversationContext(history, currentMessage, systemPrompt, language) {
        let context = systemPrompt + '\n\n';
        
        // Add recent conversation history (last 5 messages)
        const recentHistory = history.slice(-5);
        
        recentHistory.forEach(msg => {
            context += `${msg.sender}: ${msg.message}\n`;
        });
        
        context += `User: ${currentMessage}\nHealthyAI:`;
        
        return context;
    }

    /**
     * Add safety disclaimer for serious symptoms
     */
    addSafetyDisclaimer(response, language) {
        // Keywords that trigger safety warnings
        const emergencyKeywords = {
            english: ['chest pain', 'can\'t breathe', 'severe', 'emergency', 'heart attack', 'stroke'],
            hindi: ['सीने में दर्द', 'सांस नहीं', 'गंभीर', 'आपातकाल', 'दिल का दौरा']
        };
        
        const keywords = emergencyKeywords[language] || emergencyKeywords.english;
        const hasEmergencyKeyword = keywords.some(keyword => 
            response.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasEmergencyKeyword) {
            const disclaimer = language === 'hindi' ?
                '\n\n⚠️ महत्वपूर्ण: गंभीर लक्षणों के लिए तुरंत डॉक्टर से मिलें या आपातकालीन सेवाओं को कॉल करें।' :
                '\n\n⚠️ Important: For serious symptoms, please see a doctor immediately or call emergency services.';
            
            return response + disclaimer;
        }
        
        return response;
    }

    /**
     * Format response for better visual presentation
     */
    formatResponse(response, language) {
        let formatted = response;
        
        // Highlight medicine names (common patterns)
        const medicinePatterns = [
            /\b([A-Z][a-z]+(?:ol|ine|cin|mic|ide|ate|ium))\s*(\d+\s*mg)/gi,
            /\b(Paracetamol|Ibuprofen|Aspirin|Amoxicillin|Azithromycin|Metformin|Omeprazole)\b/gi,
        ];
        
        medicinePatterns.forEach(pattern => {
            formatted = formatted.replace(pattern, '<span class="medicine-name">$&</span>');
        });
        
        // Highlight dosage information
        const dosagePatterns = [
            /(\d+\s*mg|\d+\s*ml|\d+\s*tablets?|\d+\s*times?\s*daily?|every\s*\d+\s*hours?)/gi,
            /(once daily|twice daily|three times daily|before meals|after meals)/gi
        ];
        
        dosagePatterns.forEach(pattern => {
            formatted = formatted.replace(pattern, '<span class="dosage-info">$&</span>');
        });
        
        // Highlight important warnings (but keep them subtle)
        const warningPatterns = [
            /(consult.*doctor|see.*doctor|emergency|urgent|immediately)/gi
        ];
        
        warningPatterns.forEach(pattern => {
            formatted = formatted.replace(pattern, '<span class="highlight">$&</span>');
        });
        
        return formatted;
    }

    /**
     * Generate medicine information
     */
    async getMedicineInfo(medicineName, userInfo = null) {
        try {
            const language = userInfo?.preferredLanguage || 'english';
            
            const prompt = language === 'hindi' ?
                `${medicineName} दवा के बारे में जानकारी दें। इसके उपयोग, खुराक, साइड इफेक्ट्स और सावधानियों के बारे में बताएं। सरल भाषा में समझाएं।` :
                `Provide information about ${medicineName} medicine. Include its uses, dosage, side effects, and precautions. Explain in simple terms.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            const disclaimer = language === 'hindi' ?
                '\n\n💊 सलाह: कोई भी दवा लेने से पहले हमेशा डॉक्टर से सलाह लें।' :
                '\n\n💊 Advice: Always consult a doctor before taking any medication.';
            
            return {
                success: true,
                response: response.text() + disclaimer,
                language: language
            };
            
        } catch (error) {
            console.error('❌ Medicine Info Error:', error);
            return {
                success: false,
                response: 'Sorry, I could not get medicine information right now.',
                error: error.message
            };
        }
    }

    /**
     * Health tips based on user profile
     */
    async getPersonalizedHealthTips(userInfo) {
        try {
            const language = userInfo?.preferredLanguage || 'english';
            
            const prompt = language === 'hindi' ?
                `इस व्यक्ति के लिए व्यक्तिगत स्वास्थ्य सुझाव दें: ${this.formatUserContext(userInfo, language)}। 3 व्यावहारिक सुझाव दें।` :
                `Provide personalized health tips for this person: ${this.formatUserContext(userInfo, language)}. Give 3 practical suggestions.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            return {
                success: true,
                response: response.text(),
                language: language,
                type: 'health_tips'
            };
            
        } catch (error) {
            console.error('❌ Health Tips Error:', error);
            return {
                success: false,
                response: 'Unable to generate health tips right now.',
                error: error.message
            };
        }
    }

    /**
     * Analyze images with text using Gemini Vision API
     */
    async analyzeImagesWithText(textPrompt, imageData, language) {
        console.log('🖼️ [AI SERVICE] Starting image analysis with Vision API...');
        
        try {
            // Get the vision model
            const visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            // Create enhanced prompt for medical image analysis
            const imageAnalysisPrompt = this.createImageAnalysisPrompt(textPrompt, language);
            console.log('📝 [AI SERVICE] Image analysis prompt created');
            
            // Prepare image parts for Vision API
            const imageParts = imageData.map(img => ({
                inlineData: {
                    data: img.base64,
                    mimeType: img.mimeType
                }
            }));
            
            console.log('📎 [AI SERVICE] Processing', imageParts.length, 'images with Vision API...');
            
            // Send to Gemini Vision API
            const result = await visionModel.generateContent([
                imageAnalysisPrompt,
                ...imageParts
            ]);
            
            console.log('✅ [AI SERVICE] Image analysis completed successfully');
            return result;
            
        } catch (error) {
            console.error('❌ [AI SERVICE] Image analysis error:', error);
            throw error;
        }
    }
    
    /**
     * Create enhanced prompt for medical image analysis
     */
    createImageAnalysisPrompt(originalPrompt, language) {
        const medicalImagePrompt = language === 'hindi' ? `
            आप एक चिकित्सा विशेषज्ञ हैं। इस चिकित्सा चित्र का विश्लेषण करें:
            
            निर्देश:
            - बहुत संक्षिप्त और स्पष्ट रहें (3-4 वाक्य मैक्स)
            - यदि पर्चा है: दवा और खुराक बताएं
            - यदि रिपोर्ट है: मुख्य बिंदु बताएं
            - सरल भाषा का उपयोग करें
            
            मूल प्रसंग: ${originalPrompt}
            
            संक्षिप्त विश्लेषण दें।
        ` : `
            You are a medical expert. Analyze this medical image CONCISELY:
            
            RULES:
            - Keep response VERY SHORT (3-4 sentences max)
            - If prescription: mention medicine name and dosage only
            - If medical report: state key findings only
            - Use simple language, no complex medical terms
            - Be helpful but brief
            
            Original context: ${originalPrompt}
            
            Provide a SHORT, clear analysis.
        `;
        
        return medicalImagePrompt;
    }

    /**
     * Check if Gemini API is working
     */
    async testConnection() {
        try {
            const result = await this.model.generateContent('Hello! Are you working?');
            const response = await result.response;
            
            return {
                success: true,
                message: 'Gemini AI is connected successfully! 🤖',
                response: response.text()
            };
        } catch (error) {
            return {
                success: false,
                message: 'Gemini AI connection failed',
                error: error.message
            };
        }
    }
}

module.exports = new HealthAIService();
