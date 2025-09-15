// models/User.js
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    // --- Identity / Auth (password handled by plugin) ---
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, enum: ["user", "admin", "doctor"], default: "user" },

    // Doctor linkage
    isDoctor: { type: Boolean, default: false },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },

    // --- Personal Info ---
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String, unique: true, sparse: true },
    profileImage: { type: String }, // <-- URL only
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    // --- Health Profile ---
    height: Number,
    weight: Number,
    bmi: Number,
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    bodyFatPercentage: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    heartRate: Number,
    cholesterol: {
      total: Number,
      hdl: Number,
      ldl: Number,
      triglycerides: Number,
    },
    bloodSugar: {
      fasting: Number,
      postMeal: Number,
      hba1c: Number,
    },
    oxygenSaturation: Number,
    temperature: Number,

    // --- Medical Records ---
    allergies: [String],
    medicalHistory: [String],
    currentMedications: [String],
    surgeries: [String],
    familyHistory: [String],
    immunizations: [String],

    // Logs
    healthLogs: [
      {
        date: { type: Date, default: Date.now },
        height: Number,
        weight: Number,
        bmi: Number,
        bloodPressure: { systolic: Number, diastolic: Number },
        heartRate: Number,
        bloodSugar: { fasting: Number, postMeal: Number, hba1c: Number },
        cholesterol: {
          total: Number,
          hdl: Number,
          ldl: Number,
          triglycerides: Number,
        },
        notes: String,
      },
    ],

    // Store report URLs directly
    medicalReports: [
      {
        title: String,
        type: { type: String }, // e.g., "xray", "lab_report"
        url: String, // <-- just store URL
        uploadedAt: { type: Date, default: Date.now },
        meta: Object,
      },
    ],

    // X-ray references for quick access
    xrayCount: { type: Number, default: 0 },
    lastXrayDate: { type: Date },

    // --- Lifestyle ---
    lifestyle: {
      smoking: { type: Boolean, default: false },
      alcohol: { type: Boolean, default: false },
      diet: {
        type: String,
        enum: ["vegetarian", "non-vegetarian", "vegan", "other"],
      },
      exerciseFrequency: {
        type: String,
        enum: ["none", "low", "moderate", "high"],
      },
      sleepHours: Number,
      stressLevel: { type: Number, min: 1, max: 10 },
      waterIntakeLiters: Number,
      stepsPerDay: Number,
    },

    // --- Prediction & Analytics ---
    riskScores: {
      diabetes: Number,
      heartDisease: Number,
      hypertension: Number,
      obesity: Number,
    },
    aiPredictions: [
      {
        type: { type: String },
        score: Number,
        model: String,
        date: { type: Date, default: Date.now },
        details: Object,
      },
    ],
    
    // --- Drug Interaction Tracking ---
    interactionChecks: [
      {
        timestamp: { type: Date, default: Date.now },
        medications: [String],
        riskScore: Number,
        summary: {
          status: String,
          message: String,
          color: String
        },
        severeCount: { type: Number, default: 0 },
        moderateCount: { type: Number, default: 0 },
        mildCount: { type: Number, default: 0 },
        allergyCount: { type: Number, default: 0 }
      }
    ],
    
    // Health Assessment Tracking
    lastHealthAssessment: Date,
    healthAssessmentCount: { type: Number, default: 0 },

    // --- Preferences & Compliance ---
    preferences: {
      language: { type: String, default: "en" },
      units: { type: String, enum: ["metric", "imperial"], default: "metric" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    consents: {
      privacyPolicyAccepted: { type: Boolean, default: false },
      termsAccepted: { type: Boolean, default: false },
      acceptedAt: Date,
      policyVersion: String,
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    insurance: {
      provider: String,
      policyNumber: String,
      validTill: Date,
    },

    // --- Security & System ---
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: String,
        device: String,
      },
    ],
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },

    profileCompleteness: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calc BMI & age
userSchema.pre("save", function (next) {
  if (this.height && this.weight) {
    const bmi = this.weight / Math.pow(this.height / 100, 2);
    this.bmi = Math.round(bmi * 10) / 10;
  }
  if (this.dob && !this.age) {
    const now = new Date();
    let age = now.getFullYear() - this.dob.getFullYear();
    const m = now.getMonth() - this.dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < this.dob.getDate())) age--;
    this.age = age;
  }
  next();
});

// Passport-local-mongoose uses email as username
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  usernameLowerCase: true,
  errorMessages: {
    UserExistsError: "An account with that email already exists.",
  },
  // Ensure no username field is created
  usernameUnique: false,
});

module.exports = mongoose.model("User", userSchema);
