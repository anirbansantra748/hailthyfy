#!/bin/bash

# 🏥 Healthfy - Render Build Script
# This script installs both Node.js and Python dependencies

echo "🔨 Building Healthfy Application..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python and pip if not available
echo "🐍 Setting up Python environment..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python3 not found, installing..."
    apt-get update && apt-get install -y python3 python3-pip
fi

# Install Python dependencies
echo "📦 Installing Python ML dependencies..."
if [ -f "ml_service/requirements.txt" ]; then
    pip3 install -r ml_service/requirements.txt
else
    echo "⚠️  No requirements.txt found in ml_service/"
fi

# Make start script executable
chmod +x start-services.sh

echo "✅ Build completed successfully!"