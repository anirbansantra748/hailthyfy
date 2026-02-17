
import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fusion import FusionEngine

class TestFusionEngine(unittest.TestCase):
    def setUp(self):
        self.coach = FusionEngine()
        
    def test_anatomy_rejection(self):
        # Invalid anatomy
        dl_pred = {'Pneumonia': 0.9}
        features = {'lung_area_ratio': 0.05} # Too small
        
        result = self.coach.fuse(dl_pred, features)
        print(f"\nAnatomy Test Result: {result}")
        
        self.assertLessEqual(result['confidence_score'], 0.4)
        self.assertIn("Anatomy Unclear", result['flags'][0])

    def test_disagreement_downgrade(self):
        # AI says Sick, but Physiology says Symmetric (Healthy)
        dl_pred = {'Pneumonia': 0.9}
        features = {
            'lung_area_ratio': 0.3, # Valid
            'asym_Lower_opacity': 0.05, # Very symmetric
            'asym_Upper_opacity': 0.02
        }
        
        result = self.coach.fuse(dl_pred, features)
        print(f"\nDisagreement Test Result: {result}")
        
        # Expected downgrade
        self.assertLess(result['confidence_score'], 0.9)
        self.assertTrue(any("Downgraded" in note for note in result['adjustments']))

    def test_confirmation_boost(self):
        # AI says Sick, Physiology confirms Asymmetry
        dl_pred = {'Pneumonia': 0.8}
        features = {
            'lung_area_ratio': 0.3,
            'asym_Lower_opacity': 0.35, # High asymmetry
        }

        result = self.coach.fuse(dl_pred, features)
        print(f"\nConfirmation Test Result: {result}")
        
        self.assertGreater(result['confidence_score'], 0.8)
        self.assertTrue(any("Boosted" in note for note in result['adjustments']))
        
    def test_normal_alert(self):
        # AI says Normal, Physiology says Asymmetric
        dl_pred = {'Normal': 0.9}
        features = {
            'lung_area_ratio': 0.3,
            'asym_Lower_opacity': 0.4, # High asymmetry!
        }
        
        result = self.coach.fuse(dl_pred, features)
        print(f"\nNormal Alert Test Result: {result}")
        
        # Should flag
        self.assertTrue(any("Normal confidence reduced" in note for note in result['adjustments']))
        self.assertTrue(len(result['flags']) > 0)

if __name__ == '__main__':
    unittest.main()
