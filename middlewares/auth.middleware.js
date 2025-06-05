const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ msg: "Access Denied: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Protected Route Error:", err.message);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

module.exports = { protectedRoute };
