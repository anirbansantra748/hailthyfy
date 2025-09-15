// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },

    // Media
    images: [String], // array of image URLs
    videos: [String], // array of video URLs
    attachments: [String], // files, reports, prescriptions etc.

    // Author Info
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Categorization
    category: {
      type: String,
      enum: [
        "general",
        "health",
        "fitness",
        "nutrition",
        "disease",
        "mental_health",
        "medicine",
        "announcement",
      ],
      default: "general",
    },
    tags: [String], // e.g., ["diabetes", "diet", "AI"]

    // Engagement
    likes: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shares: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sharedAt: { type: Date, default: Date.now },
      },
    ],

    // Metadata
    views: {
      type: Number,
      default: 0,
    },
    trendingScore: {
      type: Number,
      default: 0, // use later for ML ranking / trending posts
    },

    // Moderation & Status
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedReason: String,

    // Prediction / Analytics fields
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    aiCategoryPrediction: [String], // categories auto-tagged by ML
    toxicityScore: {
      type: Number,
      default: 0, // use ML/NLP for toxic detection
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("Post", postSchema);
