# X-ray Upload and Prediction System

This document describes the complete X-ray upload and prediction flow that has been implemented and fixed in the Healthfy application.

## 🚀 Overview

The system provides a complete workflow for:

1. **Uploading X-ray images** with validation and preview
2. **Sending images to ML service** for AI analysis
3. **Storing results** in the database with comprehensive metadata
4. **Displaying results** in a user-friendly interface with charts and tables

## 🔧 Technical Implementation

### 1. File Upload & Validation

**Location**: `views/predictions/upload.ejs`

**Features**:

- ✅ **File type validation**: Only allows JPG, PNG, GIF, and DICOM files
- ✅ **File size validation**: Maximum 10MB limit
- ✅ **Required field validation**: Image and scan type are mandatory
- ✅ **Real-time preview**: Shows image preview and file metadata
- ✅ **Client-side validation**: Prevents empty uploads and invalid files

**Validation Rules**:

```javascript
// File types allowed
const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/dicom",
];

// File size limit
if (file.size > 10 * 1024 * 1024) {
  // 10MB
  showError("File size must be less than 10MB");
}
```

### 2. ML Service Integration

**Location**: `controllers/predictionController.js` - `callMLService()` function

**Features**:

- ✅ **Multipart/form-data**: Properly sends files and scan_type to ML API
- ✅ **Error handling**: Comprehensive error handling with retry logic
- ✅ **Response validation**: Ensures ML response contains valid predictions
- ✅ **Timeout handling**: Configurable timeouts for ML API calls

**ML API Call**:

```javascript
const form = new FormData();
form.append("file", fs.createReadStream(filePath));
form.append("scan_type", scanType);

const response = await axios.post(`${ML_CONFIG.url}/api/v1/predict`, form, {
  headers: {
    ...form.getHeaders(),
    "x-ml-api-key": ML_CONFIG.apiKey,
  },
  timeout: ML_CONFIG.timeout,
});
```

### 3. Database Storage

**Location**: `models/Xray.js`

**Stored Data**:

- ✅ **File metadata**: filename, size, mimetype
- ✅ **ML predictions**: disease labels with probabilities (0-1)
- ✅ **ML metadata**: model version, inference ID, processing time
- ✅ **User data**: user ID, scan type, notes, timestamps
- ✅ **Status tracking**: uploaded → processing → completed/failed

**Schema Fields**:

```javascript
{
  user: ObjectId,           // User reference
  image: String,            // File path
  file_name: String,        // Original filename
  file_size: Number,        // File size in bytes
  file_mimetype: String,    // File MIME type

  // ML Results
  predictions: Map,         // Disease → probability mapping
  model_version: String,    // ML model version
  inference_id: String,     // Unique inference ID
  inference_time_ms: Number, // Processing time

  // Status
  status: String,           // uploaded/processing/completed/failed
  processed_at: Date,       // When processing completed
  error_message: String     // Error details if failed
}
```

### 4. Results Display

**Location**: `views/predictions/view-simple.ejs`

**Features**:

- ✅ **X-ray preview**: Shows uploaded image with file metadata
- ✅ **Status cards**: Visual status indicators (completed/processing/failed)
- ✅ **Top findings**: Highlights top 3 predictions with icons
- ✅ **Detailed table**: Complete predictions with risk level indicators
- ✅ **Chart visualization**: Bar chart using Chart.js showing probability distribution
- ✅ **Metadata display**: Model version, inference time, processing date
- ✅ **Error handling**: Styled error messages for failed analyses

**Chart.js Integration**:

```javascript
new Chart(ctx, {
  type: "bar",
  data: {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: chartValues.map((val) => {
          if (val >= 70) return "rgba(220, 53, 69, 0.8)"; // Red for high
          if (val >= 40) return "rgba(255, 193, 7, 0.8)"; // Yellow for medium
          return "rgba(40, 167, 69, 0.8)"; // Green for low
        }),
      },
    ],
  },
});
```

## 🔄 Complete Flow

### 1. Upload Process

```
User selects file → Client validation → Server validation → File saved → ML API called
```

### 2. ML Processing

```
File sent to ML service → AI analysis → Predictions returned → Results stored → Status updated
```

### 3. Results Display

```
User redirected → Results page loads → Data displayed → Charts rendered → User can download/retry
```

## 🧪 Testing

### Run Tests

```bash
# Test the upload flow
npm run test:upload

# Test ML integration
npm run test:ml
```

### Manual Testing

1. **Start ML service**: `cd ml_service && python main.py`
2. **Start main app**: `npm run dev`
3. **Visit**: `http://localhost:3000/prediction/xray/upload`
4. **Upload test image**: Use `tests/sample_chest_xray.jpg`
5. **Verify flow**: Check upload → processing → results display

## 🚨 Error Handling

### Upload Errors

- File type not supported
- File too large (>10MB)
- No file selected
- Invalid scan type

### ML Service Errors

- Service unavailable
- Authentication failed
- File processing failed
- Timeout errors

### Display Errors

- Invalid predictions data
- Missing metadata
- Database errors

## 🔧 Configuration

### Environment Variables

```bash
# ML Service
ML_API_URL=http://localhost:8000
ML_API_KEY=your_api_key
ML_API_TIMEOUT_MS=30000

# Prediction Mode
PREDICTION_MODE=sync  # or 'queue' for async processing
```

### File Upload Settings

```javascript
// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|dcm)$/)) {
      return cb(new Error("Only image and DICOM files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
```

## 📊 Expected ML Response Format

The ML service should return:

```json
{
  "model_version": "1.0.0",
  "inference_id": "uuid-string",
  "inference_time_ms": 1250.5,
  "predictions": {
    "Pneumonia": 0.85,
    "Cardiomegaly": 0.12,
    "Edema": 0.08,
    "Effusion": 0.03
  },
  "labels": ["Pneumonia", "Cardiomegaly", "Edema", "Effusion"],
  "warnings": [],
  "scan_type": "chest",
  "file_name": "xray.jpg",
  "file_size": 1024000
}
```

## 🎯 Key Features

- ✅ **Form validation** prevents empty uploads and invalid files
- ✅ **Multipart/form-data** correctly sends files to ML API
- ✅ **JSON response parsing** handles ML predictions properly
- ✅ **Database storage** saves all metadata and results
- ✅ **User redirects** to results page instead of raw JSON
- ✅ **Image preview** shows uploaded X-ray with metadata
- ✅ **Styled results** with tables, charts, and status indicators
- ✅ **Top findings** highlights highest probability results
- ✅ **Error handling** shows user-friendly error messages
- ✅ **No undefined properties** - all data properly validated

## 🚀 Getting Started

1. **Install dependencies**: `npm install`
2. **Start ML service**: `cd ml_service && python main.py`
3. **Start main app**: `npm run dev`
4. **Upload X-ray**: Visit `/prediction/xray/upload`
5. **View results**: Results automatically displayed after processing

The system is now fully functional with proper validation, error handling, and user experience!
