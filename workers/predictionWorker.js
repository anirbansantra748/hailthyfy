// workers/predictionWorker.js
const Queue = require("bull");
const Xray = require("../models/Xray");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// ML Service configuration
const ML_CONFIG = {
  url: process.env.ML_API_URL || "http://localhost:8000",
  apiKey: process.env.ML_API_KEY || "dev_key_for_development_only",
  timeout: parseInt(process.env.ML_API_TIMEOUT_MS) || 30000,
  retries: 3,
  retryDelay: 1000,
};

// Create queue
const predictionQueue = new Queue("xray-predictions", process.env.REDIS_URL);

// Utility function to call ML API
async function callMLService(filePath, scanType, retryCount = 0) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      throw new Error("File is empty");
    }

    // Create form data
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    if (scanType) {
      form.append("scan_type", scanType);
    }

    // Make request to ML service
    const response = await axios.post(`${ML_CONFIG.url}/api/v1/predict`, form, {
      headers: {
        ...form.getHeaders(),
        "x-ml-api-key": ML_CONFIG.apiKey,
      },
      timeout: ML_CONFIG.timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error(
      `ML API call failed (attempt ${retryCount + 1}):`,
      error.message
    );

    // Retry logic with exponential backoff
    if (retryCount < ML_CONFIG.retries - 1) {
      const delay = ML_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callMLService(filePath, scanType, retryCount + 1);
    }

    throw error;
  }
}

// Process prediction jobs
predictionQueue.process(async (job) => {
  const { xrayId, filePath, scanType, userId, isRetry } = job.data;

  console.log(`Processing X-ray prediction job ${job.id} for X-ray ${xrayId}`);

  try {
    // Update status to processing
    await Xray.findByIdAndUpdate(xrayId, {
      status: "processing",
      processed_at: new Date(),
    });

    // Call ML service
    const mlResult = await callMLService(filePath, scanType);

    // Update X-ray record with results
    const updateData = {
      status: "completed",
      predictions: mlResult.predictions,
      model_version: mlResult.model_version,
      inference_id: mlResult.inference_id,
      inference_time_ms: mlResult.inference_time_ms,
      raw_response: mlResult,
      processed_at: new Date(),
      isProcessed: true,
      error_message: null,
    };

    await Xray.findByIdAndUpdate(xrayId, updateData);

    // Log successful prediction
    console.log(`Prediction completed for X-ray ${xrayId}:`, {
      job_id: job.id,
      inference_id: mlResult.inference_id,
      model_version: mlResult.model_version,
      inference_time_ms: mlResult.inference_time_ms,
      top_predictions: Object.entries(mlResult.predictions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3),
    });

    return {
      success: true,
      xrayId,
      predictions: mlResult.predictions,
      model_version: mlResult.model_version,
    };
  } catch (error) {
    console.error(`Job ${job.id} failed for X-ray ${xrayId}:`, error.message);

    // Update status to failed
    await Xray.findByIdAndUpdate(xrayId, {
      status: "failed",
      error_message: error.message,
      processed_at: new Date(),
    });

    throw error; // This will trigger job retry if configured
  }
});

// Handle job completion
predictionQueue.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, result);
});

// Handle job failure
predictionQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

// Handle job progress
predictionQueue.on("progress", (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await predictionQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await predictionQueue.close();
  process.exit(0);
});

console.log("Prediction worker started");

module.exports = predictionQueue;
