const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Who wrote it
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which post / doctor / entity it belongs to
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // Main content
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Support for threaded comments
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    // Ratings (useful for doctor reviews / post feedback)
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Likes / reactions
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Mentions (users tagged in comment)
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Moderation
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Comment", commentSchema);
