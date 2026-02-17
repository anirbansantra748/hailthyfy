# X-Ray Processing Walkthrough: "Right Lower Lobe Pneumonia"

This document illustrates exactly how the **HealthFy Radiology Engine** processes a single image, step-by-step.

## Scenario
*   **Patient**: Male, 45 years old.
*   **Condition**: Early Pneumonia in the **Right Lower Lung**.
*   **Input**: `patient_xray_001.png` (2048x2048 pixels, Grayscale).

---

## Step 1: The "Bouncer" (Anatomy Validator)
*Goal: Is this actually a valid chest X-ray?*

1.  **Lung Segmentation**: The system generates a binary mask of the lungs.
2.  **Calculation**:
    *   `Total Image Pixels` = 2048 * 2048 = 4,194,304
    *   `Lung Mask Pixels` = 1,250,000 (detected white pixels in mask)
    *   `Lung Area Ratio` = 1,250,000 / 4,194,304 = **29.8%**
3.  **Check**:
    *   Rule: Is 15% < Ratio < 60%?
    *   Result: **PASS** (Normal chest X-ray range).

---

## Step 2: View Classification & Standardization
*Goal: Adjust expectations based on how the image was taken.*

1.  **Clavicle Analysis**: Low clavicle angle detected.
2.  **Scapula Analysis**: Scapulae are outside the lung fields.
3.  **Result**: **PA View** (Standard Standing X-ray).
4.  **Action**: Set `Cardiomegaly_Threshold = 0.50` (Strict).
    *   *(If AP View, we would relax this to 0.60 because hearts look bigger in portable scans)*.

---

## Step 3: Zonal Segmentation (The "Grid")
The image is digitally sliced into **6 Zones**:

| Zone | Left Lung (L) | Right Lung (R) |
| :--- | :--- | :--- |
| **Upper** | `L_Upper` (Normal) | `R_Upper` (Normal) |
| **Middle** | `L_Middle` (Normal) | `R_Middle` (Normal) |
| **Lower** | `L_Lower` (Normal) | **`R_Lower` (Pneumonia)** |

---

## Step 4: Parallel Processing (The "Brain" & "Eyes")

### Path A: Deep Learning (The "Brain")
*   **Model**: DenseNet121 (Pre-trained on CheXNet).
*   **Input**: Resized image (224x224).
*   **Raw Output**: `Pneumonia: 0.82`, `Infiltration: 0.65`, `Normal: 0.10`.

### Path B: Handcrafted Features (The "Eyes") - *Calculating the Proof*

#### 1. Opacity Analysis (Histogram)
*   **L_Lower Mean Intensity**: 45 (Darker = Air = Healthy)
*   **R_Lower Mean Intensity**: **110** (Brighter = Fluid = Sick)
*   **Normalization**: Global Mean is 50.
    *   `L_Lower_Score` = 45/50 = 0.9 (Normal)
    *   `R_Lower_Score` = 110/50 = **2.2 (Abnormal Opacity)**

#### 2. Bilateral Asymmetry (The "Mirror Test")
*   *Formula*: `|L - R| / (L + R)`
*   **Lower Zone Asymmetry**:
    *   `|45 - 110| / (45 + 110)` = `65 / 155` = **0.42** (High Asymmetry)
*   **Conclusion**: Significant difference between left and right lower lungs.

#### 3. Texture Analysis (GLCM - Smoothness)
*   **R_Lower Contrast**: Low (Hazy/Cloudy) → Indicates Consolidation.
*   **L_Lower Contrast**: High (Sharp Ribs/Vessels) → Indicates Healthy.

---

## Step 5: The "Coach" (Logic Gating)
*Goal: Combine visual pattern (DL) with physical proof (Handcrafted).*

**Inputs**:
1.  **DL Score (Pneumonia)**: 0.82
2.  **Asymmetry Penalty**: 0.0 (Because Asymmetry CONFIRMS Pneumonia).
    *   *Note: If DL said "Normal" but Asymmetry was 0.42, we would apply a penalty to the Normal score.*
3.  **Anatomy Penalty**: 0.0 (Image Quality is Good).

**Logic Rule #1 (Confirmation)**:
> IF `DL_Pneumonia > 0.7` AND `Lower_Zone_Opacity > 1.5` AND `Asymmetry > 0.3`:
> **BOOST CONFIDENCE** by 10%.

**Calculation**:
`Final_Score` = 0.82 + 0.08 (Boost) = **0.90**

---

## Final Report Generation

### **Diagnosis: PNEUMONIA (Confidence: 90.0%)**

### **Clinical Reasoning (The "Why"):**
1.  **Visual Pattern**: AI matched patterns of consolidation (DenseNet).
2.  **Physiological Proof**:
    *   **Asymmetry Detected**: Right Lower Lung is **42% more opaque** than Left.
    *   **Zonal Analysis**: Abnormality is localized to the **Right Basal Zone**.
3.  **Reliability**:
    *   Anatomy Check: Passed (PA View).
    *   Image Quality: High.

### **Similar Verified Cases**:
> Found 3 confirmed Pneumonia cases with similar **Right-Lower-Lobe Opacity** distributions.
