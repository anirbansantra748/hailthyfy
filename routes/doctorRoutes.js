const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const doctorController = require("../controllers/doctorController");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { isDoctor } = require("../middleware/roleMiddleware");

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/doctors");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// Public routes (no login required)
router.get("/", doctorController.listDoctors); // List all doctors with search/filter

// Protected routes (login required)
router.get("/register", isLoggedIn, doctorController.renderRegisterForm);
router.post(
  "/register",
  isLoggedIn,
  upload.single("profilePicture"),
  doctorController.registerDoctor
);

// Dynamic routes (must come after specific routes)
router.get("/profile/:id", doctorController.getDoctorProfile); // View doctor profile

// Chat request routes
router.post(
  "/profile/:doctorId/chat-request",
  isLoggedIn,
  doctorController.sendChatRequest
);
router.post(
  "/chat-request/:requestId/respond",
  isLoggedIn,
  isDoctor,
  doctorController.respondToChatRequest
);
router.get("/chat-requests", isLoggedIn, isDoctor, doctorController.getChatRequests);

module.exports = router;
