// controllers/userController.js

const User = require("../models/User");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

// ============================
// Render Pages
// ============================

// Handle signup
exports.registerUser = async (req, res) => {
  try {
    console.log('📥 Signup request received');
    console.log('📋 Request body:', req.body);
    console.log('📊 Content-Type:', req.headers['content-type']);

    // Check if req.body exists and has data
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ req.body is empty or undefined');
      req.flash('error', 'Form data was not received properly. Please try again.');
      return res.redirect('/users/signup');
    }

    const {
      // Personal info
      name,
      email,
      password,
      confirmPassword,
      phone,
      dob,
      gender,

      // Address
      street,
      city,
      state,
      pincode,
      country,

      // Health Info
      height,
      weight,
      bloodGroup,

      // Vitals
      systolic,
      diastolic,
      heartRate,
      oxygenSaturation,
      temperature,
      sugarFasting,
      sugarPostMeal,
      sugarHbA1c,

      // Medical Records (comma separated)
      allergies,
      medicalHistory,
      currentMedications,

      // Lifestyle
      smoking,
      alcohol,
      diet,
      exerciseFrequency,
      sleepHours,
      stressLevel,

      // Consents
      privacyPolicy,
      termsConditions,
    } = req.body;

    console.log('✅ Form data extracted successfully');
    console.log('👤 Name:', name);
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password ? password.length : 0);

    // Convert comma-separated strings to arrays
    const parseCSV = (str) =>
      str
        ? str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : [];

    // Basic validation
    if (!email || !password || !name) {
      req.flash("error", "Name, email and password are required.");
      return res.redirect("/users/signup");
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/users/signup');
    }

    console.log('📝 Creating user object...');

    const newUser = new User({
      name,
      email,
      phone,
      dob: dob ? new Date(dob) : undefined,
      gender,

      // Address
      address: {
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        pincode: pincode || undefined,
      },

      // Physical measurements
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      bloodGroup: bloodGroup || undefined,

      // Vitals
      bloodPressure: {
        systolic: systolic ? Number(systolic) : undefined,
        diastolic: diastolic ? Number(diastolic) : undefined,
      },
      heartRate: heartRate ? Number(heartRate) : undefined,
      temperature: temperature ? Number(temperature) : undefined,

      bloodSugar: {
        fasting: sugarFasting ? Number(sugarFasting) : undefined,
        postMeal: sugarPostMeal ? Number(sugarPostMeal) : undefined,
        hba1c: sugarHbA1c ? Number(sugarHbA1c) : undefined,
      },

      // Medical information
      allergies: allergies ? parseCSV(allergies) : [],
      medicalHistory: medicalHistory ? parseCSV(medicalHistory) : [],
      currentMedications: currentMedications ? parseCSV(currentMedications) : [],

      // Lifestyle
      lifestyle: {
        smoking: smoking === 'true' || smoking === 'on',
        alcohol: alcohol === 'true' || alcohol === 'on',
        diet: diet || undefined,
        exerciseFrequency: exerciseFrequency || undefined,
        sleepHours: sleepHours ? Number(sleepHours) : undefined,
        stressLevel: stressLevel ? Number(stressLevel) : undefined,
      },

      // Consents
      consents: {
        privacyPolicyAccepted: privacyPolicy === 'true' || privacyPolicy === 'on',
        termsAccepted: termsConditions === 'true' || termsConditions === 'on',
        acceptedAt: new Date(),
      },
    });

    console.log('👤 User object created:', {
      name: newUser.name,
      email: newUser.email,
      hasPassword: !!password,
      consents: newUser.consents
    });

    // Use passport-local-mongoose to register user with hashed password
    // Register with email as username per passport-local-mongoose config
    User.register(newUser, password, (err, user) => {
      if (err) {
        console.error("❌ Error registering user:", err.message);
        // Handle duplicate key error (E11000)
        if (err.name === 'MongoServerError' && err.code === 11000) {
          if (err.keyPattern && err.keyPattern.phone) {
            req.flash("error", "This phone number is already registered. Please login or use a different number.");
          } else if (err.keyPattern && err.keyPattern.email) {
            req.flash("error", "This email is already registered. Please login.");
          } else {
            req.flash("error", "A user with the given details already exists.");
          }
        } else {
          req.flash("error", err.message);
        }
        return res.redirect("/users/signup");
      }
      req.flash("success", "Registration successful. Please log in.");
      res.redirect("/users/login");
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    res.render("users/signup", {
      error: "Something went wrong. Please try again.",
    });
  }
};

// GET: Registration Page
module.exports.renderRegistration = (req, res) => {
  res.render("users/signup.ejs", {
    formData: {},
    error: null,
    success: null,
    messages: {},
  });
};

// GET: Login Page
module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

