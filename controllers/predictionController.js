// controllers/predictionController.js
const Xray = require("../models/Xray");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// Queue imports (optional)
let Queue;
let predictionQueue;
let worker;

// Initialize queue if enabled
if (process.env.PREDICTION_MODE === "queue") {
  try {
    Queue = require("bull");
    predictionQueue = new Queue("xray-predictions", process.env.REDIS_URL);

    // Create worker
    worker = require("../workers/predictionWorker");
    console.log("Queue mode enabled with Bull/Redis");
  } catch (error) {
    console.error("Failed to initialize queue:", error);
    console.log("Falling back to sync mode");
  }
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/xrays");
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "xray-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|dcm)$/)) {
      return cb(new Error("Only image and DICOM files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("xrayImage");

// ML Service configuration
const ML_CONFIG = {
  url: process.env.ML_API_URL || "http://127.0.0.1:8000",
  apiKey: process.env.ML_API_KEY || "dev_key_for_development_only",
  timeout: parseInt(process.env.ML_API_TIMEOUT_MS) || 60000, // Increased to 60s
  retries: 3,
  retryDelay: 1000, // Start with 1 second
};

// Email transport (development: console/json transport)
const EMAIL_TRANSPORT = nodemailer.createTransport(
  process.env.NODE_ENV === "production"
    ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    }
    : { jsonTransport: true }
);

async function sendPredictionEmail(user, xray, predictions) {
  try {
    if (!user?.email) {
      return;
    }
    const topFindings = Object.entries(predictions || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const lines = topFindings.map(
      ([label, confidence], idx) =>
        `${idx + 1}. ${label.replace(/_/g, " ")}: ${(confidence * 100).toFixed(
          1
        )}%`
    );

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

    await EMAIL_TRANSPORT.sendMail({
      from: process.env.NOTIFY_FROM || "no-reply@healthfy.local",
      to: user.email,
      subject: `Your X-ray analysis is complete`,
      text: [
        `Hello ${user.name || user.email},`,
        "",
        "Your X-ray analysis has completed.",
        "",
        "Top findings:",
        ...lines,
        "",
        `View full results: ${baseUrl}/predictions/${xray._id}`,
      ].join("\n"),
    });
  } catch (e) {
    console.warn("Email notification failed:", e.message);
  }
}

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

    console.log(
      `Calling ML service with file: ${filePath}, size: ${fileStats.size} bytes, scan_type: ${scanType}`
    );

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

    console.log("ML API response received:", {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    // Validate response structure
    if (!response.data) {
      throw new Error("Empty response from ML service");
    }

    if (
      !response.data.predictions ||
      typeof response.data.predictions !== "object"
    ) {
      throw new Error(
        `Invalid ML response: missing or invalid predictions. Response: ${JSON.stringify(
          response.data
        )}`
      );
    }

    // Ensure predictions are numbers
    const predictions = response.data.predictions;
    for (const [key, value] of Object.entries(predictions)) {
      if (typeof value !== "number" || isNaN(value)) {
        console.warn(
          `Invalid prediction value for ${key}: ${value}, converting to 0`
        );
        predictions[key] = 0;
      }
    }

    return response.data;
  } catch (error) {
    console.error(
      `ML API call failed (attempt ${retryCount + 1}):`,
      error.message
    );

    // Log additional error details
    if (error.response) {
      console.error("ML API error response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error("ML API request error:", error.request);
    }

    // Retry logic with exponential backoff
    if (retryCount < ML_CONFIG.retries - 1) {
      const delay = ML_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callMLService(filePath, scanType, retryCount + 1);
    }

    // If all retries failed, provide a more helpful error message
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error(
          "ML service authentication failed. Please check API key configuration."
        );
      } else if (error.response.status === 413) {
        throw new Error(
          "File too large for ML service. Please use a smaller image."
        );
      } else if (error.response.status === 415) {
        throw new Error(
          "Unsupported file format. Please use JPG, JPEG, or PNG files."
        );
      } else if (error.response.status >= 500) {
        throw new Error(
          "ML service is currently unavailable. Please try again later."
        );
      } else {
        throw new Error(
          `ML service error: ${error.response.data?.detail ||
          error.response.statusText ||
          "Unknown error"
          }`
        );
      }
    } else if (error.code === "ECONNREFUSED") {
      throw new Error(
        "Cannot connect to ML service. Please check if the service is running."
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("ML service request timed out. Please try again.");
    } else {
      throw new Error(`ML service error: ${error.message}`);
    }
  }
}

// Upload X-ray image with ML prediction
// exports.uploadXray = (req, res) => {
//   console.log("Upload X-ray request received");
//   console.log("Request body:", req.body);
//   console.log("Request file:", req.file);

//   upload(req, res, async (err) => {
//     if (err) {
//       console.error("Upload error:", err);
//       return res.status(400).json({
//         success: false,
//         message: err.message,
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     try {
//       // Create X-ray record
//       const newXray = new Xray({
//         user: req.user._id,
//         image: req.file.path,
//         notes: req.body.notes,
//         scanType: req.body.scanType || "chest",
//         status: "uploaded",
//       });

//       await newXray.save();

//       // Handle prediction based on mode
//       if (process.env.PREDICTION_MODE === "queue" && predictionQueue) {
//         // Queue mode
//         const job = await predictionQueue.add(
//           {
//             xrayId: newXray._id,
//             filePath: req.file.path,
//             scanType: req.body.scanType || "chest",
//             userId: req.user._id,
//           },
//           {
//             attempts: 3,
//             backoff: {
//               type: "exponential",
//               delay: 2000,
//             },
//           }
//         );

//         // Update status to processing
//         await Xray.findByIdAndUpdate(newXray._id, {
//           status: "processing",
//         });

//         return res.status(202).json({
//           success: true,
//           message: "X-ray uploaded and queued for processing",
//           data: {
//             xrayId: newXray._id,
//             status: "processing",
//             jobId: job.id,
//           },
//         });
//       } else {
//         // Synchronous mode
//         try {
//           console.log(`Processing X-ray ${newXray._id} synchronously...`);

//           // Call ML service
//           const mlResult = await callMLService(
//             req.file.path,
//             req.body.scanType || "chest"
//           );

//           // Update X-ray record with results
//           const updateData = {
//             status: "completed",
//             predictions: mlResult.predictions,
//             model_version: mlResult.model_version,
//             inference_id: mlResult.inference_id,
//             inference_time_ms: mlResult.inference_time_ms,
//             raw_response: mlResult,
//             processed_at: new Date(),
//             isProcessed: true,
//           };

//           await Xray.findByIdAndUpdate(newXray._id, updateData);

//           // Log successful prediction
//           console.log(`Prediction completed for X-ray ${newXray._id}:`, {
//             inference_id: mlResult.inference_id,
//             model_version: mlResult.model_version,
//             inference_time_ms: mlResult.inference_time_ms,
//             top_predictions: Object.entries(mlResult.predictions)
//               .sort(([, a], [, b]) => b - a)
//               .slice(0, 3),
//           });

//           // Redirect to results page instead of returning JSON
//           console.log(`Redirecting to results page: /prediction/xray/${newXray._id}`);
//           try {
//             return res.redirect(`/prediction/xray/${newXray._id}`);
//           } catch (redirectError) {
//             console.error("Redirect error:", redirectError);
//             return res.status(500).json({
//               success: false,
//               message: "Failed to redirect to results page",
//               error: redirectError.message,
//               xrayId: newXray._id
//             });
//           }
//         } catch (mlError) {
//           console.error(
//             `ML processing failed for X-ray ${newXray._id}:`,
//             mlError.message
//           );

//           // Update status to failed
//           await Xray.findByIdAndUpdate(newXray._id, {
//             status: "failed",
//             error_message: mlError.message,
//           });

//                     // Redirect to results page to show error status
//           try {
//             return res.redirect(`/prediction/xray/${newXray._id}`);
//           } catch (redirectError) {
//             console.error("Redirect error (failed case):", redirectError);
//             return res.status(500).json({
//               success: false,
//               message: "Failed to redirect to results page",
//               error: redirectError.message,
//               xrayId: newXray._id
//             });
//           }
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       console.error("Error stack:", error.stack);
//       res.status(500).json({
//         success: false,
//         message: "Server error during upload",
//         error: error.message,
//         stack: error.stack
//       });
//     }
//   });
// };

exports.uploadXray = (req, res) => {
  console.log("Upload X-ray request received");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  upload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      req.flash("error", err.message);
      return res.redirect("/prediction/xray/upload");
    }

    if (!req.file) {
      req.flash("error", "No file uploaded");
      return res.redirect("/prediction/xray/upload");
    }

    let newXray;
    try {
      // Create X-ray record with file metadata
      newXray = new Xray({
        user: req.user._id,
        image: req.file.path,
        notes: req.body.notes || "",
        scanType: req.body.scanType || "chest",
        status: "uploaded",
        // Add file metadata
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_mimetype: req.file.mimetype,
      });

      await newXray.save();
      console.log(`X-ray record created: ${newXray._id}`);

      // Update user stats
      try {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { xrayCount: 1 },
          lastXrayDate: new Date(),
        });
        console.log("User stats updated");
      } catch (userUpdateError) {
        console.warn("Failed to update user stats:", userUpdateError.message);
      }

      if (process.env.PREDICTION_MODE === "queue" && predictionQueue) {
        // Queue mode
        const job = await predictionQueue.add(
          {
            xrayId: newXray._id,
            filePath: req.file.path,
            scanType: req.body.scanType || "chest",
            userId: req.user._id,
          },
          { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
        );

        await Xray.findByIdAndUpdate(newXray._id, { status: "processing" });

        req.flash("success", "X-ray uploaded and queued for processing");
        return res.redirect(`/prediction/xray/${newXray._id}`);
      }

      // Synchronous mode
      console.log(`Processing X-ray ${newXray._id} synchronously...`);

      try {
        const mlResult = await callMLService(
          req.file.path,
          req.body.scanType || "chest"
        );

        console.log("ML API response received:", {
          model_version: mlResult.model_version,
          inference_id: mlResult.inference_id,
          inference_time_ms: mlResult.inference_time_ms,
          predictions_count: Object.keys(mlResult.predictions || {}).length,
        });

        // Validate ML response
        if (!mlResult.predictions || typeof mlResult.predictions !== "object") {
          throw new Error(
            "Invalid ML response: missing or invalid predictions"
          );
        }

        // CRITICAL FIX: Use fusion engine results instead of raw DenseNet predictions
        // The frontend expects a { label: confidence } format
        // But we want to show the FUSION result, not raw DL predictions
        let displayPredictions;

        if (mlResult.final_diagnosis && mlResult.confidence_score) {
          // Fusion engine provided a diagnosis - use it!
          displayPredictions = {};
          displayPredictions[mlResult.final_diagnosis] = mlResult.confidence_score;

          // Add other predictions with much lower scores for context
          for (const [label, score] of Object.entries(mlResult.predictions || {})) {
            if (label !== mlResult.final_diagnosis) {
              displayPredictions[label] = score; // Keep original raw scores for reference
            }
          }

          console.log(`Using FUSION result for display: ${mlResult.final_diagnosis} at ${(mlResult.confidence_score * 100).toFixed(1)}%`);
        } else {
          // Fallback to raw predictions if fusion didn't provide results
          displayPredictions = mlResult.predictions;
          console.log('Using raw DL predictions (fusion engine did not provide final_diagnosis)');
        }

        // Update X-ray record with results and metadata
        const updateData = {
          status: "completed",
          predictions: displayPredictions, // Use fusion result!
          model_version: mlResult.model_version || "unknown",
          inference_id: mlResult.inference_id || `inf_${Date.now()}`,
          inference_time_ms: mlResult.inference_time_ms || 0,
          raw_response: mlResult,
          processed_at: new Date(),
          isProcessed: true,
          // Additional metadata from ML response
          labels: mlResult.labels || [],
          warnings: mlResult.safety_flags || mlResult.warnings || [],
          scan_type_ml: mlResult.scan_type || req.body.scanType || "chest",
        };

        await Xray.findByIdAndUpdate(newXray._id, updateData);

        console.log(`Prediction completed for X-ray ${newXray._id}:`, {
          inference_id: mlResult.inference_id,
          model_version: mlResult.model_version,
          inference_time_ms: mlResult.inference_time_ms,
          top_predictions: Object.entries(mlResult.predictions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3),
        });

        // Notify user via email (dev: console)
        try {
          await sendPredictionEmail(req.user, newXray, mlResult.predictions);
          console.log(`Email notification sent for X-ray ${newXray._id}`);
        } catch (emailError) {
          console.warn(
            `Email notification failed for X-ray ${newXray._id}:`,
            emailError.message
          );
        }

        console.log(
          `Successfully processed X-ray ${newXray._id}, redirecting to results page`
        );
        req.flash("success", "X-ray analysis completed successfully!");
        return res.redirect(`/prediction/xray/${newXray._id}`);
      } catch (mlError) {
        console.error(
          `ML processing failed for X-ray ${newXray._id}:`,
          mlError.message
        );

        // Update status to failed
        await Xray.findByIdAndUpdate(newXray._id, {
          status: "failed",
          error_message: mlError.message,
          processed_at: new Date(),
        });

        req.flash("error", `Analysis failed: ${mlError.message}`);
        return res.redirect(`/prediction/xray/${newXray._id}`);
      }
    } catch (processingError) {
      console.error(
        `Error processing X-ray${newXray ? " " + newXray._id : ""}:`,
        processingError
      );

      // Safely update status if X-ray was created
      if (newXray?._id) {
        try {
          await Xray.findByIdAndUpdate(newXray._id, {
            status: "failed",
            error_message: processingError.message,
            processed_at: new Date(),
          });
        } catch (updateError) {
          console.error("Failed to update X-ray status:", updateError);
        }
      }

      req.flash("error", `Upload failed: ${processingError.message}`);
      return res.redirect("/prediction/xray/upload");
    }
  });
};

