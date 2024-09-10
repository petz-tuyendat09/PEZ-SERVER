const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.userRole === "admin") {
    return next();
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }
};

module.exports = ensureAdmin;
