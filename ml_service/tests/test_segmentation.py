
import unittest
import numpy as np
import cv2
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from segmentation import LungSegmenter

class TestLungSegmenter(unittest.TestCase):
    def setUp(self):
        self.segmenter = LungSegmenter()
        
        # Create a dummy synthetic X-ray image (512x512)
        # Background: White/Gray (Bones/Tissue) -> Inverted: Dark
        # Lungs: Dark (Air) -> Inverted: Bright
        
        # In standard X-ray: Lungs are black (0), Bones are white (255)
        # We will create a dark background (0) with two bright ellipses (lungs)
        # Wait, in X-ray: Lungs are LOW intensity.
        # So we create a simplified "X-ray":
        self.img = np.ones((512, 512), dtype=np.uint8) * 200 # Bright background (tissue/bone)
        
        # Draw two dark ellipses for lungs
        # Left Lung (Image Right)
        cv2.ellipse(self.img, (350, 256), (60, 120), 0, 0, 360, 50, -1) # Dark lung
        # Right Lung (Image Left)
        cv2.ellipse(self.img, (162, 256), (60, 120), 0, 0, 360, 50, -1) # Dark lung

    def test_preprocess(self):
        processed = self.segmenter.preprocess(self.img)
        self.assertEqual(processed.shape, (512, 512))
        self.assertEqual(processed.dtype, np.uint8)

    def test_segmentation_mask(self):
        # The segmenter expects valid lungs to be segmented
        mask = self.segmenter.segment_lungs(self.img)
        
        # Check output is binary
        unique = np.unique(mask)
        self.assertTrue(set(unique).issubset({0, 255}))
        
        # Check we found something (lung area > 0)
        lung_area = np.count_nonzero(mask)
        self.assertGreater(lung_area, 1000, "Mask should not be empty")
        
        # Check area ratio
        ratio = self.segmenter.calculate_lung_area_ratio(mask)
        print(f"Calculated Lung Area Ratio: {ratio:.4f}")
        self.assertTrue(0.15 < ratio < 0.60, "Synthetic lungs should be within valid ratio")

    def test_zonal_splitting(self):
        mask = self.segmenter.segment_lungs(self.img)
        zones = self.segmenter.get_zonal_masks(mask)
        
        print("\nZonal Mask Areas:")
        expected_zones = ['L_Upper', 'L_Middle', 'L_Lower', 'R_Upper', 'R_Middle', 'R_Lower']
        for z_name in expected_zones:
            self.assertIn(z_name, zones)
            area = np.count_nonzero(zones[z_name])
            print(f"{z_name}: {area} pixels")
            # In our synthetic image, we have both lungs, so all zones should have some pixels
            # The splitting might not be perfect for ellipses, but should be > 0
            self.assertGreater(area, 0, f"Zone {z_name} is empty")

if __name__ == '__main__':
    unittest.main()
