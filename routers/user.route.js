const express = require("express");
const {
  login,
  verify,
  logout,
  register,
  updateProfile,
  updateImage,
} = require("../controllers/user.controller");
const { protectedRoute } = require("../middlewares/auth.middleware");
const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");
const usernameValidator = require("../validators/username.validator");
const router = express.Router();

router.route("/register").post(usernameValidator, registerValidator, register);
router.route("/login").post(loginValidator, login);
router.route("/verify").get(protectedRoute, verify);
router.route("/logout").get(logout);
router.route("/profile").put(protectedRoute, updateProfile);
router.route("/image").put(protectedRoute, updateImage);

module.exports = router;
