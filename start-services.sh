#!/bin/bash

# 🏥 Healthfy - Combined Service Startup Script
# This script starts both Node.js app and Python ML service

echo "🚀 Starting Healthfy Services..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export ML_API_URL=${ML_API_URL:-http://localhost:8000}

# Install Python dependencies if not already installed
echo "📦 Installing Python dependencies..."
if [ -f "ml_service/requirements.txt" ]; then
    pip install -r ml_service/requirements.txt
fi

# Start Python ML service in background
echo "🐍 Starting Python ML Service on port 8000..."
cd ml_service
uvicorn main:app --host 0.0.0.0 --port 8000 &
ML_PID=$!
cd ..

# Wait a moment for ML service to start
sleep 5

# Start Node.js application
echo "⚡ Starting Node.js Application on port $PORT..."
node app.js &
NODE_PID=$!

# Function to handle graceful shutdown
cleanup() {
    echo "🔄 Shutting down services..."
    kill $ML_PID $NODE_PID
    exit
}

# Set trap to handle termination signals
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $NODE_PID $ML_PID