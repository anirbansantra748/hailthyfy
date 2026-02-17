
import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
import json
import numpy as np
from fastapi.testclient import TestClient

# Add parent path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import app. We need to patch services so they don't load real heavy models
with patch('main.load_services') as mock_load:
    from main import app, load_services

class TestIntegration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        
        # Mock Global Services in main
        # We need to access the globals in main module
        import main
        main.model = MagicMock()
        main.handcrafted_extractor = MagicMock()
        main.fusion_engine = MagicMock()
        main.vectordb = MagicMock()
        main.feature_extractor_model = MagicMock() # Optional
        
        # Setup common mocks
        # Mock Handcrafted Extractor
        main.handcrafted_extractor.extract = MagicMock(return_value={
            'lung_area_ratio': 0.45,
            'global_lung_mean': 100.0,
            'asym_Lower_opacity': 0.05
        })
        
        # Mock Fusion Engine
        main.fusion_engine.fuse = MagicMock(return_value={
            "final_diagnosis": "Normal",
            "confidence_score": 0.95,
            "adjustments": [],
            "flags": [],
            "summary": "High Confidence Normal"
        })
        
        # Mock VectorDB
        main.vectordb.search_similar = MagicMock(return_value=[])
        
        # Mock Model Predict (Async? No, run_in_threadpool handles sync calls)
        # Model.predict returns numpy array of shape (1, 14)
        # 14 labels
        fake_preds = np.zeros((1, 14))
        fake_preds[0][0] = 0.1 # Atelectasis
        fake_preds[0][12] = 0.05 # Pneumonia
        # Assume "Normal" isn't a label in 14-class, usually implicit?
        # Wait, DEFAULT_LABELS in main.py has 14 classes. "No Finding" is usually separate or implied by low scores.
        # But our fusion engine handles "Normal" string.
        # Let's assume prediction_dict in main maps these.
        # If all low, what happens? Main logic:
        # top_prediction = max score.
        # So providing some scores:
        main.model.predict = MagicMock(return_value=fake_preds)
        
        # Mock Feature Extractor Model
        main.feature_extractor_model.predict = MagicMock(return_value=np.zeros((1, 1024)))

        # Create dummy image bytes (valid JPEG)
        import cv2
        img = np.zeros((224, 224, 3), dtype=np.uint8)
        _, encoded = cv2.imencode('.jpg', img)
        fake_image = encoded.tobytes()
        
        # Mock dependencies specifically for this test if needed
        # We already mocked them in setUp
        
        response = self.client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", fake_image, "image/jpeg")},
            headers={"x-ml-api-key": "dev_key_for_development_only"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response Error: {response.json()}")
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify Structure
        self.assertIn("final_diagnosis", data)
        self.assertIn("confidence_score", data)
        self.assertIn("clinical_notes", data)
        self.assertIn("safety_flags", data)
        self.assertIn("handcrafted_features", data)
        
        # Verify Mocks were called
        import main
        main.handcrafted_extractor.extract.assert_called()
        main.model.predict.assert_called()
        main.fusion_engine.fuse.assert_called()
        
    def test_missing_api_key(self):
        fake_image = os.urandom(100)
        response = self.client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", fake_image, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()
