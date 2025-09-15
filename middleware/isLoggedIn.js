// middleware/auth.js
module.exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be logged in to continue.");
  res.redirect("/users/login");
};
