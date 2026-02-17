import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.applications.densenet import preprocess_input as densenet_preprocess
import cv2

MODEL_PATH = "./ml_service/model/chexnet_model.h5"

def debug_model():
    print("--- Debugging Model ---")
    
    # 1. Inspect Weights File
    if not os.path.exists(MODEL_PATH):
        print("Model file not found!")
        return

    print(f"Model File: {MODEL_PATH}")
    print(f"Size: {os.path.getsize(MODEL_PATH) / (1024*1024):.2f} MB")
    
    # 2. Build Architecture
    print("Building Architecture...")
    base_model = DenseNet121(include_top=False, weights=None, input_shape=(224, 224, 3))
    x = base_model.output
    x = GlobalAveragePooling2D(name='global_average_pooling2d')(x)
    predictions = Dense(14, activation='sigmoid', name='predictions')(x)
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # 3. Load Weights
    print("Loading Weights...")
    try:
        model.load_weights(MODEL_PATH)
        print("Weights Loaded Successfully.")
    except Exception as e:
        print(f"Weights Load Failed: {e}")
        return

    # 4. Check Weights of Last Layer
    # If weights are random, they will have specific distribution. 
    # If loaded, they should be different.
    last_layer_weights = model.get_layer('predictions').get_weights()
    print(f"Last Layer Weights Mean: {np.mean(last_layer_weights[0])}")
    print(f"Last Layer Weights Std: {np.std(last_layer_weights[0])}")
    
    # 5. Test Prediction with Random Noise (Normalized)
    print("\n--- Test Prediction (Noise) ---")
    dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
    # DenseNet preprocess expects 0-255 inputs if passing to 'preprocess_input'? 
    # Actually densenet.preprocess_input scales to 0-1 or -1 to 1.
    # Documentation says: "will scale pixels between 0 and 1" and then normalize.
    # Let's check what our main.py does.
    
    # main.py does: 
    # image = image.resize((224, 224)) -> PIL default is 0-255
    # image_array = np.array(image) -> 0-255
    # processed_image = preprocess_input(image_array)
    
    # Simulate main.py
    dummy_input = np.random.randint(0, 255, (1, 224, 224, 3)).astype(np.float32)
    processed = densenet_preprocess(dummy_input.copy())
    
    print(f"Input Prob Range: {processed.min()} to {processed.max()}")
    
    preds = model.predict(processed, verbose=0)
    print("Predictions (Raw Noise):")
    print(preds[0])
    
    # 6. Test with a White Image (Simulate X-ray background?)
    white = np.ones((1, 224, 224, 3)).astype(np.float32) * 255
    processed_white = densenet_preprocess(white.copy())
    preds_white = model.predict(processed_white, verbose=0)
    print("\nPredictions (White Image - Standard Preprocess):")
    print(preds_white[0])

    # 7. Test with 0-1 Scaling (Alternative Preprocessing)
    print("\n--- Test Prediction (0-1 Scaling) ---")
    # Some Keras models expect 0-1
    grey_01 = np.ones((1, 224, 224, 3)).astype(np.float32) * 0.5
    preds_01 = model.predict(grey_01, verbose=0)
    print("Predictions (Grey Image 0.5):")
    print(preds_01[0])
    
    # 8. Test with "Same as Training" (GitHub repo says: rescale=1./255 ?)
    # The original CheXNet paper/code often uses ImageNet mean/std.
    # keras.applications.densenet.preprocess_input does that. 
    # But maybe this specific .h5 file expects something else?
    # Let's try raw 0-255 just in case
    print("\n--- Test Prediction (Raw 0-255) ---")
    raw_255 = np.ones((1, 224, 224, 3)).astype(np.float32) * 127
    preds_raw = model.predict(raw_255, verbose=0)
    print(preds_raw[0])

if __name__ == "__main__":
    debug_model()
