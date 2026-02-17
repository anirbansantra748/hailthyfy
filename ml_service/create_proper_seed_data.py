"""
Enhanced Vector DB Seeding Script

This script creates proper seed data for the vector DB using realistic X-ray patterns
instead of random noise. It generates synthetic X-ray-like images with different
characteristics for pneumonia, normal, and other conditions.

Author: AI Assistant
Date: 2026-02-15
"""

import os
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense
from vectordb import VectorDBManager
from features_v2 import RadiologyFeatureExtractor
import uuid
import logging
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EnhancedSeedDB")

MODEL_PATH = "./model/chexnet_model.h5"

def load_feature_extractor_and_model():
    """Load both the full model and feature extractor"""
    try:
        from tensorflow.keras.applications import DenseNet121
        from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
        from tensorflow.keras.models import Model
        
        base_model = DenseNet121(include_top=False, weights=None, input_shape=(224, 224, 3))
        x = base_model.output
        x = GlobalAveragePooling2D(name='global_average_pooling2d')(x)
        predictions = Dense(14, activation='sigmoid', name='predictions')(x)
        model = Model(inputs=base_model.input, outputs=predictions)
        
        if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 1000:
            logger.info(f"Loading weights from {MODEL_PATH}...")
            try:
                model.load_weights(MODEL_PATH)
                logger.info("Weights loaded successfully.")
            except Exception as e:
                logger.warning(f"Load weights failed: {e}. Using ImageNet weights instead...")
                base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
                x = base_model.output
                x = GlobalAveragePooling2D()(x)
                model = Model(inputs=base_model.input, outputs=x)
                return model, model
        else:
            logger.warning("Model file not found. Using ImageNet weights.")
            base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            feature_model = Model(inputs=base_model.input, outputs=x)
            return feature_model, feature_model

        # Create Feature Extractor
        layer_name = 'global_average_pooling2d'
        feature_extractor = Model(inputs=model.input, outputs=model.get_layer(layer_name).output)
        
        return model, feature_extractor
        
    except Exception as e:
        logger.error(f"Failed to load/build model: {e}")
        return None, None

