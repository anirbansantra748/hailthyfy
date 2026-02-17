import logging
import numpy as np
from fusion import FusionEngine
from vectordb import VectorDBManager
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VerifyPipeline")

def test_integration():
    logger.info("--- Starting Pipeline Verification ---")
    
    # 1. Init Components
    try:
        fusion = FusionEngine()
        vdb = VectorDBManager()
        logger.info("Components Initialized.")
    except Exception as e:
        logger.error(f"Init failed: {e}")
        return

    # Check DB content
    count = vdb.count()
    logger.info(f"VectorDB Count: {count}")
    
    if count == 0:
        logger.warning("VectorDB is empty! Run seed_vectordb.py first.")
        # We can't fully test KNN if DB is empty, but we can test the Fusion logic with mock similar cases
    
    # 2. Simulate DL Prediction
    dl_preds = {
        "Pneumonia": 0.75,
        "Normal": 0.25,
        "Infiltration": 0.05
    }
    
    # 3. Simulate Handcrafted Features
    handcrafted = {
        "lung_area_ratio": 0.45,
        "asym_Lower_opacity": 0.05 # Symmetric
    }
    
    # 4. Simulate Vector Search (Mock or Real)
    # Let's try real search if DB has data
    similar_cases = []
    if count > 0:
        # Create a dummy embedding (1024-d)
        dummy_emb = np.random.rand(1024).astype(np.float32).tolist()
        similar_cases = vdb.search_similar(dummy_emb, k=3)
        logger.info(f"Found {len(similar_cases)} similar cases from DB.")
    else:
        # Mock similar cases
        logger.info("Using MOCK similar cases for testing logic.")
        similar_cases = [
            {"metadata": {"label": "Pneumonia", "confidence": 0.9}, "similarity": 0.85},
            {"metadata": {"label": "Pneumonia", "confidence": 0.88}, "similarity": 0.82},
            {"metadata": {"label": "Normal", "confidence": 0.95}, "similarity": 0.75}
        ]
    
    # 5. Run Fusion
    logger.info("Running Fusion...")
    result = fusion.fuse(dl_preds, handcrafted, similar_cases)
    
    # 6. Verify Results
    logger.info("--- Fusion Results ---")
    logger.info(f"Final Diagnosis: {result['final_diagnosis']}")
    logger.info(f"Confidence: {result['confidence_score']:.2f}")
    
    print("\nAdjusments:")
    for adj in result['adjustments']:
        print(f" - {adj}")
        
    print("\nFlags:")
    for flg in result['flags']:
        print(f" - {flg}")
        
    # Assertions
    has_knn = any("Vector DB" in adj or "KNN" in adj for adj in result['adjustments'])
    if has_knn:
        logger.info("SUCCESS: Fusion Engine successfully integrated KNN logic.")
    else:
        logger.error("FAILURE: Fusion Engine did NOT report KNN adjustments.")

if __name__ == "__main__":
    test_integration()
