const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const aiService = require('../services/aiService');

// 📁 FILE UPLOAD CONFIGURATION
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/images/');
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'medical-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('📎 [UPLOAD] Validating file:', file.originalname, 'Type:', file.mimetype);
    
    // Accept only specific image types and PDFs for medical use
    const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        // Additional filename validation
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
        if (allowedExtensions.test(file.originalname)) {
            console.log('✅ [UPLOAD] File accepted:', file.originalname);
            cb(null, true);
        } else {
            console.log('❌ [UPLOAD] Invalid file extension:', file.originalname);
            cb(new Error('Invalid file extension. Only JPG, PNG, GIF, WEBP, and PDF files are allowed!'), false);
        }
    } else {
        console.log('❌ [UPLOAD] Invalid file type:', file.mimetype);
        cb(new Error('Invalid file type. Only images and PDF files are allowed for medical analysis!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 10 // Maximum 10 files per upload (WhatsApp-like)
    }
});

// 🤖 AI HEALTH ASSISTANT ROUTES

/**
 * GET /ai - AI Chat Interface Page
 */
router.get('/', (req, res) => {
    console.log('🎯 [AI ROUTE] GET /ai - Chat interface requested');
    console.log('👤 [AI ROUTE] User session:', req.session.user ? 'Logged in' : 'Anonymous');
    
    try {
        // Get existing chat history from session
        const chatHistory = req.session.chatHistory || [];
        console.log('📚 [AI ROUTE] Existing chat history length:', chatHistory.length);
        
        res.render('ai/chat', {
            title: 'HealthyAI Assistant - Get Instant Health Advice',
            user: req.session.user || null,
            pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
            messages: chatHistory
        });
        console.log('✅ [AI ROUTE] Chat interface rendered successfully');
    } catch (error) {
        console.error('❌ [AI ROUTE] Error rendering chat interface:', error);
        res.status(500).render('error/500', {
            title: 'Server Error',
            user: req.session.user || null,
            error: 'Failed to load chat interface'
        });
    }
});

/**
 * POST /ai/chat - Send message to AI (handles both JSON API and form submissions with file uploads)
 */
