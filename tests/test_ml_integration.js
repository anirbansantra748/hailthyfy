#!/usr/bin/env node
/**
 * ML Integration Test Script
 * Tests the complete flow from Node.js to Python ML service
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Configuration
const NODE_SERVICE_URL =
  process.env.NODE_SERVICE_URL || "http://localhost:3000";
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const API_KEY = process.env.ML_API_KEY || "dev_key_for_development_only";

// Test data
const TEST_IMAGE_PATH = path.join(__dirname, "sample_chest_xray.jpg");
const TEST_USER_CREDENTIALS = {
  email: "test@example.com",
  password: "testpassword123",
};

let authToken = null;
let testXrayId = null;

// Utility functions
function log(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

async function checkServiceHealth(serviceName, url, endpoint = "/health") {
  try {
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    if (response.status === 200) {
      log(`✅ ${serviceName} is healthy`, "HEALTH");
      return true;
    } else {
      log(
        `❌ ${serviceName} health check failed: ${response.status}`,
        "HEALTH"
      );
      return false;
    }
  } catch (error) {
    log(`❌ ${serviceName} is not responding: ${error.message}`, "HEALTH");
    return false;
  }
}

async function testMLServiceDirect() {
  log("Testing ML service directly...", "TEST");

  try {
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      log(`❌ Test image not found: ${TEST_IMAGE_PATH}`, "TEST");
      log("Please place a sample chest X-ray image at this path", "TEST");
      return false;
    }

    // Create form data
    const form = new FormData();
    form.append("file", fs.createReadStream(TEST_IMAGE_PATH));
    form.append("scan_type", "chest");

    // Make direct request to ML service
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/predict`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-ml-api-key": API_KEY,
        },
        timeout: 60000, // 60 seconds for ML processing
      }
    );

    if (response.status === 200) {
      const result = response.data;
      log("✅ ML service direct test passed", "TEST");

      // Validate response structure
      const requiredFields = [
        "model_version",
        "inference_id",
        "inference_time_ms",
        "predictions",
        "labels",
      ];
      const missingFields = requiredFields.filter(
        (field) => !(field in result)
      );

      if (missingFields.length > 0) {
        log(`❌ Missing required fields: ${missingFields.join(", ")}`, "TEST");
        return false;
      }

      // Validate predictions
      const predictions = result.predictions;
      const labels = result.labels;

      if (typeof predictions !== "object" || predictions === null) {
        log("❌ Predictions field is not an object", "TEST");
        return false;
      }

      if (!Array.isArray(labels) || labels.length === 0) {
        log("❌ Labels field is not a valid array", "TEST");
        return false;
      }

      if (Object.keys(predictions).length !== labels.length) {
        log(
          `❌ Predictions count (${
            Object.keys(predictions).length
          }) doesn't match labels count (${labels.length})`,
          "TEST"
        );
        return false;
      }

      // Check prediction values are between 0 and 1
      const invalidPredictions = Object.entries(predictions)
        .filter(
          ([label, value]) =>
            !(typeof value === "number" && value >= 0 && value <= 1)
        )
        .map(([label, value]) => `${label}: ${value}`);

      if (invalidPredictions.length > 0) {
        log(
          `❌ Invalid prediction values: ${invalidPredictions.join(", ")}`,
          "TEST"
        );
        return false;
      }

      log(`✅ Response validation passed:`, "TEST");
      log(`   Model version: ${result.model_version}`, "TEST");
      log(`   Labels count: ${labels.length}`, "TEST");
      log(`   Inference time: ${result.inference_time_ms}ms`, "TEST");
      log(
        `   Top predictions: ${Object.entries(predictions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([label, conf]) => `${label}(${(conf * 100).toFixed(1)}%)`)
          .join(", ")}`,
        "TEST"
      );

      return true;
    } else {
      log(
        `❌ ML service returned unexpected status: ${response.status}`,
        "TEST"
      );
      return false;
    }
  } catch (error) {
    log(`❌ ML service direct test failed: ${error.message}`, "TEST");
    if (error.response) {
      log(`   Response status: ${error.response.status}`, "TEST");
      log(`   Response data: ${JSON.stringify(error.response.data)}`, "TEST");
    }
    return false;
  }
}

async function testNodeServiceIntegration() {
  log("Testing Node.js service integration...", "TEST");

  try {
    // First, we need to authenticate (this is a simplified test)
    // In a real scenario, you'd have a test user or use a test token

    // For now, let's test the health endpoint
    const healthResponse = await axios.get(`${NODE_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    if (healthResponse.status === 200) {
      log("✅ Node.js service health check passed", "TEST");

      const healthData = healthResponse.data;
      if (healthData.ml_service && healthData.ml_service.status === "healthy") {
        log("✅ ML service integration is working", "TEST");
        return true;
      } else {
        log("❌ ML service integration is not working", "TEST");
        return false;
      }
    } else {
      log(
        `❌ Node.js service health check failed: ${healthResponse.status}`,
        "TEST"
      );
      return false;
    }
  } catch (error) {
    log(`❌ Node.js service integration test failed: ${error.message}`, "TEST");
    return false;
  }
}

async function testConcurrentRequests() {
  log("Testing concurrent ML service requests...", "TEST");

  try {
    const concurrentRequests = 5;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const form = new FormData();
      form.append("file", fs.createReadStream(TEST_IMAGE_PATH));
      form.append("scan_type", "chest");

      const promise = axios
        .post(`${ML_SERVICE_URL}/api/v1/predict`, form, {
          headers: {
            ...form.getHeaders(),
            "x-ml-api-key": API_KEY,
          },
          timeout: 60000,
        })
        .then((response) => ({ success: true, id: i, data: response.data }))
        .catch((error) => ({ success: false, id: i, error: error.message }));

      promises.push(promise);
    }

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    log(
      `✅ Concurrent test completed: ${successful.length}/${concurrentRequests} successful`,
      "TEST"
    );

    if (failed.length > 0) {
      log(`❌ ${failed.length} requests failed:`, "TEST");
      failed.forEach((f) => log(`   Request ${f.id}: ${f.error}`, "TEST"));
      return false;
    }

    // Check that all responses have unique inference IDs
    const inferenceIds = successful.map((r) => r.data.inference_id);
    const uniqueIds = new Set(inferenceIds);

    if (uniqueIds.size !== inferenceIds.length) {
      log("❌ Duplicate inference IDs detected", "TEST");
      return false;
    }

    log(
      "✅ All concurrent requests processed successfully with unique IDs",
      "TEST"
    );
    return true;
  } catch (error) {
    log(`❌ Concurrent test failed: ${error.message}`, "TEST");
    return false;
  }
}

async function runAllTests() {
  log("🚀 Starting ML Integration Tests", "MAIN");
  log("=" * 60, "MAIN");

  const tests = [
    {
      name: "Service Health Check",
      func: () => checkServiceHealth("ML Service", ML_SERVICE_URL),
    },
    { name: "ML Service Direct Test", func: testMLServiceDirect },
    { name: "Node.js Integration Test", func: testNodeServiceIntegration },
    { name: "Concurrent Requests Test", func: testConcurrentRequests },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    log(`\n{'='*20} ${test.name} {'='*20}`, "TEST");
    try {
      const result = await test.func();
      if (result) {
        passed++;
        log(`✅ ${test.name} PASSED`, "RESULT");
      } else {
        log(`❌ ${test.name} FAILED`, "RESULT");
      }
    } catch (error) {
      log(`❌ ${test.name} ERROR: ${error.message}`, "RESULT");
    }
  }

  log("\n" + "=" * 60, "MAIN");
  log(`📊 Test Results: ${passed}/${total} passed`, "RESULT");

  if (passed === total) {
    log("🎉 All tests passed! ML integration is working correctly.", "RESULT");
    return true;
  } else {
    log("❌ Some tests failed. Please check the errors above.", "RESULT");
    return false;
  }
}

// Main execution
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`Fatal error: ${error.message}`, "ERROR");
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testMLServiceDirect,
  testNodeServiceIntegration,
  testConcurrentRequests,
};
