// controllers/doctorController.js
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const ChatRequest = require("../models/ChatRequest");
const Chat = require("../models/Chat");
const path = require("path");
const fs = require("fs");

// --- Render Register Form ---
exports.renderRegisterForm = (req, res) => {
  res.render("doctor/register");
};

// --- List Doctors For Chat ---
exports.listDoctorsForChat = async (req, res) => {
  try {
    const {
      search,
      specialization,
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object - show only verified and active doctors
    const filter = { 
      isActive: true, 
      licenseVerificationStatus: "verified" 
    };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { subSpecializations: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors with pagination
    const doctors = await Doctor.find(filter)
      .populate({ path: 'user', select: 'name email profileImage', options: { lean: true } })
      .sort({ averageRating: -1, experienceYears: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalDoctors = await Doctor.countDocuments(filter);
    const totalPages = Math.ceil(totalDoctors / parseInt(limit));

    // Get unique specializations for filter
    const specializations = await Doctor.distinct("specialization");

    res.render("users/chat-doctors", {
      user: req.user,
      title: "Chat with Doctors",
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDoctors,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      filters: {
        search: search || "",
        specialization: specialization || "",
      },
      specializations,
    });
  } catch (error) {
    console.error("Error listing doctors for chat:", error);
    req.flash("error", "Failed to load doctors");
    res.redirect("/users/dashboard");
  }
};

// --- List All Doctors with Search and Filter ---
exports.listDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      experience,
      rating,
      consultationMode,
      availability,
      verificationStatus,
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object - show all active doctors (including pending verification)
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { subSpecializations: { $in: [new RegExp(search, "i")] } },
        { hospitalAffiliations: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (experience) {
      const [minExp] = experience.split("-");
      filter.experienceYears = { $gte: parseInt(minExp) };
    }

    if (rating) {
      const [minRating] = rating.split("-");
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    if (consultationMode) {
      filter.consultationMode = { $in: [consultationMode] };
    }

    if (availability) {
      filter.availability = { $elemMatch: { day: availability } };
    }

    if (verificationStatus) {
      filter.licenseVerificationStatus = verificationStatus;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors with pagination
    const doctors = await Doctor.find(filter)
      .populate({ path: 'user', select: 'name email profileImage', options: { lean: true } })
      .sort({ averageRating: -1, experienceYears: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalDoctors = await Doctor.countDocuments(filter);
    const totalPages = Math.ceil(totalDoctors / parseInt(limit));

    // Get unique specializations for filter
    const specializations = await Doctor.distinct("specialization");

    // Get unique consultation modes
    const consultationModes = await Doctor.distinct("consultationMode");

    res.render("doctor/list", {
      user: req.user,
      title: "Find Doctors",
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDoctors,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      filters: {
        search: search || "",
        specialization: specialization || "",
        experience: experience || "",
        rating: rating || "",
        consultationMode: consultationMode || "",
        availability: availability || "",
        verificationStatus: verificationStatus || "",
      },
      specializations,
      consultationModes,
    });
  } catch (error) {
    console.error("Error listing doctors:", error);
    req.flash("error", "Failed to load doctors");
    res.redirect("/");
  }
};

// --- Get Doctor Profile ---
exports.getDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .populate("user", "name email profileImage")
      .populate("reviews.patient", "name profileImage");

    if (!doctor) {
      req.flash("error", "Doctor not found");
      return res.redirect("/doctors");
    }

    // Check if user has pending chat request with this doctor
    let existingChatRequest = null;
    let existingChat = null;

    if (req.user) {
      existingChatRequest = await ChatRequest.findOne({
        user: req.user._id,
        doctor: doctor._id,
        status: { $in: ["pending", "accepted"] },
      });

      if (existingChatRequest && existingChatRequest.chatId) {
        existingChat = await Chat.findById(existingChatRequest.chatId);
      }
    }

    // Get similar doctors
    const similarDoctors = await Doctor.find({
      specialization: doctor.specialization,
      _id: { $ne: doctor._id },
      isActive: true,
      licenseVerificationStatus: "verified",
    })
      .populate("user", "name profileImage")
      .limit(4);

    res.render("doctor/profile", {
      user: req.user,
      title: `Dr. ${doctor.fullName}`,
      doctor,
      existingChatRequest,
      existingChat,
      similarDoctors,
    });
  } catch (error) {
    console.error("Error getting doctor profile:", error);
    req.flash("error", "Failed to load doctor profile");
    res.redirect("/doctors");
  }
};

// --- Send Chat Request ---
exports.sendChatRequest = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      reason,
      consultationType,
      urgency,
      symptoms,
      currentMedications,
      allergies,
      preferredTimeSlots,
    } = req.body;

    // Validate required fields
    if (!reason || !consultationType) {
      return res.status(400).json({
        success: false,
        message: "Reason and consultation type are required",
      });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or inactive",
      });
    }

    // Check if user already has a pending/accepted request with this doctor
    const existingRequest = await ChatRequest.findOne({
      user: req.user._id,
      doctor: doctorId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          existingRequest.status === "pending"
            ? "You already have a pending request with this doctor"
            : "You already have an active chat with this doctor",
      });
    }

    // Parse preferred time slots
    let parsedTimeSlots = [];
    if (preferredTimeSlots && Array.isArray(preferredTimeSlots)) {
      parsedTimeSlots = preferredTimeSlots.map((slot) => ({
        day: slot.day,
        time: slot.time,
      }));
    }

    // Create chat request
    const chatRequest = new ChatRequest({
      user: req.user._id,
      doctor: doctorId,
      reason,
      consultationType,
      urgency: urgency || "medium",
      symptoms: Array.isArray(symptoms) ? symptoms : (symptoms ? symptoms.split(",").map((s) => s.trim()) : []),
      currentMedications: Array.isArray(currentMedications) ? currentMedications : (currentMedications ? currentMedications.split(",").map((m) => m.trim()) : []),
      allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(",").map((a) => a.trim()) : []),
      preferredTimeSlots: parsedTimeSlots,
    });

    await chatRequest.save();

    res.json({
      success: true,
      message: "Chat request sent successfully",
      chatRequestId: chatRequest._id,
    });
  } catch (error) {
    console.error("Error sending chat request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send chat request",
    });
  }
};