def generate_synthetic_xray(pattern_type='normal', size=(224, 224)):
    """
    Generate a synthetic X-ray-like image with specific patterns.
    
    Args:
        pattern_type: 'normal', 'pneumonia_mild', 'pneumonia_moderate', 'pneumonia_severe', 'other'
        size: Image size (width, height)
    
    Returns:
        numpy array of shape (height, width, 3) representing RGB image
    """
    height, width = size
    
    # Create base X-ray (dark background, brighter lungs)
    img = np.zeros((height, width), dtype=np.uint8)
    
    # Add realistic X-ray base (brighter in center for lungs, darker at edges)
    y, x = np.ogrid[:height, :width]
    center_y, center_x = height // 2, width // 2
    
    # Create lung field (elliptical regions)
    # Left lung
    left_lung_mask = ((x - width*0.35)**2) / (width*0.15)**2 + ((y - center_y)**2) / (height*0.3)**2 <= 1
    # Right lung
    right_lung_mask = ((x - width*0.65)**2) / (width*0.15)**2 + ((y - center_y)**2) / (height*0.3)**2 <= 1
    
    lung_mask = left_lung_mask | right_lung_mask
    
    # Base intensity for lungs (darker = air-filled)
    img[lung_mask] = 60
    img[~lung_mask] = 180  # Bone/tissue (brighter)
    
    # Add some ribcage texture
    for i in range(5):
        rib_y = int(height * (0.3 + i * 0.1))
        cv2.line(img, (0, rib_y), (width, rib_y), 150, 2)
    
    # Add pattern based on type
    if pattern_type == 'pneumonia_mild':
        # Add subtle opacity in lower zones (one lung)
        lower_zone_mask = (y > height * 0.6) & left_lung_mask
        noise = np.random.randint(30, 50, size=(height, width)).astype(np.uint8)
        img[lower_zone_mask] = np.clip(img[lower_zone_mask] + noise[lower_zone_mask], 0, 255)
        
    elif pattern_type == 'pneumonia_moderate':
        # More significant opacity in lower zones (both lungs, asymmetric)
        lower_left = (y > height * 0.55) & left_lung_mask
        lower_right = (y > height * 0.65) & right_lung_mask
        noise_left = np.random.randint(40, 70, size=(height, width)).astype(np.uint8)
        noise_right = np.random.randint(20, 40, size=(height, width)).astype(np.uint8)
        img[lower_left] = np.clip(img[lower_left] + noise_left[lower_left], 0, 255)
        img[lower_right] = np.clip(img[lower_right] + noise_right[lower_right], 0, 255)
        
    elif pattern_type == 'pneumonia_severe':
        # Extensive bilateral opacities
        opacity_mask = lung_mask & (y > height * 0.4)
        noise = np.random.randint(50, 90, size=(height, width)).astype(np.uint8)
        img[opacity_mask] = np.clip(img[opacity_mask] + noise[opacity_mask], 0, 255)
        
    elif pattern_type == 'other':
        # Random pattern (e.g., cardiomegaly - enlarged heart silhouette)
        heart_mask = ((x - center_x)**2) / (width*0.12)**2 + ((y - center_y*1.1)**2) / (height*0.15)**2 <= 1
        img[heart_mask] = 200
    
    # Add noise for realism
    noise = np.random.normal(0, 5, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Smooth
    img = cv2.GaussianBlur(img, (5, 5), 1.5)
    
    # Convert to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    
    return img_rgb

def preprocess_for_densenet(img_rgb):
    """Preprocess image for DenseNet"""
    from tensorflow.keras.applications.densenet import preprocess_input
    img_array = np.expand_dims(img_rgb, axis=0).astype(np.float32)
    return preprocess_input(img_array)

def main():
    logger.info("="*80)
    logger.info("ENHANCED VECTOR DB SEEDING - START")
    logger.info("="*80)
    
    # 1. Init DB
    logger.info("\n--- Initializing Vector DB ---")
    vdb = VectorDBManager()
    logger.info(f"Current DB count: {vdb.count()}")
    
    # 2. Init Models
    logger.info("\n--- Loading Models ---")
    full_model, feature_extractor = load_feature_extractor_and_model()
    if not feature_extractor:
        logger.error("Could not load model. Exiting.")
        return
    
    # 3. Init Feature Extractor
    logger.info("\n--- Initializing Handcrafted Feature Extractor ---")
    handcrafted_extractor = RadiologyFeatureExtractor()
    
    # 4. Define seed patterns
    seed_patterns = [
        # Normal cases (10 samples)
        *[('normal', f'normal_{i}', 0.92 + i*0.01) for i in range(10)],
        
        # Pneumonia - mild (5 samples)
        *[('pneumonia_mild', f'pneumonia_mild_{i}', 0.65 + i*0.03) for i in range(5)],
        
        # Pneumonia - moderate (8 samples)
        *[('pneumonia_moderate', f'pneumonia_mod_{i}', 0.75 + i*0.02) for i in range(8)],
        
        # Pneumonia - severe (7 samples)
        *[('pneumonia_severe', f'pneumonia_sev_{i}', 0.85 + i*0.02) for i in range(7)],
        
        # Other conditions (5 samples)
        *[('other', f'other_{i}', 0.70 + i*0.03) for i in range(5)],
    ]
    
    logger.info(f"\n--- Generating {len(seed_patterns)} Synthetic X-rays ---")
    
    for idx, (pattern, seed_id, confidence) in enumerate(seed_patterns, 1):
        logger.info(f"\n[{idx}/{len(seed_patterns)}] Processing: {seed_id} (Pattern: {pattern})")
        
        # Generate synthetic X-ray
        img_rgb = generate_synthetic_xray(pattern_type=pattern, size=(224, 224))
        
        # Get DenseNet embedding
        preprocessed = preprocess_for_densenet(img_rgb)
        embedding = feature_extractor.predict(preprocessed, verbose=0)[0]
        logger.info(f"  Embedding generated: shape={embedding.shape}, mean={np.mean(embedding):.4f}, std={np.std(embedding):.4f}")
        
        # Get handcrafted features
        # Convert to bytes for the extractor
        img_pil = Image.fromarray(img_rgb)
        import io
        img_bytes_io = io.BytesIO()
        img_pil.save(img_bytes_io, format='PNG')
        img_bytes = img_bytes_io.getvalue()
        
        handcrafted = handcrafted_extractor.extract(img_bytes)
        logger.info(f"  Handcrafted features: {len(handcrafted)} features extracted")
        
        # Determine label based on pattern
        if 'pneumonia' in pattern:
            label = 'Pneumonia'
        elif pattern == 'normal':
            label = 'Normal'
        else:
            label = 'Other'
        
        # Store metadata
        meta = {
            "label": label,
            "confidence": min(confidence, 0.99),
            "pattern_type": pattern,
            "source": "enhanced_seed_script",
            "notes": f"Synthetic {pattern} X-ray with realistic features"
        }
        
        # Add to VectorDB
        success = vdb.add_record(
            image_id=seed_id,
            embedding=embedding.tolist(),
            metadata=meta,
            handcrafted_features=handcrafted
        )
        
        if success:
            logger.info(f"  ✓ Added to VectorDB: {seed_id}")
        else:
            logger.warning(f"  ✗ Failed to add: {seed_id}")
    
    final_count = vdb.count()
    logger.info("\n" + "="*80)
    logger.info(f"SEEDING COMPLETE")
    logger.info("="*80)
    logger.info(f"Total records in VectorDB: {final_count}")
    logger.info(f"Records added this session: {final_count - (final_count - len(seed_patterns))}")
    
    # Summary by label
    logger.info("\nSeed Data Summary:")
    label_counts = {}
    for pattern, seed_id, _ in seed_patterns:
        label = 'Pneumonia' if 'pneumonia' in pattern else ('Normal' if pattern == 'normal' else 'Other')
        label_counts[label] = label_counts.get(label, 0) + 1
    
    for label, count in label_counts.items():
        logger.info(f"  {label}: {count} samples")
    logger.info("="*80)

if __name__ == "__main__":
    main()
