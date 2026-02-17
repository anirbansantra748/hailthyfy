// models/Xray.js
const mongoose = require("mongoose");

const xraySchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // X-ray image
    image: {
      type: String,
      required: true,
    },

    // File metadata
    file_name: {
      type: String,
      default: null,
    },

    file_size: {
      type: Number,
      default: null,
    },

    file_mimetype: {
      type: String,
      default: null,
    },

    // ML Prediction fields
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },

    predictions: {
      type: Map,
      of: Number,
      default: new Map(),
    },

    model_version: {
      type: String,
      default: null,
    },

    inference_id: {
      type: String,
      default: null,
    },

    inference_time_ms: {
      type: Number,
      default: null,
    },

    raw_response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    processed_at: {
      type: Date,
      default: null,
    },

    // Additional ML metadata
    labels: {
      type: [String],
      default: [],
    },

    warnings: {
      type: [String],
      default: [],
    },

    scan_type_ml: {
      type: String,
      default: null,
    },

    // Detailed Analysis Data
    handcrafted_features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    similar_cases: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    embedding_generated: {
      type: Boolean,
      default: false,
    },

    // Legacy fields (maintained for backward compatibility)
    predictionResults: {
      type: Object,
      default: {},
    },

    isProcessed: {
      type: Boolean,
      default: false,
    },

    // Additional metadata
    scanType: {
      type: String,
      enum: ["chest", "abdominal", "dental", "spine", "limb", "other"],
      default: "chest",
    },

    notes: String,

    // Error tracking
    error_message: {
      type: String,
      default: null,
    },

    retry_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
xraySchema.index({ user: 1, status: 1 });
xraySchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("Xray", xraySchema);