// --- Accept/Reject Chat Request (Doctor) ---
exports.respondToChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, notes, rejectedReason } = req.body;

    const chatRequest = await ChatRequest.findById(requestId)
      .populate("user", "name email")
      .populate("doctor", "fullName");

    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: "Chat request not found",
      });
    }

    // Verify the doctor is responding to their own request
    if (
      chatRequest.doctor._id.toString() !== req.user.doctorProfile.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to respond to this request",
      });
    }

    if (action === "accept") {
      // Create a new chat
      const chat = new Chat({
        participants: [chatRequest.user, chatRequest.doctor],
        participantModels: ["User", "Doctor"],
        chatType: "user_doctor",
        consultationType: chatRequest.consultationType,
        isActive: true,
      });

      await chat.save();

      // Update chat request
      chatRequest.status = "accepted";
      chatRequest.acceptedAt = new Date();
      chatRequest.doctorNotes = notes;
      chatRequest.chatCreated = true;
      chatRequest.chatId = chat._id;
      await chatRequest.save();

      res.json({
        success: true,
        message: "Chat request accepted",
        chatId: chat._id,
      });
    } else if (action === "reject") {
      chatRequest.status = "rejected";
      chatRequest.rejectedAt = new Date();
      chatRequest.rejectedReason = rejectedReason;
      chatRequest.doctorNotes = notes;
      await chatRequest.save();

      res.json({
        success: true,
        message: "Chat request rejected",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }
  } catch (error) {
    console.error("Error responding to chat request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to respond to chat request",
    });
  }
};

// --- Get Doctor's Chat Requests ---
exports.getChatRequests = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user');

    if (!doctor) {
      req.flash("error", "Doctor profile not found");
      return res.redirect("/doctors/register");
    }

    const chatRequests = await ChatRequest.find({ doctor: doctor._id })
      .populate({ 
        path: 'user',
        select: 'name email profileImage',
        match: { $exists: true },
        options: { lean: true }
      })
      .sort({ createdAt: -1 });

    // Filter out requests with deleted users
    const validChatRequests = chatRequests.filter(request => request.user !== null);

    res.render("doctor/chat-requests", {
      user: req.user,
      title: "Chat Requests",
      doctor,
      chatRequests,
      validChatRequests
    });
  } catch (error) {
    console.error("Error getting chat requests:", error);
    req.flash("error", "Failed to load chat requests");
    res.redirect("/doctors/dashboard");
  }
};

