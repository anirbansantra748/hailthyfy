// Mock ML Service for X-ray Predictions
// This simulates the ML API service for development/demo purposes
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8000;

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(express.json());

// Mock predictions for different conditions
const mockPredictions = {
  chest: {
    'normal': 0.85,
    'pneumonia': 0.10,
    'pneumothorax': 0.03,
    'pleural_effusion': 0.02,
    'atelectasis': 0.05,
    'cardiomegaly': 0.08,
    'consolidation': 0.01,
    'edema': 0.02,
    'emphysema': 0.03,
    'fibrosis': 0.01,
    'infiltration': 0.04,
    'nodule': 0.06
  },
  abdominal: {
    'normal': 0.78,
    'bowel_obstruction': 0.05,
    'kidney_stones': 0.03,
    'free_air': 0.01,
    'ascites': 0.02,
    'hepatomegaly': 0.04,
    'splenomegaly': 0.02,
    'mass_lesion': 0.05
  },
  dental: {
    'normal': 0.82,
    'caries': 0.10,
    'root_canal': 0.03,
    'impacted_tooth': 0.02,
    'bone_loss': 0.03
  },
  spine: {
    'normal': 0.79,
    'disc_degeneration': 0.08,
    'scoliosis': 0.04,
    'fracture': 0.02,
    'spondylosis': 0.05,
    'stenosis': 0.02
  },
  limb: {
    'normal': 0.88,
    'fracture': 0.06,
    'dislocation': 0.02,
    'arthritis': 0.04
  },
  other: {
    'normal': 0.80,
    'abnormal_findings': 0.15,
    'requires_specialist_review': 0.05
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Mock ML X-ray Analysis Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api/v1/info', (req, res) => {
  res.json({
    service: 'Mock ML X-ray Analysis API',
    version: '1.0.0',
    models: {
      chest_xray: 'v2.1.3',
      abdominal_xray: 'v1.8.2',
      dental_xray: 'v1.5.1',
      spine_xray: 'v1.9.0',
      limb_xray: 'v1.4.5'
    },
    supported_formats: ['image/jpeg', 'image/png', 'image/jpg'],
    max_file_size: '10MB'
  });
});

// Prediction endpoint
app.post('/api/v1/predict', upload.single('file'), async (req, res) => {
  try {
    const startTime = Date.now();
    
    console.log('🤖 Mock ML Service: Received prediction request');
    console.log('📁 File:', req.file ? req.file.originalname : 'No file');
    console.log('🩺 Scan Type:', req.body.scan_type || 'chest');
    
    // Validate file
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        detail: 'Please upload an image file for analysis'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(415).json({
        error: 'Unsupported file format',
        detail: 'Please upload a JPG, JPEG, or PNG image'
      });
    }

    // Validate API key (basic check)
    const apiKey = req.headers['x-ml-api-key'];
    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key',
        detail: 'Please provide a valid API key in the x-ml-api-key header'
      });
    }

    // Get scan type and predictions
    const scanType = req.body.scan_type || 'chest';
    const basePredictions = mockPredictions[scanType] || mockPredictions.chest;
    
    // Add some randomization to make it realistic
    const predictions = {};
    const randomFactor = 0.1; // 10% variation
    
    for (const [condition, baseProb] of Object.entries(basePredictions)) {
      // Add random variation
      const variation = (Math.random() - 0.5) * 2 * randomFactor;
      let newProb = baseProb + (baseProb * variation);
      
      // Ensure probabilities are between 0 and 1
      newProb = Math.max(0, Math.min(1, newProb));
      predictions[condition] = Math.round(newProb * 10000) / 10000; // 4 decimal places
    }

    // Normalize probabilities to sum to 1
    const sum = Object.values(predictions).reduce((a, b) => a + b, 0);
    for (const condition in predictions) {
      predictions[condition] = Math.round((predictions[condition] / sum) * 10000) / 10000;
    }

    const endTime = Date.now();
    const inferenceTime = endTime - startTime + Math.floor(Math.random() * 500) + 100; // Add realistic processing time

    // Generate inference ID
    const inferenceId = `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const response = {
      predictions,
      model_version: scanType === 'chest' ? 'chest_xray_v2.1.3' : `${scanType}_xray_v1.0.0`,
      inference_id: inferenceId,
      inference_time_ms: inferenceTime,
      scan_type: scanType,
      labels: Object.keys(predictions),
      warnings: [],
      metadata: {
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        processed_at: new Date().toISOString()
      }
    };

    // Add warnings for high-risk findings
    const highRiskFindings = Object.entries(predictions)
      .filter(([condition, prob]) => prob > 0.3 && condition !== 'normal')
      .map(([condition]) => condition);
    
    if (highRiskFindings.length > 0) {
      response.warnings = [
        `High confidence detected for: ${highRiskFindings.join(', ')}`,
        'Please consult with a qualified radiologist for professional interpretation'
      ];
    }

    console.log('✅ Mock ML Service: Prediction completed');
    console.log('📊 Top finding:', Object.entries(predictions).sort(([,a], [,b]) => b - a)[0]);
    console.log('⏱️ Processing time:', inferenceTime, 'ms');

    res.json(response);

  } catch (error) {
    console.error('❌ Mock ML Service Error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Internal server error',
      detail: 'An error occurred while processing the image',
      inference_id: `inf_error_${Date.now()}`
    });
  }
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-ml-api-key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Mock ML Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    detail: err.message
  });
});

// Create temp directory if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp');
}

app.listen(port, () => {
  console.log(`🤖 Mock ML Service running on http://localhost:${port}`);
  console.log(`🏥 Ready to analyze X-ray images`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`📊 API info: http://localhost:${port}/api/v1/info`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Mock ML Service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Mock ML Service...');
  process.exit(0);
});
