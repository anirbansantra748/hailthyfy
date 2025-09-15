const express = require("express");
const router = express.Router();
const predictionController = require("../controllers/predictionController");
const { isLoggedIn } = require("../middleware/isLoggedIn");

// Dashboard
router.get("/", isLoggedIn, predictionController.renderDashboard);

// Demo page
router.get("/demo", isLoggedIn, predictionController.renderDemo);

// Test route for debugging
router.get("/test", isLoggedIn, (req, res) => {
  res.json({
    success: true,
    message: "Test route working",
    user: req.user._id,
    timestamp: new Date().toISOString(),
  });
});

// X-ray routes
router.get("/xray/upload", isLoggedIn, predictionController.renderXrayForm);
router.post("/xray", isLoggedIn, predictionController.uploadXray);
router.get("/xray", isLoggedIn, predictionController.renderXrayList);
router.get("/xray/:id", isLoggedIn, predictionController.renderXrayView);
router.get("/xray/:id/new", isLoggedIn, predictionController.renderXrayView);
router.get(
  "/xray/:id/prediction",
  isLoggedIn,
  predictionController.getXrayPrediction
);
router.post(
  "/xray/:id/retry",
  isLoggedIn,
  predictionController.retryXrayProcessing
);

// Action routes for X-ray reports
router.get("/xray/:id/download", isLoggedIn, predictionController.downloadXrayReport);
router.get("/xray/:id/export", isLoggedIn, predictionController.exportXrayData);
router.post("/xray/:id/share", isLoggedIn, predictionController.shareXrayResults);

// API endpoints for AJAX calls
router.get("/api/xray", isLoggedIn, predictionController.getUserXrays);
router.get("/api/xray/:id", isLoggedIn, predictionController.getXray);

// Health check endpoints
router.get("/health", predictionController.mlHealthCheck);
router.get("/health/ml", predictionController.mlHealthCheck);

module.exports = router;