// --- Register Doctor ---
exports.registerDoctor = async (req, res) => {
  try {
    const userId = req.user._id; // logged in user
    const user = await User.findById(userId);

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/users/login");
    }

    const {
      fullName,
      gender,
      dob,
      specialization,
      subSpecializations,
      experienceYears,
      licenseNumber,
      hospitalAffiliations,
      languages,
      consultationMode,
      consultationFee,
      currency,
      availability,
      qualifications,
      achievements,
      researchPapers,
    } = req.body;

    // ✅ Required fields
    if (!fullName || !licenseNumber || !specialization) {
      req.flash("error", "Please fill all required fields.");
      return res.redirect("/doctors/register");
    }

    // ✅ Parse multi-fields
    const subSpecs = subSpecializations
      ? subSpecializations.split(",").map((s) => s.trim())
      : [];
    const hospitals = hospitalAffiliations
      ? hospitalAffiliations.split(",").map((s) => s.trim())
      : [];
    const langs = languages ? languages.split(",").map((s) => s.trim()) : [];
    const achv = achievements
      ? achievements.split(",").map((a) => a.trim())
      : [];

    // ✅ Parse research papers (Title|Journal|Year|Link)
    let research = [];
    if (researchPapers && researchPapers.trim() !== "") {
      research = researchPapers
        .split("\n")
        .map((line) => {
          const [title, journal, year, link] = line
            .split("|")
            .map((s) => s.trim());
          if (!title || !year || isNaN(Number(year))) return null;
          return { title, journal, year: Number(year), link };
        })
        .filter(Boolean);
    }

    // ✅ Handle profile picture upload
    let profilePicture = null;
    if (req.file) {
      const uploadDir = path.join(__dirname, "../uploads/doctors");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      profilePicture = `/uploads/doctors/${req.file.filename}`;
    }

    // ✅ Massage availability shape from form fields if needed
    let availabilityArray = [];
    if (availability && typeof availability === "object") {
      availabilityArray = Object.keys(availability).map((day) => {
        const dayObj = availability[day] || {};
        return {
          day,
          slots:
            dayObj.start && dayObj.end
              ? [{ start: dayObj.start, end: dayObj.end }]
              : [],
        };
      });
    }

    // ✅ Qualifications array coercion
    let qualificationsArray = [];
    if (qualifications && typeof qualifications === "object") {
      qualificationsArray = Object.values(qualifications)
        .map((q) => ({
          degree: q.degree,
          university: q.university,
          year: q.year ? Number(q.year) : undefined,
          certificateUrl: q.certificateUrl,
        }))
        .filter((q) => q.degree || q.university || q.year || q.certificateUrl);
    }

    // ✅ Create Doctor
    const doctor = new Doctor({
      user: user._id,
      fullName,
      gender,
      dob,
      specialization,
      subSpecializations: subSpecs,
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      licenseNumber,
      hospitalAffiliations: hospitals,
      languages: langs,
      consultationMode: Array.isArray(consultationMode)
        ? consultationMode
        : [consultationMode],
      consultationFee: consultationFee ? Number(consultationFee) : 0,
      currency: currency || "INR",
      availability: availabilityArray,
      qualifications: qualificationsArray,
      achievements: achv,
      researchPapers: research,
      profilePicture,
      // Auto-verify new doctors (you can implement admin verification later)
      licenseVerificationStatus: "verified",
      isActive: true,
    });

    await doctor.save();

    // ✅ Mark user as doctor
    user.isDoctor = true;
    user.doctorProfile = doctor._id;
    await user.save();

    req.flash("success", "You are now registered as a doctor!");
    res.redirect("/users/dashboard");
  } catch (err) {
    console.error("❌ Error registering doctor:", err);
    req.flash("error", err.message || "Something went wrong!");
    res.redirect("/doctors/register");
  }
};
