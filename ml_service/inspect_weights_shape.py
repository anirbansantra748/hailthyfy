import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
import h5py

MODEL_PATH = "./model/chexnet_model.h5"

def inspect_weights():
    print(f"Inspecting: {MODEL_PATH}")
    
    try:
        # Open the h5 file directly to look at keys
        with h5py.File(MODEL_PATH, 'r') as f:
            print("Keys in H5:", list(f.keys()))
            if 'model_weights' in f:
                # Keras 2 saving format often has model_weights group
                root = f['model_weights']
            else:
                root = f
            
            # Try to find the predictions layer
            # It might be named 'predictions' or 'dense_Something'
            print("Layers found in weights:")
            found_dense = False
            for layer_name in root.keys():
                print(f" - {layer_name}")
                if 'pred' in layer_name.lower() or 'dense' in layer_name.lower() or 'fc' in layer_name.lower():
                    # Check shape of weights
                    g = root[layer_name]
                    # usually has 'layer_name' subkey again
                    if layer_name in g:
                        w_group = g[layer_name]
                        if 'kernel:0' in w_group:
                            w = w_group['kernel:0']
                            print(f"   >>> WEIGHT KERNEL SHAPE: {w.shape}")
                            found_dense = True
                            
                            # Analysis
                            if w.shape[0] == 1024:
                                print("   >>> [ANALYSIS] Expects GlobalAveragePooling2D (1024 inputs)")
                            elif w.shape[0] > 1024:
                                print(f"   >>> [ANALYSIS] Expects Flatten/Larger Input ({w.shape[0]} inputs)")
                            
                            if w.shape[1] == 14:
                                print("   >>> [ANALYSIS] Correctly has 14 outputs.")
                            else:
                                print(f"   >>> [ANALYSIS] Output mismatch! Has {w.shape[1]} outputs.")

    except Exception as e:
        print(f"H5 Inspection failed: {e}")

if __name__ == "__main__":
    inspect_weights()
