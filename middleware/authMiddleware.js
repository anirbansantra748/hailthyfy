// middleware/authMiddleware.js

module.exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  req.flash("error", "Please log in first.");
  res.redirect("/users/login");
};

module.exports.ensureDoctor = (req, res, next) => {
  if (req.user && req.user.isDoctor) return next();
  req.flash("error", "You must be registered as a doctor to access this page.");
  res.redirect("/doctors/register");
};
