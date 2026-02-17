import os
import sys
import logging
from features import HandcraftedFeatureExtractor

# Configure logging to show process details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [TEST] - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TestScript")

def run_test():
    try:
        logger.info("Starting Handcrafted Features Test...")
        
        # 1. Initialize Extractor
        extractor = HandcraftedFeatureExtractor()
        logger.info("Extractor initialized.")

        # 2. Load a sample image
        # Check for any image in the uploads folder or use a dummy
        image_path = None
        
        # Try to find an uploaded X-ray (just for testing purposes)
        # We'll look in parent/uploads/xrays if it exists, or generate a dummy
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "xrays")
        
        if os.path.exists(upload_dir):
            files = [f for f in os.listdir(upload_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
            if files:
                image_path = os.path.join(upload_dir, files[0])
                logger.info(f"Found sample image: {image_path}")
        
        # Create a dummy image if no file found
        if not image_path:
            logger.warning("No X-ray found. Creating a synthetic test image.")
            import numpy as np
            import cv2
            
            # Create a 512x512 image array
            dummy_img = np.zeros((512, 512), dtype=np.uint8)
            # Draw a "lung" (circle) and "heart" (rectangle)
            cv2.circle(dummy_img, (150, 256), 100, 200, -1) # Left lung
            cv2.circle(dummy_img, (362, 256), 100, 200, -1) # Right lung
            cv2.rectangle(dummy_img, (200, 200), (312, 350), 255, -1) # Heart (brighter)
            
            image_path = "test_synthetic.jpg"
            cv2.imwrite(image_path, dummy_img)
            logger.info(f"Created synthetic image: {image_path}")

        # 3. Read Image Bytes
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        logger.info(f"Read {len(image_bytes)} bytes from image.")

        # 4. Run Extraction
        logger.info(">>> Invoking extract_features()...")
        features = extractor.extract_features(image_bytes)
        
        # 5. Print Results
        logger.info("-" * 40)
        logger.info(f"✅ Extraction Successful!")
        logger.info("-" * 40)
        logger.info(f"Total Features Extracted: {len(features)}")
        logger.info("-" * 40)
        
        print("\n--- FEATURE REPORT ---")
        for key, value in features.items():
            print(f"{key:<25}: {value:.4f}")
        print("-" * 30)

    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)

if __name__ == "__main__":
    run_test()