router.post('/chat', (req, res, next) => {
    // Handle file upload with custom error handling
    upload.array('image', 10)(req, res, (err) => {
        if (err) {
            console.error('❌ [UPLOAD] File upload error:', err.message);
            
            // Handle different types of upload errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.render('ai/chat', {
                    title: 'HealthyAI Assistant - Get Instant Health Advice',
                    user: req.session.user || null,
                    pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                    messages: req.session.chatHistory || [],
                    error: 'File too large! Please upload images smaller than 10MB.'
                });
            } else if (err.code === 'LIMIT_FILE_COUNT') {
                return res.render('ai/chat', {
                    title: 'HealthyAI Assistant - Get Instant Health Advice',
                    user: req.session.user || null,
                    pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                    messages: req.session.chatHistory || [],
                    error: 'Too many files! Please upload maximum 10 images at once.'
                });
            } else {
                return res.render('ai/chat', {
                    title: 'HealthyAI Assistant - Get Instant Health Advice',
                    user: req.session.user || null,
                    pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                    messages: req.session.chatHistory || [],
                    error: err.message || 'File upload failed. Please try again.'
                });
            }
        }
        
        // Continue with chat processing
        next();
    });
}, async (req, res) => {
    console.log('\n🚀 [AI CHAT] ================== NEW CHAT REQUEST ==================');
    console.log('📥 [AI CHAT] POST /ai/chat called');
    console.log('🕒 [AI CHAT] Timestamp:', new Date().toISOString());
    
    try {
        // Log request details
        console.log('📦 [AI CHAT] Request body:', req.body);
        console.log('🌐 [AI CHAT] Content-Type:', req.headers['content-type']);
        console.log('📁 [AI CHAT] Uploaded files:', req.files ? req.files.length : 0);
        console.log('👤 [AI CHAT] User session:', req.session.user ? 'Logged in' : 'Anonymous');
        
        const { message, conversationHistory } = req.body;
        const uploadedFiles = req.files || [];
        
        console.log('💬 [AI CHAT] Message received:', message);
        console.log('📚 [AI CHAT] Conversation history length:', (conversationHistory || []).length);
        console.log('🖼️ [AI CHAT] Images uploaded:', uploadedFiles.map(f => f.filename));
        
        // Allow empty message if there are uploaded files
        if ((!message || message.trim().length === 0) && uploadedFiles.length === 0) {
            console.log('❌ [AI CHAT] Empty message and no files received');
            
            // Handle JSON vs form submission differently
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    error: 'Message or image is required'
                });
            } else {
                // Form submission - redirect back with error
                return res.render('ai/chat', {
                    title: 'HealthyAI Assistant - Get Instant Health Advice',
                    user: req.session.user || null,
                    pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                    messages: req.session.chatHistory || [],
                    error: 'Please enter a message or upload an image'
                });
            }
        }

        // Get user information from session (if logged in)
        const userInfo = req.session.user ? {
            name: req.session.user.name,
            age: req.session.user.age,
            gender: req.session.user.gender,
            medicalHistory: req.session.user.medicalHistory || [],
            preferredLanguage: req.session.user.preferredLanguage || 'english'
        } : null;
        
        console.log('👥 [AI CHAT] User info:', userInfo ? 'Available' : 'Anonymous user');
        console.log('🤖 [AI CHAT] Calling aiService.generateHealthResponse...');

        // Initialize conversation history from session if not provided
        let chatHistory = conversationHistory || req.session.chatHistory || [];

        // Process uploaded images
        let imageData = null;
        if (uploadedFiles.length > 0) {
            console.log('🖼️ [AI CHAT] Processing uploaded images...');
            
            try {
                imageData = [];
                for (const file of uploadedFiles) {
                    const imagePath = `/uploads/images/${file.filename}`;
                    const fullPath = path.join(__dirname, '..', 'public', 'uploads', 'images', file.filename);
                    
                    // Read image data for AI analysis
                    const imageBuffer = await fs.readFile(fullPath);
                    const base64Image = imageBuffer.toString('base64');
                    
                    imageData.push({
                        filename: file.filename,
                        originalName: file.originalname,
                        path: imagePath,
                        fullPath: fullPath,
                        mimeType: file.mimetype,
                        size: file.size,
                        base64: base64Image
                    });
                }
                console.log('✅ [AI CHAT] Images processed successfully');
            } catch (imageError) {
                console.error('❌ [AI CHAT] Image processing error:', imageError);
                // Continue without images
                imageData = null;
            }
        }

        // Prepare message for AI - include image context if available
        const messageText = message ? message.trim() : '';
        const contextualMessage = imageData && imageData.length > 0 
            ? `${messageText}\n\n[User has uploaded ${imageData.length} medical image(s) for analysis]`
            : messageText;

        // Generate AI response
        const aiResponse = await aiService.generateHealthResponse(
            contextualMessage,
            userInfo,
            chatHistory,
            imageData // Pass image data to AI service
        );
        
        console.log('📨 [AI CHAT] AI Service response received:');
        console.log('✅ [AI CHAT] Success:', aiResponse.success);
        console.log('📝 [AI CHAT] Response length:', aiResponse.response ? aiResponse.response.length : 'No response');
        
        if (aiResponse.error) {
            console.log('⚠️ [AI CHAT] AI Service error:', aiResponse.error.substring(0, 200) + '...');
        }

        // Update chat history
        if (aiResponse.success) {
            // Add user message with image if uploaded
            const userMessage = {
                sender: 'user',
                content: messageText || 'Uploaded medical image for analysis',
                timestamp: new Date().toISOString()
            };
            
            // Add image path(s) if image(s) were uploaded
            if (imageData && imageData.length > 0) {
                userMessage.image = imageData[0].path; // Primary image for display
                if (imageData.length > 1) {
                    userMessage.images = imageData.map(img => img.path); // All image paths for grid
                }
            }
            
            chatHistory.push(userMessage);
            
            // Add AI response
            const aiMessage = {
                sender: 'ai',
                content: aiResponse.response,
                timestamp: new Date().toISOString()
            };
            
            // Add image analysis flag if this was an image analysis
            if (imageData && imageData.length > 0) {
                aiMessage.imageAnalysis = aiResponse.imageAnalysis || aiResponse.response;
            }
            
            chatHistory.push(aiMessage);

            // Keep only last 20 messages to prevent session bloat
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }

            // Store in session
            req.session.chatHistory = chatHistory;
        }

        console.log('📤 [AI CHAT] Determining response type...');
        
        // Handle JSON vs form submission responses
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            // JSON API response
            console.log('📱 [AI CHAT] Sending JSON response');
            res.json(aiResponse);
        } else {
            // Form submission - render page with conversation
            console.log('🌐 [AI CHAT] Rendering HTML response with chat history');
            res.render('ai/chat', {
                title: 'HealthyAI Assistant - Get Instant Health Advice',
                user: req.session.user || null,
                pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                messages: chatHistory,
                success: aiResponse.success,
                lastMessage: message.trim(),
                lastResponse: aiResponse.response
            });
        }
        
        console.log('✅ [AI CHAT] Response sent successfully');
        console.log('🏁 [AI CHAT] ================== CHAT REQUEST COMPLETE ==================\n');

    } catch (error) {
        console.error('💥 [AI CHAT] CRITICAL ERROR in chat route:', error);
        console.error('📍 [AI CHAT] Error stack:', error.stack);
        
        // Handle JSON vs form submission errors
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            const errorResponse = {
                success: false,
                error: 'Failed to get AI response',
                message: 'Sorry, I cannot help you right now. Please try again later. 🤖',
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 [AI CHAT] Sending JSON error response:', errorResponse);
            res.status(500).json(errorResponse);
        } else {
            // Form submission error - render page with error
            console.log('🌐 [AI CHAT] Rendering HTML error response');
            res.render('ai/chat', {
                title: 'HealthyAI Assistant - Get Instant Health Advice',
                user: req.session.user || null,
                pageDescription: 'Chat with our AI health assistant for instant medical advice and support',
                messages: req.session.chatHistory || [],
                error: 'Sorry, I cannot help you right now. Please try again later. 🤖'
            });
        }
        
        console.log('❌ [AI CHAT] ================== CHAT REQUEST FAILED ==================\n');
    }
});

