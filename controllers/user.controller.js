const bcrypt = require("bcrypt");
const { generateToken } = require("../config/utils.js");
const User = require("../models/user.model.js");
const Profile = require("../models/profile.model.js");
const cloudinary = require("../config/cloudinary");
require("dotenv").config();

const register = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Please fill in all fields" });
    }

    email = email.trim().toLowerCase();
    username = username.trim();

    const existingUser = await User.find({ email });
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const existingUsername = await User.find({ username });
    if (existingUsername.length > 0) {
      return res.status(400).json({ msg: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(200).json({ msg: "Account registered successfully" });
  } catch (err) {
    console.error("Verify Code Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please fill in all fields" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = {
        name: "",
        image: "",
        bio: "",
        userId: user._id,
      };
    }

    generateToken(user._id, res);

    return res.status(200).json({
      msg: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      profile,
    });
  } catch (err) {
    console.error("Login Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const verify = async (req, res) => {
  try {
    const user = req.user;
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = {
        name: "",
        image: "",
        bio: "",
        userId: user._id,
      };
    }
    return res.status(200).json({ user, profile });
  } catch (err) {
    console.error("Verify Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(200).json({ msg: "Logout successful" });
  } catch (err) {
    console.error("Logout Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, bio } = req.body;
    if (!name || !bio) {
      return res.status(400).json({ msg: "Please fill in all fields" });
    }

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({
        userId: user._id,
        name: "",
        image: "",
        bio: "",
      });
    }

    profile.name = name;
    profile.bio = bio;

    await profile.save();

    return res.status(200).json({ msg: "Profile updated successfully", profile });
  } catch (err) {
    console.error("Logout Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const updateImage = async (req, res) => {
  try {
    const user = req.user;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ msg: "Please provide an image URL" });
    }

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({
        userId: user._id,
        name: "",
        image: "",
        bio: "",
      });
    }

    const url = await cloudinary.uploader.upload(image, {
      folder: "bloggy",
    });
    const imageUrl = url.secure_url;

    profile.image = imageUrl;
    await profile.save();

    return res.status(200).json({ msg: "Image updated successfully",image: imageUrl });
  } catch (err) {
    console.error("Logout Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = { login, verify, logout, register, updateProfile, updateImage };
