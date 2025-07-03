const express = require("express");
const { protectedRoute } = require("../middlewares/auth.middleware");
const router = express.Router();

router.route("/").post(protectedRoute);

module.exports = router;
