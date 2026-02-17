import os
import io
import asyncio
import numpy as np
from main import app, load_services, predict_smart
from fastapi import UploadFile
from unittest.mock import MagicMock, AsyncMock

# Mock BackgroundTasks since we don't want to actually spawn threads in a simple script
class MockBackgroundTasks:
    def add_task(self, func, *args, **kwargs):
        print(f"[Background Task] Would execute: {func.__name__}")

async def run_integration_test():
    print(">>> Starting Integration Test...")
    
    # 1. Force Load Services
    print("1. Loading Services...")
    load_services()
    
    # 2. Create Dummy Image (224x224 RGB)
    print("2. Creating Dummy Image...")
    try:
        from PIL import Image
        img = Image.new('RGB', (224, 224), color = 'red')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()
        
        # Create UploadFile mock
        file_mock = MagicMock(spec=UploadFile)
        file_mock.filename = "test_xray.jpg"
        file_mock.content_type = "image/jpeg"
        file_mock.read = AsyncMock(return_value=img_bytes)
        file_mock.size = len(img_bytes)
        
    except Exception as e:
        print(f"Error creating dummy image: {e}")
        return

    # 3. Simulate Prediction Request
    print("3. Calling predict_smart()...")
    try:
        # We bypass API key check for internal test or just pass it if we were using client
        # Here we call the function directly
        
        response = await predict_smart(
            background_tasks=MockBackgroundTasks(),
            file=file_mock,
            scan_type="chest_xray",
            api_key="dev_key_for_development_only"
        )
        
        print("\n>>> Test Result: SUCCESS ✅")
        print(f"Model Version: {response['model_version']}")
        print(f"Inference Time: {response['inference_time_ms']}ms")
        print(f"Top Prediction: {max(response['predictions'], key=response['predictions'].get)}")
        print(f"Handcrafted Features: {len(response.get('handcrafted_features', {}))} found")
        print(f"Embedding Generated: {response.get('embedding_generated')}")
        print(f"Similar Cases Found: {len(response.get('similar_cases', []))}")
        
    except Exception as e:
        print(f"\n>>> Test Result: FAILED ❌")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_integration_test())
