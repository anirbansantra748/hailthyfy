
import unittest
import numpy as np
import cv2
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from features_v2 import RadiologyFeatureExtractor

class TestRadiologyFeatures(unittest.TestCase):
    def setUp(self):
        self.extractor = RadiologyFeatureExtractor()
        
        # Create a synthetic image
        # 512x512, background 200 (bright), lungs 50 (dark)
        self.img_np = np.ones((512, 512), dtype=np.uint8) * 200
        
        # Left Lung (Image Right) - Normal
        cv2.ellipse(self.img_np, (350, 256), (60, 120), 0, 0, 360, 50, -1)
        
        # Right Lung (Image Left) - Abnormal (Pneumonia -> Brighter Spot)
        cv2.ellipse(self.img_np, (162, 256), (60, 120), 0, 0, 360, 50, -1)
        # R_Lower is roughly y > 340
        # Lung Y range: 256 +/- 120 = [136, 376]
        # Opacity must be inside lung to be segmented as "lung"
        # Let's put it at Y=300 (Middle-Lower)
        cv2.circle(self.img_np, (162, 300), 20, 150, -1) # Opacity (150 intensity vs 50 lung)

        # Convert to bytes
        _, encoded = cv2.imencode('.png', self.img_np)
        self.img_bytes = encoded.tobytes()

    def test_feature_extraction(self):
        features = self.extractor.extract(self.img_bytes)
        
        # Check if we got features
        self.assertIsInstance(features, dict)
        self.assertGreater(len(features), 10)
        
        print("\nExtracted Radiology Features:")
        for k, v in features.items():
            if 'asym' in k or 'compactness' in k or 'mean' in k:
                print(f"{k}: {v:.4f}")
        
        # Specific Checks
        
        # 1. Zonal Means
        # R_Lower should be brighter than L_Lower due to the opacity
        r_lower_mean = features.get('R_Lower_mean', 0)
        l_lower_mean = features.get('L_Lower_mean', 0)
        print(f"L_Lower Mean: {l_lower_mean}, R_Lower Mean: {r_lower_mean}")
        
        # Since we put a bright spot (150) in R_Lower (50), mean should be higher
        self.assertGreater(r_lower_mean, l_lower_mean)
        
        # 2. Asymmetry
        asym_lower = features.get('asym_Lower_opacity', 0)
        self.assertGreater(asym_lower, 0.1, "Should detect asymmetry in lower zone")
        
        # 3. Morphology
        # Should detect the opacity
        opacity_area = features.get('max_opacity_area', 0)
        self.assertGreater(opacity_area, 0, "Should detect opacity contour")
        
        compactness = features.get('max_opacity_compactness', 0)
        # A circle has compactness ~ 4pi*r^2 / (2pi*r)^2 = 1.0 (ideally)
        # 4*pi*area / perimeter^2
        # Circle area pi*r^2, perim 2*pi*r -> 4*pi*pi*r^2 / 4*pi^2*r^2 = 1
        # Our calculation might be slightly different depending on formula used (is it inverse?)
        # My formula: (4 * np.pi * area) / (perimeter ** 2). Yes, 1.0 for circle.
        print(f"Opacity Compactness: {compactness}")
        self.assertGreater(compactness, 0.5)

if __name__ == '__main__':
    unittest.main()
