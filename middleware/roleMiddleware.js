module.exports = {
  isUser: (req, res, next) => {
    if (req.user && !req.user.isDoctor) {
      return next();
    }
    res.status(403).send('Forbidden');
  },
  isDoctor: (req, res, next) => {
    if (req.user && req.user.isDoctor) {
      return next();
    }
    res.status(403).send('Forbidden');
  },
};