/**
 * POST /ai/medicine - Get medicine information
 */
router.post('/medicine', async (req, res) => {
    try {
        const { medicineName } = req.body;
        
        if (!medicineName || medicineName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Medicine name is required'
            });
        }

        const userInfo = req.session.user ? {
            preferredLanguage: req.session.user.preferredLanguage || 'english'
        } : null;

        const medicineInfo = await aiService.getMedicineInfo(
            medicineName.trim(),
            userInfo
        );

        res.json(medicineInfo);

    } catch (error) {
        console.error('❌ Medicine Info Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get medicine information'
        });
    }
});

/**
 * GET /ai/health-tips - Get personalized health tips
 */
router.get('/health-tips', async (req, res) => {
    try {
        // Require user to be logged in for personalized tips
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'Please log in to get personalized health tips'
            });
        }

        const userInfo = {
            name: req.session.user.name,
            age: req.session.user.age,
            gender: req.session.user.gender,
            medicalHistory: req.session.user.medicalHistory || [],
            preferredLanguage: req.session.user.preferredLanguage || 'english'
        };

        const healthTips = await aiService.getPersonalizedHealthTips(userInfo);

        res.json(healthTips);

    } catch (error) {
        console.error('❌ Health Tips Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health tips'
        });
    }
});

/**
 * GET /ai/test - Test AI connection
 */
router.get('/test', async (req, res) => {
    try {
        const testResult = await aiService.testConnection();
        res.json(testResult);
    } catch (error) {
        console.error('❌ AI Test Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test AI connection'
        });
    }
});

/**
 * GET /ai/quick-help - Quick health help page
 */
router.get('/quick-help', (req, res) => {
    res.render('ai/quick-help', {
        title: 'Quick Health Help - Instant AI Assistance',
        user: req.session.user || null,
        pageDescription: 'Get quick health advice and tips from our AI assistant'
    });
});

/**
 * POST /ai/quick-question - Quick health question
 */
router.post('/quick-question', async (req, res) => {
    try {
        const { question, category } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Question is required'
            });
        }

        // Add category context to the question
        const contextualQuestion = category ? 
            `[Category: ${category}] ${question}` : 
            question;

        const userInfo = req.session.user ? {
            name: req.session.user.name,
            age: req.session.user.age,
            gender: req.session.user.gender,
            preferredLanguage: req.session.user.preferredLanguage || 'english'
        } : null;

        const aiResponse = await aiService.generateHealthResponse(
            contextualQuestion.trim(),
            userInfo
        );

        res.json(aiResponse);

    } catch (error) {
        console.error('❌ Quick Question Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get quick health advice'
        });
    }
});

module.exports = router;
