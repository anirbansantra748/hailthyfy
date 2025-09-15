import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image

# Define the FastAPI app
app = FastAPI()

# Load the pre-trained CheXNet model
# Make sure to provide the correct path to your model file
MODEL_PATH = os.environ.get("CHEXNET_MODEL_PATH", "chexnet_model.h5")
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model file not found at {MODEL_PATH}. Please set the CHEXNET_MODEL_PATH environment variable.")
model = load_model(MODEL_PATH)

# Define the list of diseases that CheXNet can predict
DISEASE_LIST = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", "Nodule",
    "Pneumonia", "Pneumothorax", "Consolidation", "Edema", "Emphysema",
    "Fibrosis", "Pleural_Thickening", "Hernia"
]

class ImagePath(BaseModel):
    path: str

def preprocess_image(img_path):
    """Preprocesses the image for the CheXNet model."""
    try:
        img = Image.open(img_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0  # Normalize to [0, 1]
        return img_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error preprocessing image: {e}")

@app.post("/predict/")
async def predict(image_path: ImagePath):
    """
    Receives the path to an X-ray image, preprocesses it, and returns disease predictions.
    """
    # Construct the full path to the image
    # This assumes the 'uploads' directory is at the root of the Node.js project
    full_image_path = os.path.join("..", "uploads", image_path.path)

    if not os.path.exists(full_image_path):
        raise HTTPException(status_code=404, detail="Image not found at the specified path")

    # Preprocess the image and make a prediction
    processed_image = preprocess_image(full_image_path)
    prediction = model.predict(processed_image)

    # Format the prediction results
    results = {disease: float(prediction[0][i]) for i, disease in enumerate(DISEASE_LIST)}
    return results

@app.get("/")
def read_root():
    return {"message": "CheXNet Prediction Service is running."}