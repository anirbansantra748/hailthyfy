// models/Doctor.js
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // ---- Basic Identity ----
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // connect to base User schema
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dob: {
      type: Date,
    },
    profilePicture: String,

    // ---- Professional Info ----
    specialization: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Cardiologist", "Dermatologist", "Neurologist"
    },
    subSpecializations: [String], // e.g., ["Pediatric Cardiology"]

    qualifications: [
      {
        degree: String, // e.g., "MBBS", "MD"
        university: String,
        year: Number,
        certificateUrl: String, // proof of certificate
      },
    ],
    experienceYears: {
      type: Number,
      default: 0,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    hospitalAffiliations: [String], // Hospitals/clinics they work with

    // ---- Availability & Scheduling ----
    availability: [
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
        slots: [
          {
            start: String, // e.g., "10:00"
            end: String,   // e.g., "12:30"
          },
        ],
      },
    ],
    consultationMode: {
      type: [String],
      enum: ["online", "offline", "home_visit"],
      default: ["online"],
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // ---- Patient Interaction ----
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    reviews: [
      {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },

    // ---- Research & Publications ----
    researchPapers: [
      {
        title: String,
        journal: String,
        year: Number,
        link: String,
      },
    ],
    achievements: [String],

    // ---- Analytics & AI fields ----
    totalPatientsTreated: {
      type: Number,
      default: 0,
    },
    specializationScore: {
      type: Number,
      default: 0, // AI can assign expertise confidence score
    },
    popularityIndex: {
      type: Number,
      default: 0, // trending doctors, ML ranking
    },
    predictedWorkload: {
      type: Number,
      default: 0, // forecasted patient load
    },

    // ---- Security / Compliance ----
    isActive: {
      type: Boolean,
      default: true,
    },
    documentsVerified: {
      type: Boolean,
      default: false,
    },
    languages: [String], // e.g., ["English", "Hindi", "Bengali"]

    // ---- Metadata ----
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-update average rating
doctorSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    const avg =
      this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
      this.reviews.length;
    this.averageRating = Math.round(avg * 10) / 10; // 1 decimal
  }
  next();
});

module.exports = mongoose.model("Doctor", doctorSchema);
