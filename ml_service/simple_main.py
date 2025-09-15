from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import time
import json
import logging
from typing import Optional

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
ML_API_KEY = os.getenv("ML_API_KEY", "dev_key_for_development_only")

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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model_version": MODEL_VERSION,
        "model_loaded": True,
        "labels_count": len(DEFAULT_LABELS),
        "labels": DEFAULT_LABELS
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
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Simulate processing time
        start_time = time.time()
        time.sleep(0.1)  # Simulate 100ms processing
        inference_time = (time.time() - start_time) * 1000
        
        # Generate mock predictions (random values between 0 and 1)
        import random
        prediction_dict = {}
        for label in DEFAULT_LABELS:
            prediction_dict[label] = round(random.random(), 3)
        
        # Generate response
        response = {
            "model_version": MODEL_VERSION,
            "inference_id": str(uuid.uuid4()),
            "inference_time_ms": round(inference_time, 2),
            "predictions": prediction_dict,
            "labels": DEFAULT_LABELS,
            "warnings": ["Using mock predictions for development"],
            "scan_type": scan_type,
            "file_name": file.filename,
            "file_size": len(file_content)
        }
        
        logger.info(f"Mock prediction completed: {response['inference_id']}, time: {inference_time:.2f}ms")
        
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
        "message": "CheXNet ML Service (Development Mode)",
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
