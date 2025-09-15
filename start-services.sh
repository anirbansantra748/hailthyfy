#!/bin/bash

echo "🚀 Starting Healthfy Services..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# Start Python ML service in background
echo "🐍 Starting Python ML Service..."
cd ml_service
python3 simple_main.py &
ML_PID=$!

# Wait a few seconds to ensure ML service starts
sleep 2

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
