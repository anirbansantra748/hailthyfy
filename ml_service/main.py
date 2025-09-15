from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import uuid
import time
import json
import logging
from typing import Optional, Dict, List
import pydicom
from pydicom.pixel_data_handlers import apply_voi_lut

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CheXNet ML Service",
    description="X-ray prediction service using CheXNet DenseNet model",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
LABELS = []
MODEL_VERSION = os.getenv("MODEL_VERSION", "unknown")
ML_API_KEY = os.getenv("ML_API_KEY", "dev_key_for_development_only")
MODEL_PATH = os.getenv("MODEL_PATH", "./model/chexnet_model.h5")

# CheXNet labels (14 common chest X-ray findings)
DEFAULT_LABELS = [
    "Atelectasis", "Cardiomegaly", "Consolidation", "Edema", 
    "Effusion", "Emphysema", "Fibrosis", "Hernia", 
    "Infiltration", "Mass", "Nodule", "Pleural_Thickening",
    "Pneumonia", "Pneumothorax"
]

async def verify_api_key(x_ml_api_key: str = Header(None)):
    """Verify the ML API key from header"""
    if not x_ml_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    if x_ml_api_key != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_ml_api_key

def load_model():
    """Load the CheXNet model and validate it"""
    global model, LABELS
    
    try:
        # Load model
        if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) < 1000:
            logger.warning(f"Model file not found or too small: {MODEL_PATH}")
            logger.info("Creating a simple test model for development...")
            
            # Create a simple test model for development
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
            from tensorflow.keras.applications import DenseNet121
            
            # Create base DenseNet121
            base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
            base_model.trainable = False
            
            # Create model
            model = Sequential([
                base_model,
                GlobalAveragePooling2D(),
                Dense(len(DEFAULT_LABELS), activation='sigmoid')
            ])
            
            logger.info("Test model created successfully")
        else:
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
        
        # Try to load labels from file, fallback to defaults
        labels_path = os.path.join(os.path.dirname(MODEL_PATH), "labels.json")
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                LABELS = json.load(f)
            logger.info(f"Labels loaded from {labels_path}")
        else:
            LABELS = DEFAULT_LABELS
            logger.info("Using default CheXNet labels")
        
        # Validate model output dimension matches labels
        test_input = np.random.random((1, 224, 224, 3))
        test_output = model.predict(test_input, verbose=0)
        
        if test_output.shape[1] != len(LABELS):
            error_msg = f"Model output dimension ({test_output.shape[1]}) doesn't match labels count ({len(LABELS)})"
            logger.error(error_msg)
            return False
            
        logger.info(f"Model validated: {test_output.shape[1]} outputs, {len(LABELS)} labels")
        return True
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

def preprocess_image(image_bytes: bytes, content_type: str) -> np.ndarray:
    """Preprocess image for DenseNet model"""
    try:
        # Handle DICOM files
        if content_type == "application/dicom" or content_type.endswith("dcm"):
            return preprocess_dicom(image_bytes)
        
        # Handle regular images
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if grayscale
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to 224x224
        image = image.resize((224, 224), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and preprocess
        image_array = np.array(image)
        image_array = np.expand_dims(image_array, axis=0)
        
        # Apply DenseNet preprocessing
        from tensorflow.keras.applications.densenet import preprocess_input
        processed_image = preprocess_input(image_array)
        
        return processed_image
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {str(e)}")

def preprocess_dicom(dicom_bytes: bytes) -> np.ndarray:
    """Preprocess DICOM files"""
    try:
        # Read DICOM file
        dicom = pydicom.dcmread(io.BytesIO(dicom_bytes))
        
        # Get pixel array
        pixel_array = dicom.pixel_array
        
        # Apply VOI LUT transformation if available
        if hasattr(dicom, 'VOILUTSequence'):
            pixel_array = apply_voi_lut(pixel_array, dicom)
        
        # Convert to PIL Image
        image = Image.fromarray(pixel_array)
        
        # Convert to RGB (repeat grayscale channel 3 times)
        if len(image.getbands()) == 1:
            image = image.convert('RGB')
        
        # Resize to 224x224
        image = image.resize((224, 224), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and preprocess
        image_array = np.array(image)
        image_array = np.expand_dims(image_array, axis=0)
        
        # Apply DenseNet preprocessing
        from tensorflow.keras.applications.densenet import preprocess_input
        processed_image = preprocess_input(image_array)
        
        return processed_image
        
    except Exception as e:
        logger.error(f"Error preprocessing DICOM: {str(e)}")
        raise HTTPException(status_code=400, detail=f"DICOM preprocessing failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    logger.info("Starting CheXNet ML Service...")
    
    if not load_model():
        logger.error("Failed to load model. Service cannot start.")
        os._exit(1)
    
    logger.info(f"Service started successfully with model version: {MODEL_VERSION}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model_version": MODEL_VERSION,
        "model_loaded": model is not None,
        "labels_count": len(LABELS),
        "labels": LABELS
    }

@app.post("/api/v1/predict")
async def predict(
    file: UploadFile = File(...),
    scan_type: Optional[str] = None,
    api_key: str = Depends(verify_api_key)
):
    """Predict X-ray findings using CheXNet model"""
    
    # Validate file
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Check file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/dicom"]
    if file.content_type not in allowed_types and not file.filename.endswith('.dcm'):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Preprocess image
        start_time = time.time()
        processed_image = preprocess_image(file_content, file.content_type or "")
        
        # Run inference
        predictions = await run_in_threadpool(model.predict, processed_image, verbose=0)
        inference_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Format results
        prediction_dict = {}
        for i, label in enumerate(LABELS):
            prediction_dict[label] = float(predictions[0][i])
        
        # Generate response
        response = {
            "model_version": MODEL_VERSION,
            "inference_id": str(uuid.uuid4()),
            "inference_time_ms": round(inference_time, 2),
            "predictions": prediction_dict,
            "labels": LABELS,
            "warnings": [],
            "scan_type": scan_type,
            "file_name": file.filename,
            "file_size": len(file_content)
        }
        
        # Log successful prediction
        logger.info(f"Prediction completed: {response['inference_id']}, time: {inference_time:.2f}ms")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal prediction error: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CheXNet ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/api/v1/predict"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
