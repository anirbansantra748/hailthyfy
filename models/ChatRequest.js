const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    consultationType: {
      type: String,
      enum: ["general", "xray_consultation", "follow_up", "emergency"],
      default: "general",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "emergency"],
      default: "medium",
    },
    // Medical context
    symptoms: [String],
    currentMedications: [String],
    allergies: [String],
    // Timing
    preferredTimeSlots: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        time: String, // e.g., "10:00-12:00"
      },
    ],
    // Response details
    acceptedAt: Date,
    rejectedAt: Date,
    rejectedReason: String,
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      },
    },
    // Chat creation
    chatCreated: {
      type: Boolean,
      default: false,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    // Notes
    doctorNotes: String,
    userNotes: String,
  },
  { timestamps: true }
);

// Check if request is expired
chatRequestSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Accept the request
chatRequestSchema.methods.accept = function (notes = "") {
  this.status = "accepted";
  this.acceptedAt = new Date();
  this.doctorNotes = notes;
  return this.save();
};

// Reject the request
chatRequestSchema.methods.reject = function (reason = "", notes = "") {
  this.status = "rejected";
  this.rejectedAt = new Date();
  this.rejectedReason = reason;
  this.doctorNotes = notes;
  return this.save();
};

// Index for better query performance
chatRequestSchema.index({ user: 1, doctor: 1 });
chatRequestSchema.index({ status: 1 });
chatRequestSchema.index({ doctor: 1, status: 1 });
chatRequestSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("ChatRequest", chatRequestSchema);