// GET: Enhanced Profile Page with Health Analytics (only for logged-in users)
module.exports.renderProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      req.flash('error', 'Please log in to view your profile.');
      return res.redirect('/users/login');
    }

    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(user);

    // Get recent health logs (last 5)
    const recentHealthLogs = user.healthLogs
      ? user.healthLogs.slice(-5).reverse()
      : [];

    // Get recent interaction checks (last 3)
    const recentInteractionChecks = user.interactionChecks
      ? user.interactionChecks.slice(-3).reverse()
      : [];

    // Get recent AI predictions (last 3)
    const recentPredictions = user.aiPredictions
      ? user.aiPredictions.slice(-3).reverse()
      : [];

    // Prepare stats
    const profileStats = {
      totalHealthLogs: user.healthLogs ? user.healthLogs.length : 0,
      totalInteractionChecks: user.interactionChecks ? user.interactionChecks.length : 0,
      totalPredictions: user.aiPredictions ? user.aiPredictions.length : 0,
      lastHealthAssessment: user.lastHealthAssessment,
      xrayCount: user.xrayCount || 0
    };

    res.render("users/profile.ejs", {
      user: user,
      profileCompleteness,
      recentHealthLogs,
      recentInteractionChecks,
      recentPredictions,
      profileStats,
      title: 'My Health Profile | Healthfy'
    });

  } catch (error) {
    console.error('❌ [PROFILE] Error rendering profile:', error);
    req.flash('error', 'Failed to load profile page.');
    res.redirect('/home');
  }
};

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const fields = {
    // Basic info (40 points)
    name: 5,
    email: 5,
    age: 5,
    gender: 5,
    phone: 5,
    address: 5,
    profileImage: 5,
    dob: 5,

    // Health profile (40 points)
    height: 5,
    weight: 5,
    bloodGroup: 5,
    bloodPressure: 5,
    bloodSugar: 5,
    cholesterol: 5,
    heartRate: 5,
    lifestyle: 5,

    // Medical history (20 points)
    allergies: 5,
    medicalHistory: 5,
    currentMedications: 5,
    familyHistory: 5
  };

  let completed = 0;
  let total = 0;
  const missing = [];

  Object.entries(fields).forEach(([field, points]) => {
    total += points;

    const value = user[field];
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) completed += points;
        else missing.push(field);
      } else if (typeof value === 'object') {
        if (Object.keys(value).length > 0 && Object.values(value).some(v => v !== null && v !== undefined)) {
          completed += points;
        } else {
          missing.push(field);
        }
      } else if (typeof value === 'string') {
        if (value.trim().length > 0) completed += points;
        else missing.push(field);
      } else {
        completed += points;
      }
    } else {
      missing.push(field);
    }
  });

  const percentage = Math.round((completed / total) * 100);

  return {
    percentage,
    completed,
    total,
    missing: missing.slice(0, 5), // Show top 5 missing fields
    level: percentage >= 90 ? 'Excellent' :
      percentage >= 70 ? 'Good' :
        percentage >= 50 ? 'Moderate' : 'Incomplete'
  };
};

// ============================
// Authentication
// ============================

// POST: Register New User
// Handle signup form submission
// Handle signup

// Logout
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/users/login");
  });
};

exports.loginUser = (req, res, next) => {
  // Accept either email or username input; schema uses email as username
  if (req.body.username && !req.body.email) {
    req.body.email = req.body.username;
  }
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
    usernameField: "email",
  })(req, res, function () {
    req.flash("success", "Welcome back!");
    res.redirect("/home");
  });
};

// GET: Logout
module.exports.logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "You are logged out.");
    res.redirect("/");
  });
};

// ============================
// Account Management
// ============================

// GET: Render Update Profile Form
module.exports.renderUpdateProfile = (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please log in to update your profile.');
      return res.redirect('/users/login');
    }

    res.render("users/update-profile.ejs", {
      user: req.user,
      title: 'Update Profile | Healthfy'
    });
  } catch (error) {
    console.error('❌ [UPDATE-PROFILE] Error rendering update profile:', error);
    req.flash('error', 'Failed to load update profile page.');
    res.redirect('/users/profile');
  }
};

