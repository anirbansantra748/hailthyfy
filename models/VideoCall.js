const mongoose = require("mongoose");

const videoCallSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "ended",
        "missed",
        "cancelled",
      ],
      default: "pending",
    },
    callId: {
      type: String,
      unique: true,
    },
    meetingId: {
      type: String,
      unique: true,
      required: true
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    // WebRTC specific fields
    roomName: String,
    accessToken: String,
    // Call quality metrics
    quality: {
      video: {
        type: String,
        enum: ["low", "medium", "high", "ultra"],
        default: "medium",
      },
      audio: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },
    // Recording options
    isRecorded: {
      type: Boolean,
      default: false,
    },
    recordingUrl: String,
    // Call notes
    notes: String,
    // Technical details
    userAgent: String,
    ipAddress: String,
    // Timestamps for different states
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    rejectedAt: Date,
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

// Generate unique call ID
videoCallSchema.pre("save", function (next) {
  if (!this.callId) {
    this.callId = `call_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
  next();
});

// Calculate duration when call ends
videoCallSchema.methods.endCall = function () {
  this.status = "ended";
  this.endedAt = new Date();
  if (this.joinedAt) {
    this.duration = Math.floor((this.endedAt - this.joinedAt) / 1000);
  }
  return this.save();
};

// Index for better query performance
// Note: callId already has unique index from schema definition
videoCallSchema.index({ chat: 1 });
videoCallSchema.index({ status: 1 });
videoCallSchema.index({ initiator: 1 });
videoCallSchema.index({ participants: 1 });

module.exports = mongoose.model("VideoCall", videoCallSchema);
