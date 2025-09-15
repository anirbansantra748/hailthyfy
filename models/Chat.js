const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Doctor"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverModel",
      required: true,
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["User", "Doctor"],
    },
    content: {
      type: String,
      trim: true,
    },
    attachment: {
      type: String, // URL/path to file (image, pdf, report, etc.)
    },
    attachmentType: {
      type: String,
      enum: ["image", "file", "document"],
    },
    attachmentName: String,
    attachmentSize: Number, // in bytes
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "file",
        "document",
        "system",
        "video_call_request",
        "video_call_accept",
        "video_call_reject",
        "video_call_end",
      ],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    // Video call specific fields
    videoCallId: String,
    videoCallDuration: Number, // in seconds
    videoCallStatus: {
      type: String,
      enum: ["requested", "accepted", "rejected", "ongoing", "ended", "missed"],
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "participantModels",
        required: true,
      },
    ],
    participantModels: [
      {
        type: String,
        required: true,
        enum: ["User", "Doctor"],
      },
    ],
    chatType: {
      type: String,
      enum: ["user_doctor", "user_user", "doctor_doctor"],
      required: true,
    },
    messages: [messageSchema],
    lastMessage: {
      type: String, // quick access for preview
    },
    lastMessageType: {
      type: String,
      enum: [
        "text",
        "image",
        "file",
        "document",
        "system",
        "video_call_request",
        "video_call_accept",
        "video_call_reject",
        "video_call_end",
      ],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    // Chat status
    isActive: {
      type: Boolean,
      default: true,
    },
    // For doctor-patient chats
    consultationType: {
      type: String,
      enum: ["general", "xray_consultation", "follow_up", "emergency"],
      default: "general",
    },
    consultationStatus: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },
    // Video call session info
    currentVideoCall: {
      callId: String,
      startTime: Date,
      participants: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          userModel: String,
          joinedAt: Date,
          leftAt: Date,
        },
      ],
    },
  },
  { timestamps: true }
);

chatSchema.pre("save", function (next) {
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = lastMsg.content || `[${lastMsg.type}]`;
    this.lastMessageType = lastMsg.type;
    this.lastUpdated = new Date();
  }
  next();
});

// Index for better query performance
chatSchema.index({ participants: 1, lastUpdated: -1 });
chatSchema.index({ chatType: 1, isActive: 1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