// POST: Update Profile
module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name, phone, gender, dob,
      height, weight, bloodGroup,
      bloodPressureSystolic, bloodPressureDiastolic,
      heartRate, bloodSugarFasting, bloodSugarPostMeal, bloodSugarHba1c,
      cholesterolTotal, cholesterolHdl, cholesterolLdl, cholesterolTriglycerides,
      allergies, medicalHistory, currentMedications, surgeries, familyHistory,
      smokingStatus, alcoholStatus, diet, exerciseFrequency, sleepHours, stressLevel,
      emergencyContactName, emergencyContactRelation, emergencyContactPhone,
      addressStreet, addressCity, addressState, addressCountry, addressPincode
    } = req.body;

    // Parse arrays from comma-separated strings
    const parseArray = (str) => str ? str.split(',').map(item => item.trim()).filter(Boolean) : [];

    // Build update object
    const updateData = {
      name: name || req.user.name,
      phone: phone || req.user.phone,
      gender: gender || req.user.gender,
      dob: dob ? new Date(dob) : req.user.dob,
      height: height ? Number(height) : req.user.height,
      weight: weight ? Number(weight) : req.user.weight,
      bloodGroup: bloodGroup || req.user.bloodGroup,
      heartRate: heartRate ? Number(heartRate) : req.user.heartRate,
      allergies: parseArray(allergies),
      medicalHistory: parseArray(medicalHistory),
      currentMedications: parseArray(currentMedications),
      surgeries: parseArray(surgeries),
      familyHistory: parseArray(familyHistory)
    };

    // Handle nested objects
    if (bloodPressureSystolic || bloodPressureDiastolic) {
      updateData.bloodPressure = {
        systolic: bloodPressureSystolic ? Number(bloodPressureSystolic) : req.user.bloodPressure?.systolic,
        diastolic: bloodPressureDiastolic ? Number(bloodPressureDiastolic) : req.user.bloodPressure?.diastolic
      };
    }

    if (bloodSugarFasting || bloodSugarPostMeal || bloodSugarHba1c) {
      updateData.bloodSugar = {
        fasting: bloodSugarFasting ? Number(bloodSugarFasting) : req.user.bloodSugar?.fasting,
        postMeal: bloodSugarPostMeal ? Number(bloodSugarPostMeal) : req.user.bloodSugar?.postMeal,
        hba1c: bloodSugarHba1c ? Number(bloodSugarHba1c) : req.user.bloodSugar?.hba1c
      };
    }

    if (cholesterolTotal || cholesterolHdl || cholesterolLdl || cholesterolTriglycerides) {
      updateData.cholesterol = {
        total: cholesterolTotal ? Number(cholesterolTotal) : req.user.cholesterol?.total,
        hdl: cholesterolHdl ? Number(cholesterolHdl) : req.user.cholesterol?.hdl,
        ldl: cholesterolLdl ? Number(cholesterolLdl) : req.user.cholesterol?.ldl,
        triglycerides: cholesterolTriglycerides ? Number(cholesterolTriglycerides) : req.user.cholesterol?.triglycerides
      };
    }

    if (smokingStatus || alcoholStatus || diet || exerciseFrequency || sleepHours || stressLevel) {
      updateData.lifestyle = {
        smoking: smokingStatus === 'true' || smokingStatus === 'on',
        alcohol: alcoholStatus === 'true' || alcoholStatus === 'on',
        diet: diet || req.user.lifestyle?.diet,
        exerciseFrequency: exerciseFrequency || req.user.lifestyle?.exerciseFrequency,
        sleepHours: sleepHours ? Number(sleepHours) : req.user.lifestyle?.sleepHours,
        stressLevel: stressLevel ? Number(stressLevel) : req.user.lifestyle?.stressLevel
      };
    }

    if (emergencyContactName || emergencyContactRelation || emergencyContactPhone) {
      updateData.emergencyContact = {
        name: emergencyContactName || req.user.emergencyContact?.name,
        relation: emergencyContactRelation || req.user.emergencyContact?.relation,
        phone: emergencyContactPhone || req.user.emergencyContact?.phone
      };
    }

    if (addressStreet || addressCity || addressState || addressCountry || addressPincode) {
      updateData.address = {
        street: addressStreet || req.user.address?.street,
        city: addressCity || req.user.address?.city,
        state: addressState || req.user.address?.state,
        country: addressCountry || req.user.address?.country,
        pincode: addressPincode || req.user.address?.pincode
      };
    }

    // Calculate BMI if height and weight are provided
    if (updateData.height && updateData.weight) {
      const heightInMeters = updateData.height / 100;
      updateData.bmi = Math.round((updateData.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }

    // Update the user
    await User.findByIdAndUpdate(userId, updateData, { new: true });

    console.log('✅ [UPDATE-PROFILE] Profile updated successfully for user:', userId);
    req.flash("success", "Profile updated successfully!");
    res.redirect("/users/profile");

  } catch (err) {
    console.error('❌ [UPDATE-PROFILE] Error updating profile:', err);
    req.flash("error", "Failed to update profile. Please try again.");
    res.redirect("/users/update-profile");
  }
};

// ============================
// Password Reset (Forgot / Reset)
// ============================

// POST: Request Password Reset
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "No account with that email exists.");
      return res.redirect("/users/forgot");
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Setup mailer (configure properly in production)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetURL = `http://${req.headers.host}/users/reset/${token}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      text: `You requested a password reset. Click here: ${resetURL}`,
    });

    req.flash("info", "Password reset email sent!");
    res.redirect("/users/forgot");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error sending reset email.");
    res.redirect("/users/forgot");
  }
};

// GET: Reset Password Form
module.exports.renderResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or expired.");
      return res.redirect("/users/forgot");
    }

    res.render("users/reset.ejs", { token: req.params.token });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong.");
    res.redirect("/users/forgot");
  }
};

// POST: Reset Password
module.exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or expired.");
      return res.redirect("/users/forgot");
    }

    if (req.body.password !== req.body.confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("back");
    }

    // Use passport-local-mongoose helper to set password correctly
    await new Promise((resolve, reject) => {
      user.setPassword(req.body.password, (err) => {
        if (err) return reject(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save().then(resolve).catch(reject);
      });
    });

    req.flash("success", "Password has been reset. You can now log in.");
    res.redirect("/users/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to reset password.");
    res.redirect("/users/forgot");
  }
};
