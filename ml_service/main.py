
import os
import io
import logging
import uuid
import time
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Import Custom Modules
# Note: Ensure these files exist in the same directory
from features_v2 import RadiologyFeatureExtractor
from fusion import FusionEngine
from vectordb import VectorDBManager

# Try to import TensorFlow/Keras
try:
    import tensorflow as tf
    from tensorflow.keras.applications import DenseNet121
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
    from tensorflow.keras.models import Model
    from tensorflow.keras.applications.densenet import preprocess_input
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("Warning: TensorFlow not found. Using Mock DL Model.")

# ==============================================================================
# LOGGING SETUP (The Magic Part)
# ==============================================================================
class ListHandler(logging.Handler):
    """
    Custom logging handler that captures log records into a list.
    We attach this to the root logger during a request to capture everything.
    """
    def __init__(self):
        super().__init__()
        self.logs = []
        self.formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    def emit(self, record):
        try:
            msg = self.formatter.format(record)
            self.logs.append(msg)
        except Exception:
            self.handleError(record)

# Configure Root Logger to output to Console by default
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("__main__")

# ==============================================================================
# APP & GLOBAL VARS
# ==============================================================================
app = FastAPI(title="X-Ray Analysis Service", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Components
feature_extractor = None
fusion_engine = None
vector_db = None
dl_model = None

DISEASE_LABELS = [
    "Atelectasis", "Cardiomegaly", "Consolidation", "Edema", "Effusion", 
    "Emphysema", "Fibrosis", "Hernia", "Infiltration", "Mass", "Nodule", 
    "Pleural_Thickening", "Pneumonia", "Pneumothorax"
]

# ==============================================================================
# MODEL LOADING
# ==============================================================================
def load_model():
    global dl_model
    if not TF_AVAILABLE:
        logger.warning("TensorFlow not available. Skipping model load.")
        return

    model_path = "./model/chexnet_model.h5"
    
    try:
        if os.path.exists(model_path):
            logger.info(f"Loading weights from {model_path}...")
            
            # Build Architecture
            base_model = DenseNet121(include_top=False, weights=None, input_shape=(224, 224, 3))
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            predictions = Dense(14, activation='sigmoid')(x)
            dl_model = Model(inputs=base_model.input, outputs=predictions)
            
            # Load Weights
            dl_model.load_weights(model_path)
            logger.info("DenseNet121 weights loaded successfully.")
        else:
            logger.warning(f"Weights file not found at {model_path}. Using Untrained/Random DenseNet.")
            # Load ImageNet weights as placeholder if possible, or just random
            base_model = DenseNet121(include_top=False, weights='imagenet', input_shape=(224, 224, 3))
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            predictions = Dense(14, activation='sigmoid')(x)
            dl_model = Model(inputs=base_model.input, outputs=predictions)
            logger.info("Initialized DenseNet121 with ImageNet weights (Pre-training only).")
            
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        dl_model = None

# ==============================================================================
# LIFECYCLE
# ==============================================================================
@app.on_event("startup")
async def startup_event():
    global feature_extractor, fusion_engine, vector_db
    logger.info("--- Service Startup ---")
    
    load_model()
    
    logger.info("Initializing Feature Extractor...")
    feature_extractor = RadiologyFeatureExtractor()
    
    logger.info("Initializing Fusion Engine...")
    fusion_engine = FusionEngine()
    
    logger.info("Initializing Vector DB...")
    vector_db = VectorDBManager()
    
    logger.info("Service Ready.")

# ==============================================================================
# ENDPOINTS
# ==============================================================================
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": dl_model is not None}

@app.post("/api/v1/predict")
async def predict(file: UploadFile = File(...), scan_type: str = "chest"):
    # 1. Start Log Capture
    log_capture = ListHandler()
    logging.getLogger().addHandler(log_capture) # Attach to root logger
    
    inference_id = str(uuid.uuid4())
    start_time = time.time()
    
    response_data = {
        "inference_id": inference_id,
        "status": "failed",
        "predictions": {},
        "execution_logs": []
    }
    
    try:
        logger.info(f"Request received: {inference_id}")
        logger.info(f"File: {file.filename}, Scan Type: {scan_type}")
        
        # Read Image
        contents = await file.read()
        logger.info(f"Image read: {len(contents)} bytes")
        
        # ---------------------------------------------------------
        # STEP 1: PREPROCESSING & HANDCRAFTED FEATURES
        # ---------------------------------------------------------
        logger.info("\n" + "="*60)
        logger.info(f"STEP 1/5: HANDCRAFTED FEATURE EXTRACTION")
        logger.info("="*60)
        
        handcrafted_feats = feature_extractor.extract(contents)
        logger.info(f"Extracted {len(handcrafted_feats)} handcrafted features.")
        
        # ---------------------------------------------------------
        # STEP 2: DEEP LEARNING INFERENCE
        # ---------------------------------------------------------
        logger.info("\n" + "="*60)
        logger.info(f"STEP 2/5: DENSENET INFERENCE")
        logger.info("="*60)
        
        dl_preds = {}
        embedding = None
        
        if dl_model and TF_AVAILABLE:
            try:
                # Preprocess for Keras
                img = Image.open(io.BytesIO(contents)).convert('RGB')
                img = img.resize((224, 224))
                x = np.array(img)
                x = np.expand_dims(x, axis=0)
                # x = preprocess_input(x) # DenseNet preprocess
                x = x / 255.0 # Simple normalization if model trained that way, or use preprocess_input
                
                logger.info("Running inference...")
                preds = dl_model.predict(x)
                
                # Map to labels
                logger.info("Raw Predictions:")
                for i, label in enumerate(DISEASE_LABELS):
                    score = float(preds[0][i])
                    dl_preds[label] = score
                    logger.info(f"  {label}: {score:.4f}")
                
                # Extract Embedding (Mock for now or hook into layer)
                # For MVP, we'll generate a consistent random embedding or use last layer weights
                # Proper way: intermediate_layer_model = Model(inputs=dl_model.input, outputs=dl_model.get_layer('global_average_pooling2d').output)
                try:
                    # Quick embedding extraction
                    intermediate_model = Model(inputs=dl_model.input, outputs=dl_model.get_layer('global_average_pooling2d').output)
                    embedding = intermediate_model.predict(x)[0].tolist()
                    logger.info(f"Generated visual embedding (Size: {len(embedding)})")
                except Exception as e:
                    logger.warning(f"Could not extract real embedding: {e}. Using random.")
                    embedding = np.random.rand(1024).tolist()

            except Exception as e:
                logger.error(f"DL Inference failed: {e}")
                dl_preds = {label: 0.0 for label in DISEASE_LABELS}
                embedding = np.random.rand(1024).tolist()
        else:
             logger.warning("DL Model invalid. Returning 0.0 scores.")
             dl_preds = {label: 0.0 for label in DISEASE_LABELS}
             embedding = np.random.rand(1024).tolist()

        # ---------------------------------------------------------
        # STEP 3: VECTIOR DB SEARCH
        # ---------------------------------------------------------
        logger.info("\n" + "="*60)
        logger.info(f"STEP 3/5: FINDING SIMILAR CASES")
        logger.info("="*60)
        
        similar_cases = []
        if vector_db:
             similar_cases = vector_db.search_similar(embedding, k=5)
        
        # ---------------------------------------------------------
        # STEP 4: FUSION ENGINE
        # ---------------------------------------------------------
        logger.info("\n" + "="*60)
        logger.info(f"STEP 4/5: FUSION ENGINE LOGIC")
        logger.info("="*60)
        
        fusion_result = fusion_engine.fuse(dl_preds, handcrafted_feats, similar_cases)
        
        # ---------------------------------------------------------
        # FINALIZE
        # ---------------------------------------------------------
        total_time = (time.time() - start_time) * 1000
        logger.info(f"\nAnalysis Complete in {total_time:.2f}ms")
        
        response_data["status"] = "success"
        response_data["predictions"] = dl_preds # Original DL preds
        response_data["final_diagnosis"] = fusion_result["final_diagnosis"]
        response_data["confidence_score"] = fusion_result["confidence_score"]
        response_data["handcrafted_features"] = handcrafted_feats
        response_data["similar_cases"] = similar_cases
        response_data["fusion_adjustments"] = fusion_result["adjustments"]
        response_data["safety_flags"] = fusion_result["flags"]
        response_data["inference_time_ms"] = total_time
        response_data["model_version"] = "2.1-Fusion"
        
        # Flatten fusion result into top level response for ease
        response_data.update(fusion_result)

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}", exc_info=True)
        response_data["error"] = str(e)
        
    finally:
        # Stop capturing
        logging.getLogger().removeHandler(log_capture)
        # Add logs to response
        response_data["execution_logs"] = log_capture.logs
        return response_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
