const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const doctorController = require("../controllers/doctorController");
const { isLoggedIn } = require("../middleware/authMiddleware");

// Add debugging middleware
router.use('/signup', (req, res, next) => {
  console.log('🚀 Signup route hit:', req.method);
  console.log('📊 Content-Type:', req.headers['content-type']);
  console.log('📋 Body keys:', Object.keys(req.body || {}));
  console.log('📦 Body size:', JSON.stringify(req.body || {}).length);
  next();
});

// Routes for User Authentication
router.post("/signup", userController.registerUser);
router.get("/signup", userController.renderRegistration);
router.get("/login", userController.renderLogin);
router.post("/login", userController.loginUser);
router.get("/profile", isLoggedIn, userController.renderProfile);
router.post("/profile", isLoggedIn, userController.updateProfile);
router.get("/update-profile", isLoggedIn, userController.renderUpdateProfile);
router.post("/update-profile", isLoggedIn, userController.updateProfile);
router.get("/dashboard", isLoggedIn, (req, res) => {
  if (req.user && req.user.isDoctor) {
    return res.render("users/dashboard.ejs", {
      user: req.user,
      role: "doctor",
    });
  }
  res.render("users/dashboard.ejs", { user: req.user, role: "user" });
});
router.post("/logout", userController.logoutUser);
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "You are logged out.");
    res.redirect("/");
  });
});

// Chat doctors route removed - feature not needed

// Export the router
module.exports = router;
