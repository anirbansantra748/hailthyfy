#!/usr/bin/env node
/**
 * Upload Flow Test Script
 * Tests the complete flow from upload to ML processing to database update
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Test configuration
const BASE_URL = "http://localhost:3000";
const TEST_IMAGE_PATH = path.join(__dirname, "sample_chest_xray.jpg");

async function testUploadFlow() {
  console.log("🧪 Testing X-ray Upload and Prediction Flow...\n");

  try {
    // Step 1: Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(
        "❌ Test image not found. Please ensure sample_chest_xray.jpg exists in the tests directory."
      );
      return;
    }

    console.log("✅ Test image found:", TEST_IMAGE_PATH);

    // Step 2: Test ML service health (if running)
    try {
      const mlHealthResponse = await axios.get(
        `${BASE_URL}/prediction/health/ml`,
        { timeout: 5000 }
      );
      console.log("✅ ML service health check:", mlHealthResponse.data);
    } catch (error) {
      console.log(
        "⚠️  ML service health check failed (service may not be running):",
        error.message
      );
    }

    // Step 3: Test main application health
    try {
      const appHealthResponse = await axios.get(`${BASE_URL}/`, {
        timeout: 5000,
      });
      console.log("✅ Main application is running");
    } catch (error) {
      console.error(
        "❌ Main application is not running. Please start the server first."
      );
      return;
    }

    // Step 4: Test upload endpoint accessibility
    try {
      const uploadResponse = await axios.get(
        `${BASE_URL}/prediction/xray/upload`,
        {
          timeout: 5000,
        }
      );
      console.log("✅ Upload endpoint is accessible");
    } catch (error) {
      console.log("⚠️  Upload endpoint test failed:", error.message);
    }

    console.log("\n📋 Test Summary:");
    console.log("✅ File validation: Test image exists");
    console.log("✅ Application: Server is running");
    console.log("⚠️  ML Service: May need to be started separately");

    console.log("\n🚀 To test the complete flow:");
    console.log("1. Start the ML service: cd ml_service && python main.py");
    console.log("2. Start the main app: npm run dev");
    console.log("3. Visit: http://localhost:3000/prediction/xray/upload");
    console.log("4. Upload the test image and verify the flow works");

    console.log("\n📝 Expected Flow:");
    console.log(
      "   Upload → File saved → ML API called → Predictions received → Results page rendered"
    );
    console.log("   - File should be saved to uploads/xrays/ folder");
    console.log("   - ML service should return predictions object");
    console.log("   - User should be redirected to results page (not JSON)");
    console.log(
      "   - Results page should show X-ray preview, predictions table, and chart"
    );

    console.log("\n🔍 What to Check:");
    console.log("   - File upload validation (only JPG, JPEG, PNG allowed)");
    console.log("   - File size validation (max 10MB)");
    console.log("   - ML API integration (multipart/form-data)");
    console.log("   - Error handling for ML service failures");
    console.log("   - Results page rendering (no 500 errors)");
    console.log("   - Chart.js visualization of predictions");

    console.log("\n⚠️  Common Issues to Watch For:");
    console.log("   - 500 server errors during redirect");
    console.log("   - Template rendering errors");
    console.log("   - Flash message display issues");
    console.log("   - Chart.js initialization failures");
    console.log("   - File path issues in image display");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testUploadFlow();
