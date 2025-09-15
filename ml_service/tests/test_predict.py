#!/usr/bin/env python3
"""
Test script for CheXNet ML Service
Tests the prediction endpoint with sample files
"""

import requests
import json
import os
import sys
from pathlib import Path

# Configuration
ML_SERVICE_URL = "http://localhost:8000"
API_KEY = "dev_key_for_development_only"  # Use your actual API key

def test_health_endpoint():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Model loaded: {data.get('model_loaded')}")
            print(f"   Model version: {data.get('model_version')}")
            print(f"   Labels count: {data.get('labels_count')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_prediction_endpoint(image_path):
    """Test the prediction endpoint with a sample image"""
    print(f"\nTesting prediction endpoint with {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        # Prepare the request
        headers = {
            "x-ml-api-key": API_KEY
        }
        
        files = {
            "file": open(image_path, "rb")
        }
        
        data = {
            "scan_type": "chest"
        }
        
        # Make the request
        response = requests.post(
            f"{ML_SERVICE_URL}/api/v1/predict",
            headers=headers,
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   Inference ID: {result.get('inference_id')}")
            print(f"   Model version: {result.get('model_version')}")
            print(f"   Inference time: {result.get('inference_time_ms')}ms")
            print(f"   Labels count: {len(result.get('labels', []))}")
            print(f"   Predictions count: {len(result.get('predictions', {}))}")
            
            # Validate response structure
            required_fields = ["model_version", "inference_id", "inference_time_ms", "predictions", "labels"]
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            # Validate predictions
            predictions = result.get("predictions", {})
            labels = result.get("labels", [])
            
            if len(predictions) != len(labels):
                print(f"❌ Predictions count ({len(predictions)}) doesn't match labels count ({len(labels)})")
                return False
            
            # Check prediction values are between 0 and 1
            invalid_predictions = [k for k, v in predictions.items() if not (0 <= v <= 1)]
            if invalid_predictions:
                print(f"❌ Invalid prediction values (not between 0-1): {invalid_predictions}")
                return False
            
            print("✅ All validations passed!")
            return True
            
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return False

def test_invalid_api_key():
    """Test with invalid API key"""
    print("\nTesting invalid API key...")
    
    try:
        headers = {"x-ml-api-key": "invalid_key"}
        response = requests.post(
            f"{ML_SERVICE_URL}/api/v1/predict",
            headers=headers,
            files={"file": open("tests/sample_chest_xray.jpg", "rb")},
            timeout=30
        )
        
        if response.status_code == 401:
            print("✅ Invalid API key correctly rejected")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Invalid API key test error: {e}")
        return False

def test_missing_api_key():
    """Test without API key"""
    print("\nTesting missing API key...")
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/v1/predict",
            files={"file": open("tests/sample_chest_xray.jpg", "rb")},
            timeout=30
        )
        
        if response.status_code == 401:
            print("✅ Missing API key correctly rejected")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Missing API key test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting CheXNet ML Service Tests")
    print("=" * 50)
    
    # Check if ML service is running
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ ML service not responding at {ML_SERVICE_URL}")
            print("   Please start the ML service first:")
            print("   cd ml_service && python main.py")
            return False
    except:
        print(f"❌ Cannot connect to ML service at {ML_SERVICE_URL}")
        print("   Please start the ML service first:")
        print("   cd ml_service && python main.py")
        return False
    
    # Run tests
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Prediction Endpoint", lambda: test_prediction_endpoint("tests/sample_chest_xray.jpg")),
        ("Invalid API Key", test_invalid_api_key),
        ("Missing API Key", test_missing_api_key)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! ML service is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
