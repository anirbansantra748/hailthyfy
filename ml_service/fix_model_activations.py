import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
import cv2

MODEL_PATH = "./model/chexnet_model.h5"

def preprocess_imagenet_mean_std(img):
    """
    Standard ImageNet preprocessing:
    1. Scale to 0-1
    2. Subtract Mean [0.485, 0.456, 0.406]
    3. Divide by Std [0.229, 0.224, 0.225]
    """
    # Assume img is 0-255 RGB
    img = img / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img = (img - mean) / std
    return img

def test_activations():
    print("--- Testing Model Activations with Different Preprocessing ---")
    
    # 1. Load Model
    base_model = DenseNet121(include_top=False, weights=None, input_shape=(224, 224, 3))
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    predictions = Dense(14, activation='sigmoid')(x)
    model = Model(inputs=base_model.input, outputs=predictions)
    
    try:
        model.load_weights(MODEL_PATH)
        print("Weights Loaded.")
    except Exception as e:
        print(f"Load Failed: {e}")
        return

    # 2. visual test (White Image)
    white_img = np.ones((224, 224, 3), dtype=np.float32) * 255
    
    # Method A: TF Preprocess (Samplewise 0-1 or -1..1?)
    from tensorflow.keras.applications.densenet import preprocess_input
    # Note: DenseNet preprocess_input in newer TF might just be / 255.0 and channel scaling
    # Let's verify what it does by printing
    test_arr = np.array([[[255, 0, 127]]], dtype=np.float32)
    print(f"TF Preprocess Logic Check: {preprocess_input(test_arr.copy())}")

    input_a = preprocess_input(np.expand_dims(white_img.copy(), axis=0))
    pred_a = model.predict(input_a, verbose=0)[0]
    
    # Method B: Explicit ImageNet Mean/Std
    input_b = preprocess_imagenet_mean_std(white_img.copy())
    input_b = np.expand_dims(input_b, axis=0) # Batch dim
    pred_b = model.predict(input_b, verbose=0)[0]
    
    # Method C: Raw 0-1
    input_c = (white_img.copy() / 255.0)[np.newaxis, ...]
    pred_c = model.predict(input_c, verbose=0)[0]

    print("\n--- Results ---")
    print(f"Method A (TF Preprocess) Max Prob: {pred_a.max():.6f}")
    print(f"Method B (ImageNet Mean/Std) Max Prob: {pred_b.max():.6f}")
    print(f"Method C (Raw 0-1) Max Prob: {pred_c.max():.6f}")
    
    print("\nTop 5 Predictions (Method B):")
    # Helper to print top indices
    top_indices = pred_b.argsort()[-5:][::-1]
    for idx in top_indices:
        print(f"Index {idx}: {pred_b[idx]:.6f}")

if __name__ == "__main__":
    test_activations()