// Get all X-rays for a user

exports.getUserXrays = async (req, res) => {
  try {
    const xrays = await Xray.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: xrays,
      count: xrays.length,
    });
  } catch (error) {
    console.error("Get user X-rays error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single X-ray
exports.getXray = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({
        success: false,
        message: "X-ray not found",
      });
    }

    // Check permissions
    if (
      xray.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({ success: true, data: xray });
  } catch (error) {
    console.error("Get X-ray error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get X-ray prediction results
exports.getXrayPrediction = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({
        success: false,
        message: "X-ray not found",
      });
    }

    // Check permissions
    if (
      xray.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (xray.status === "completed") {
      return res.status(200).json({
        success: true,
        data: {
          status: xray.status,
          predictions: xray.predictions,
          model_version: xray.model_version,
          inference_time_ms: xray.inference_time_ms,
          processed_at: xray.processed_at,
          top_findings: Object.entries(xray.predictions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([label, confidence]) => ({
              label,
              confidence: (confidence * 100).toFixed(2) + "%",
            })),
          // Add detailed analysis data
          handcrafted_features: xray.raw_response?.handcrafted_features || {},
          similar_cases: xray.raw_response?.similar_cases || [],
          embedding_generated: xray.raw_response?.embedding_generated || false,
        },
      });
    } else if (xray.status === "processing") {
      return res.status(200).json({
        success: true,
        data: {
          status: xray.status,
          message: "X-ray is being processed. Please check back later.",
        },
      });
    } else if (xray.status === "failed") {
      return res.status(200).json({
        success: true,
        data: {
          status: xray.status,
          error: xray.error_message,
          message: "Processing failed. Please try uploading again.",
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          status: xray.status,
          message: "X-ray is queued for processing.",
        },
      });
    }
  } catch (error) {
    console.error("Get X-ray prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Retry failed X-ray processing
exports.retryXrayProcessing = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({
        success: false,
        message: "X-ray not found",
      });
    }

    // Check permissions
    if (
      xray.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (xray.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Only failed X-rays can be retried",
      });
    }

    // Reset status and retry
    await Xray.findByIdAndUpdate(xray._id, {
      status: "uploaded",
      error_message: null,
      retry_count: (xray.retry_count || 0) + 1,
    });

    if (process.env.PREDICTION_MODE === "queue" && predictionQueue) {
      // Queue for retry
      const job = await predictionQueue.add({
        xrayId: xray._id,
        filePath: xray.image,
        scanType: xray.scanType,
        userId: xray.user,
        isRetry: true,
      });

      return res.status(200).json({
        success: true,
        message: "X-ray queued for retry",
        data: { jobId: job.id },
      });
    } else {
      // Immediate retry
      try {
        const mlResult = await callMLService(xray.image, xray.scanType);

        await Xray.findByIdAndUpdate(xray._id, {
          status: "completed",
          predictions: mlResult.predictions,
          model_version: mlResult.model_version,
          inference_id: mlResult.inference_id,
          inference_time_ms: mlResult.inference_time_ms,
          raw_response: mlResult,
          processed_at: new Date(),
          isProcessed: true,
          error_message: null,
        });

        return res.status(200).json({
          success: true,
          message: "X-ray reprocessed successfully",
          data: {
            status: "completed",
            predictions: mlResult.predictions,
          },
        });
      } catch (mlError) {
        await Xray.findByIdAndUpdate(xray._id, {
          status: "failed",
          error_message: mlError.message,
        });

        return res.status(500).json({
          success: false,
          message: "Retry failed",
          error: mlError.message,
        });
      }
    }
  } catch (error) {
    console.error("Retry X-ray error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Render X-ray form
exports.renderXrayForm = (req, res) => {
  res.render("predictions/upload", {
    user: req.user,
    title: "Upload X-ray Image",
  });
};

// Render X-ray list
exports.renderXrayList = async (req, res) => {
  try {
    console.log("Loading X-ray list for user:", req.user._id);

    const xrays = await Xray.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${xrays.length} X-rays for user`);

    // Calculate statistics
    const stats = {
      total: xrays.length,
      completed: xrays.filter((x) => x.status === "completed").length,
      processing: xrays.filter((x) => x.status === "processing").length,
      failed: xrays.filter((x) => x.status === "failed").length,
      uploaded: xrays.filter((x) => x.status === "uploaded").length,
    };

    console.log("X-ray statistics:", stats);

    res.render("predictions/list", {
      user: req.user,
      title: "My X-ray Scans",
      xrays: xrays,
      stats: stats,
    });
  } catch (error) {
    console.error("Render X-ray list error:", error);
    req.flash("error", "Failed to load X-ray list");
    res.redirect("/");
  }
};

// Helper to generate simple explanations
const EXPLANATIONS = {
  'Atelectasis': "The lung isn't inflating properly, like a deflated balloon. This can happen after surgery or from a blockage.",
  'Cardiomegaly': "The heart looks larger than normal on the X-ray. It might be working harder than usual.",
  'Effusion': "There is some fluid build-up around the lungs. This can make it harder to breathe deeply.",
  'Infiltration': "There is a substance (like fluid or pus) in the lungs that shouldn't be there, often a sign of infection.",
  'Mass': "There is a large abnormal spot (>3cm). This needs close follow-up with your doctor.",
  'Nodule': "There is a small spot (<3cm) on the lung. These are common and often benign, but worth checking.",
  'Pneumonia': "The lungs show signs of infection, likely caused by bacteria or a virus.",
  'Pneumothorax': "There is air leaking into the space around the lung, which can cause it to collapse.",
  'Consolidation': "A part of the lung is filled with fluid instead of air, usually due to pneumonia.",
  'Edema': "There is fluid in the lungs, often related to heart function.",
  'Emphysema': "The air sacs in the lungs are damaged, which can make it hard to breathe out fully.",
  'Fibrosis': "There is some scarring in the lung tissue.",
  'Pleural_Thickening': "The lining of the lungs is thicker than normal, possibly from a past infection.",
  'Hernia': "Expected organs are not in their usual position.",
  'No_Finding': "The X-ray appears normal with no obvious abnormalities detected."
};

function generateAIExplanation(predictions) {
  if (!predictions) return "Analysis incomplete.";

  // Sort predictions
  const sorted = Object.entries(predictions).sort(([, a], [, b]) => b - a);
  const topCondition = sorted[0];

  if (!topCondition) return "No significant findings.";

  const [condition, confidence] = topCondition;
  const percentage = (confidence * 100).toFixed(1);
  const explanation = EXPLANATIONS[condition] || "An abnormality was detected.";

  if (confidence < 0.5) {
    return `The findings are not definitive. There is a low chance (${percentage}%) of ${condition.replace(/_/g, ' ')}. ${explanation}`;
  }

  return `The AI detected signs of **${condition.replace(/_/g, ' ')}** with ${percentage}% confidence. ${explanation} Please consult a doctor for a proper diagnosis.`;
}

// Render X-ray view
exports.renderXrayView = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      req.flash("error", "X-ray not found");
      return res.redirect("/prediction/xray");
    }

    // Check permissions
    if (
      xray.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      req.flash("error", "Access denied");
      return res.redirect("/prediction/xray");
    }

    // Ensure predictions is properly formatted for the template
    let safePredictions = {};
    if (xray.predictions) {
      // Handle different types of predictions data
      if (xray.predictions instanceof Map) {
        // Convert Map to plain object
        for (const [key, value] of xray.predictions.entries()) {
          safePredictions[key] = value;
        }
      } else if (
        typeof xray.predictions === "object" &&
        xray.predictions !== null
      ) {
        // Handle plain object or Mongoose Map-like object
        if (
          xray.predictions.constructor.name === "Map" ||
          xray.predictions._bsontype === "Map"
        ) {
          // Mongoose Map-like object
          for (const [key, value] of Object.entries(xray.predictions)) {
            if (key !== "_bsontype" && key !== "constructor") {
              safePredictions[key] = value;
            }
          }
        } else {
          // Regular object
          safePredictions = xray.predictions;
        }
      }
    }

    // Also check for legacy predictionResults field
    if (Object.keys(safePredictions).length === 0 && xray.predictionResults) {
      safePredictions = xray.predictionResults;
    }

    // Create a safe xray object for the template
    const safeXray = {
      ...xray.toObject(),
      predictions: safePredictions,
    };

    // Extract Fusion Logic Data if available
    const fusionData = {
      diagnosis: xray.raw_response?.final_diagnosis || null,
      confidence: xray.raw_response?.confidence_score || null,
      notes: xray.raw_response?.clinical_notes || [],
      flags: xray.raw_response?.safety_flags || [],
      summary: xray.raw_response?.summary || null
    };

    try {
      // Prepare predictionsKeys array for template
      const predictionsKeys = Object.keys(safePredictions);

      res.render("predictions/view-explainable", {
        user: req.user,
        title: fusionData.diagnosis ? `Analysis: ${fusionData.diagnosis}` : "X-ray Results",
        xray: safeXray,
        predictions: safePredictions,
        predictionsKeys: predictionsKeys,
        aiExplanation: fusionData.summary || generateAIExplanation(safePredictions),
        fusion: fusionData, // Pass fusion data to view
        scanType: xray.scanType || "chest"
      });
    } catch (renderError) {
      // Try to provide a fallback error page
      req.flash("error", "Error rendering results page. Please try again.");
      return res.redirect("/prediction/xray");
    }
  } catch (error) {
    // Check if it's a template rendering error
    if (error.message && error.message.includes("template")) {
      req.flash("error", "Error rendering results page. Please try again.");
    } else {
      req.flash("error", "Failed to load X-ray");
    }

    res.redirect("/prediction/xray");
  }
};

// Render dashboard
exports.renderDashboard = async (req, res) => {
  try {
    res.render("predictions/dashboard", {
      user: req.user,
      title: "X-ray Analysis Dashboard",
    });
  } catch (error) {
    console.error("Render dashboard error:", error);
    req.flash("error", "Failed to load dashboard");
    res.redirect("/");
  }
};

// Render demo page
exports.renderDemo = async (req, res) => {
  try {
    res.render("predictions/demo", {
      user: req.user,
      title: "Demo: X-ray Analysis Results",
    });
  } catch (error) {
    console.error("Render demo error:", error);
    req.flash("error", "Failed to load demo page");
    res.redirect("/prediction");
  }
};

// Download X-ray report
exports.downloadXrayReport = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({ success: false, message: "X-ray not found" });
    }

    // Check permissions
    if (xray.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const reportContent = `
HEALTHFY X-RAY ANALYSIS REPORT
==============================

Report ID: ${xray._id}
Scan Type: ${xray.scanType || 'Unknown'}
Upload Date: ${new Date(xray.createdAt).toLocaleString()}
Status: ${xray.status.toUpperCase()}
Model Version: ${xray.model_version || 'Unknown'}
Processing Time: ${xray.inference_time_ms || 'N/A'}ms

FINDINGS:
${xray.predictions ? Object.entries(xray.predictions)
        .sort(([, a], [, b]) => b - a)
        .map(([condition, confidence]) =>
          `- ${condition.replace(/_/g, ' ')}: ${(confidence * 100).toFixed(1)}%`
        ).join('\n') : 'No predictions available'}

Generated: ${new Date().toLocaleString()}

DISCLAIMER: This analysis is generated by AI and should not be used as a substitute for professional medical diagnosis.
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="xray-report-${xray._id}.txt"`);
    res.send(reportContent);

  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export X-ray data as JSON
exports.exportXrayData = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({ success: false, message: "X-ray not found" });
    }

    // Check permissions
    if (xray.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const exportData = {
      report: {
        id: xray._id,
        timestamp: new Date().toISOString(),
        xray: {
          status: xray.status,
          scanType: xray.scanType,
          uploadDate: xray.createdAt,
          fileName: xray.file_name || 'Unknown',
          fileSize: xray.file_size || 0
        },
        analysis: {
          predictions: xray.predictions || {},
          modelVersion: xray.model_version || 'Unknown',
          processingTime: xray.inference_time_ms || 0,
          inferenceId: xray.inference_id || 'N/A'
        }
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="xray-data-${xray._id}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Share X-ray results
exports.shareXrayResults = async (req, res) => {
  try {
    const xray = await Xray.findById(req.params.id);

    if (!xray) {
      return res.status(404).json({ success: false, message: "X-ray not found" });
    }

    // Check permissions
    if (xray.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Generate shareable URL
    const shareUrl = `${req.protocol}://${req.get('host')}/prediction/xray/${xray._id}`;

    res.json({
      success: true,
      shareUrl: shareUrl,
      message: "Share URL generated successfully"
    });

  } catch (error) {
    console.error("Share results error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Health check for ML service
exports.mlHealthCheck = async (req, res) => {
  try {
    const response = await axios.get(`${ML_CONFIG.url}/health`, {
      timeout: 5000,
    });

    res.status(200).json({
      success: true,
      ml_service: response.data,
      node_service: "healthy",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ml_service: "unhealthy",
      node_service: "healthy",
      error: error.message,
    });
  }
};
