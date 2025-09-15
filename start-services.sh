#!/bin/bash

echo "🚀 Starting Healthfy Services..."

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# Start Python ML service
echo "🐍 Starting Python ML Service..."
cd ml_service
pip install -r requirements.txt
python3 simple_main.py &
ML_PID=$!
cd ..

# Wait a bit for ML service to boot
sleep 5

# Start Node.js
echo "⚡ Starting Node.js Application on port $PORT..."
node app.js &
NODE_PID=$!

# Graceful shutdown
cleanup() {
    echo "🔄 Shutting down services..."
    kill $ML_PID $NODE_PID
    exit
}
trap cleanup SIGINT SIGTERM

wait $NODE_PID $ML_PID
