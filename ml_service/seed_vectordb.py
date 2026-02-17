import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense
from vectordb import VectorDBManager
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SeedDB")

MODEL_PATH = "./model/chexnet_model.h5"

def load_feature_extractor():
    try:
        # Build Model Structure for CheXNet (DenseNet121 + 14 classes)
        from tensorflow.keras.applications import DenseNet121
        from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
        from tensorflow.keras.models import Model
        
        base_model = DenseNet121(include_top=False, weights=None, input_shape=(224, 224, 3))
        x = base_model.output
        x = GlobalAveragePooling2D(name='global_average_pooling2d')(x)
        predictions = Dense(14, activation='sigmoid', name='predictions')(x)
        model = Model(inputs=base_model.input, outputs=predictions)
        
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading weights from {MODEL_PATH}...")
            try:
                model.load_weights(MODEL_PATH)
                logger.info("Weights loaded successfully.")
            except Exception as e:
                logger.warning(f"Load weights failed: {e}. Trying raw DenseNet121...")
                # Fallback: maybe it's just the base model? or different arch?
                # Just return a fresh DenseNet121 for seeding if weights fail
                # But we want embeddings that are consistent.
                # If loading fails, let's use ImageNet weights for the seed script
                # so at least we get valid embeddings (though different from CheXNet).
                base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
                x = base_model.output
                x = GlobalAveragePooling2D()(x)
                return Model(inputs=base_model.input, outputs=x)
        else:
             logger.warning("Model file not found. Using ImageNet weights.")
             base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
             x = base_model.output
             x = GlobalAveragePooling2D()(x)
             return Model(inputs=base_model.input, outputs=x)

        # Create Extractor (remove top layer)
        # We constructed it as: Input -> DenseNet -> Pooled -> Preds
        # We want: Input -> DenseNet -> Pooled
        layer_name = 'global_average_pooling2d'
        return Model(inputs=model.input, outputs=model.get_layer(layer_name).output)
        
    except Exception as e:
        logger.error(f"Failed to load/build model: {e}")
        return None

def main():
    logger.info("Starting VectorDB Seeding...")
    
    # 1. Init DB
    vdb = VectorDBManager()
    
    # 2. Init Model
    model = load_feature_extractor()
    if not model:
        logger.error("Could not load model. Exiting.")
        return

    # 3. Generate Base Embeddings
    # Create a dummy image (random noise)
    dummy_img = np.random.rand(1, 224, 224, 3).astype(np.float32)
    # Preprocess (simple normalization for now)
    dummy_img = (dummy_img * 255)
    from tensorflow.keras.applications.densenet import preprocess_input
    dummy_img = preprocess_input(dummy_img)
    
    base_embedding = model.predict(dummy_img, verbose=0)[0]
    logger.info(f"Base Embedding Size: {len(base_embedding)}")
    
    # Define Correct Labels
    LABELS = [
        "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", "Nodule", "Pneumonia", 
        "Pneumothorax", "Consolidation", "Edema", "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia"
    ]
    
    # 4. Generate Synthetic Data
    # Cluster 1: Pneumonia (Index 6)
    pneumonia_idx = LABELS.index("Pneumonia")
    
    logger.info("Seeding Pneumonia Cluster...")
    for i in range(5):
        # Add small noise
        noise = np.random.normal(0, 0.05, len(base_embedding))
        emb = base_embedding + noise
        
        meta = {
            "label": "Pneumonia",
            "confidence": 0.85 + (i * 0.02),
            "source": "seed_script",
            "notes": "Synthetic verified case"
        }
        
        vdb.add_record(
            image_id=f"seed_pneu_{i}",
            embedding=emb.tolist(),
            metadata=meta,
            handcrafted_features={"lung_area_ratio": 0.35, "asym_Lower_opacity": 0.4}
        )

    # Cluster 2: Normal (Shifted far away)
    logger.info("Seeding Normal Cluster...")
    # Shift base significantly
    shift_vector = np.ones_like(base_embedding) * 0.5
    normal_base = base_embedding + shift_vector
    
    for i in range(5):
        # Add small noise
        noise = np.random.normal(0, 0.05, len(normal_base))
        emb = normal_base + noise
        
        meta = {
            "label": "Normal",
            "confidence": 0.90 + (i * 0.01),
            "source": "seed_script",
            "notes": "Synthetic healthy case"
        }
        
        vdb.add_record(
            image_id=f"seed_norm_{i}",
            embedding=emb.tolist(),
            metadata=meta,
            handcrafted_features={"lung_area_ratio": 0.45, "asym_Lower_opacity": 0.05}
        )
        
    logger.info(f"Seeding Complete. Total Records: {vdb.count()}")

if __name__ == "__main__":
    main()
