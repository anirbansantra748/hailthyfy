import requests
import time

def test_prediction():
    base_url = "http://localhost:8000"
    predict_url = f"{base_url}/api/v1/predict"
    health_url = f"{base_url}/health"
    headers = {"x-ml-api-key": "dev_key_for_development_only"}
    
    print(f"Checking Health at {health_url}...")
    try:
        health_resp = requests.get(health_url)
        print(f"Health Status: {health_resp.status_code}")
        print(f"Health Response: {health_resp.text}")
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return

    # Create a dummy white image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (512, 512), color = 'white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    files = {'file': ('test_image.png', img_byte_arr, 'image/png')}
    
    print(f"\nSending POST request to {predict_url}...")
    try:
        start = time.time()
        response = requests.post(predict_url, headers=headers, files=files)
        latency = (time.time() - start) * 1000
        
        if response.status_code == 200:
            print(f"Success! Latency: {latency:.2f}ms")
            print("Response:", response.json())
            print("\nCheck the SERVER LOGS now to see the 'Step 1/6' through 'Step 6/6' trace.")
        else:
            print(f"Failed. Status: {response.status_code}")
            print(f"Reason: {response.reason}")
            print(f"Text: {response.text}")
            
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Ensure main.py is running on port 8000")

if __name__ == "__main__":
    test_prediction()
