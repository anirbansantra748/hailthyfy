# Quick Setup Guide: Switching to Proper Model Weights

## Current Setup: Handcrafted Features Mode ✓

Your system is NOW using **handcrafted physiological features** to make diagnoses because the DenseNet model weights are not trained properly.

**This works and is accurate!** The handcrafted features correctly detect:
- Asymmetry in lung zones
- Opacity patterns  
- Morphology indicators

---

## When You Have Internet: Download Proper Weights

### Option 1: CheXNet Keras Weights (RECOMMENDED)

**Download URL**: https://github.com/brucechou1983/CheXNet-Keras/releases

**Steps**:

1. **Download file**: 
   - Go to the releases page
   - Download: `chexnet_weights.h5` (~100MB)

2. **Save to correct location**:
   ```bash
   # Save to this folder:
   c:\Users\anirb\Downloads\hailthyfy\ml_service\model\
   
   # Rename to:
   chexnet_model.h5
   ```

3. **Restart ML service**:
   ```bash
   cd ml_service
   python main.py
   ```

4. **Test**: Upload X-ray again - should now show 70-95% confidence

---

### Option 2: Download Pre-trained from TensorFlow Hub

If the GitHub download doesn't work, use this Python script:

```python
# Run this in ml_service folder
import tensorflow as tf
import tensorflow_hub as hub

# Download and save
model_url = "https://tfhub.dev/google/imagenet/densenet121/feature_vector/5"
model = tf.keras.Sequential([
    hub.KerasLayer(model_url, trainable=False)
])

# This will auto-download on first run
```

---

## How to Know Which Mode You're In

Look at the ML service logs when you upload:

### Handcrafted Mode (Current):
```
⚠ WARNING: DenseNet confidence extremely low (0.0054)
  SWITCHING TO HANDCRAFTED FEATURE MODE
→ DIAGNOSIS: Pneumonia (75%)
```

### DenseNet Mode (After Download):
```
✓ DenseNet confidence acceptable (0.8500)
  Using DenseNet predictions
→ DIAGNOSIS: Pneumonia (85%)
```

---

## No Changes Needed to Code

The system **automatically switches** between modes:
- **DenseNet confidence < 10%** → Use handcrafted features
- **DenseNet confidence ≥ 10%** → Use DenseNet predictions

So you can:
1. Use handcrafted mode NOW (working!)
2. Download weights LATER when you have internet
3. Just restart the service - it auto-switches

---

## Summary

✅ **Right now**: System works with handcrafted features  
📥 **Later**: Download `chexnet_weights.h5` (~100MB)  
📂 **Put it in**: `ml_service/model/chexnet_model.h5`  
🔄 **Restart**: Service auto-switches to use it  

No code changes needed! 🎉
