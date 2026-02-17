# Hailthyfy - Advanced AI Healthcare Platform

**Hailthyfy** is a next-generation healthcare analytics platform designed to provide transparent, explainable AI diagnostics for chest X-rays. Unlike traditional "black box" AI, Hailthyfy uses a **Fusion Engine** that combines Deep Learning, Handcrafted Physiological Features, and Historical Case Matching to provide a trustworthy diagnosis with a "Explainable AI" dashboard.

## 🚀 Key Features

*   **Explainable AI (XAI):** Visualizes the "Why" behind every prediction.
*   **Fusion Engine ("The Coach"):** A smart logic system that arbitrates between:
    *   **DenseNet121:** Deep Learning model for 14 disease classifications.
    *   **Handcrafted Features:** Lung asymmetry, opacity analysis, and texture entropy.
    *   **Vector Database (RAG):** Checks thousands of historical cases to find similar patient profiles.
*   **Interactive Dashboard:** View original X-rays alongside generated heatmaps, segmentation masks, and similarity search results.
*   **Secure & Scalable:** Built on Node.js/Express with MongoDB and Python FastAPI for high-performance inference.

## 🛠️ Tech Stack

### Backend (Core)
*   **Node.js & Express:** Main application server.
*   **MongoDB (Mongoose):** User data and medical record storage.
*   **EJS:** Server-side rendering for responsive views.
*   **Passport.js:** Secure user authentication.

### ML Service (The Brain)
*   **Python (FastAPI):** High-performance ML inference server.
*   **TensorFlow/Keras:** DenseNet121 model execution.
*   **OpenCV & Scikit-Image:** Handcrafted feature extraction (Gabor filters, LBP).
*   **ChromaDB:** Vector database for finding similar historical cases (KNN).

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/anirbansantra748/hailthyfy.git
cd hailthyfy
```

### 2. Setup Node.js Backend
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# (Update .env with your MongoDB URI and Session Secrets)
```

### 3. Setup Python ML Service
```bash
cd ml_service

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4. Running the Application
You need to run both the Node.js server and the Python ML service.

**Terminal 1 (Node.js):**
```bash
npm run dev
# Server running at http://localhost:3000
```

**Terminal 2 (Python ML Service):**
```bash
cd ml_service
python main.py
# ML API running at http://localhost:8000
```

---

## 🧠 How It Works (The Fusion Logic)

1.  **Preprocessing:** X-ray is normalized and resized.
2.  **Visual Analysis:** DenseNet model predicts probabilities for 14 conditions (e.g., Pneumonia, Edema).
3.  **Physiological Check:**
    *   **Asymmetry:** Checks if one lung is significantly hazier than the other.
    *   **Opacity:** Counts abnormal white spots.
4.  **Historical Check:** Vector DB finds top 5 similar past cases.
5.  **Final Fusion:**
    *   *If AI says "Healthy" but Lungs are Asymmetric ->* **Flag for Review.**
    *   *If AI is unsure but History + Features agree ->* **Boost Confidence.**

## 📊 API Endpoints

### Main Application
*   `GET /`: Landing Page.
*   `POST /users/login`: User Authentication.
*   `POST /prediction/upload`: Upload X-ray for analysis.
*   `GET /prediction/xray/:id`: View explainable results.

### ML Service (Internal)
*   `POST /predict`: Accepts image file, returns JSON with diagnosis, features, and logs.

## 👥 Contributors
*   **Anirban Santra** - Lead Developer

---
*Built for trust in Medical AI.*
