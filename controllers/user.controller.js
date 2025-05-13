const bcrypt = require("bcrypt");
const { generateToken } = require("../config/utils.js");
const db = require("../config/db.js");
const nodemailer = require("nodemailer");
require("dotenv").config();

const getCode = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const getEmail = email.toLowerCase();

    // Check if the user already exists
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM USERS WHERE email = ?", [getEmail]);

    if (existingUser.length > 0) {
      if (!existingUser[0].isVerified) {
        const userId = existingUser[0].id;

        // Delete the unverified user
        await db.promise().query("DELETE FROM USERS WHERE id = ?", [userId]);

        // Delete the code if it exists
        await db
          .promise()
          .query("DELETE FROM CODES WHERE userId = ?", [userId]);
      } else {
        return res.status(400).json({ msg: "User already exists" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into USERS table
    const [insertResult] = await db
      .promise()
      .query(
        "INSERT INTO USERS (username, email, password, isVerified) VALUES (?, ?, ?, ?)",
        [username, getEmail, hashedPassword, false]
      );

    const userId = insertResult.insertId;

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Insert code into CODES table
    await db
      .promise()
      .query("INSERT INTO CODES (code, userId, expiresAt) VALUES (?, ?, ?)", [
        code,
        userId,
        expiresAt,
      ]);

    // Send email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const message = `
        <div style="max-width: 600px; margin: auto; padding: 30px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <h2 style="color: #333; text-align: center;">🛍️ Bloggy Account Verification</h2>
          
          <p style="font-size: 16px; color: #444; margin-top: 20px;">
            We received a request to register an account to <strong>Bloggy</strong> using your email.
          </p>
          
          <p style="font-size: 16px; color: #444; margin-bottom: 30px;">
            If it was you, please use the following code to complete your registration:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 10px 20px; background-color: #f0f0f0; border-radius: 8px; color: #000;">
              ${code}
            </span>
          </div>
  
          <p style="font-size: 15px; color: #777; text-align: center; margin-top: 30px;">
            If this wasn’t you, you can safely ignore this email.
          </p>
        </div>
      `;

    const mailOptions = {
      from: process.env.EMAIL,
      to: getEmail,
      subject: "Bloggy Account Verification Code",
      html: message,
    };

    try {
      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        msg: "Please enter the 6-digit verification code sent to your email.",
        messageSent: true,
        user: {
          _id: userId,
          username: username,
          email: getEmail,
        },
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Cleanup if email fails
      await db.promise().query("DELETE FROM USERS WHERE id = ?", [userId]);
      await db.promise().query("DELETE FROM CODES WHERE userId = ?", [userId]);
      return res
        .status(500)
        .json({ msg: "Failed to send verification email." });
    }
  } catch (err) {
    console.error("Register Controller Error: " + err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const register = async (req, res) => {
  try {
    const { code, email } = req.body;

    // 1. Find user by email
    const [users] = await db
      .promise()
      .query("SELECT * FROM USERS WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(400).json({ msg: "User not found" });
    }

    const user = users[0];
    const userId = user.id;

    // 2. Check verification code (must not be expired)
    const [codes] = await db
      .promise()
      .query("SELECT * FROM CODES WHERE userId = ? AND code = ?", [
        userId,
        code,
      ]);

    if (codes.length === 0) {
      // Delete user and attempt to delete code
      await db.promise().query("DELETE FROM USERS WHERE id = ?", [userId]);
      await db
        .promise()
        .query("DELETE FROM CODES WHERE userId = ? AND code = ?", [
          userId,
          code,
        ]);
      return res
        .status(400)
        .json({ msg: "Invalid or expired code plz register again" });
    }

    // Check if the code is expired
    if (codes.length > 0) {
      const verificationCode = codes[0];
      const currentTime = new Date();
      const expiresAt = new Date(verificationCode.expiresAt);
      if (currentTime > expiresAt) {
        await db
          .promise()
          .query("DELETE FROM CODES WHERE id = ?", [verificationCode.id]);
        return res.status(400).json({ msg: "Code has expired" });
      }
    }

    const verificationCode = codes[0];

    // 3. Update user as verified
    await db
      .promise()
      .query("UPDATE USERS SET isVerified = ? WHERE id = ?", [true, userId]);

    // 4. Delete the used verification code
    await db
      .promise()
      .query("DELETE FROM CODES WHERE id = ?", [verificationCode.id]);

    // 5. Generate token and respond
    generateToken(userId, res);

    return res.status(200).json({ msg: "Account registered successfully" });
  } catch (err) {
    console.error("Verify Code Controller Error:", err.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ msg: "Please fill in all fields" });
    }

    // Fetch user from DB
    const [users] = await db
      .promise()
      .query("SELECT * FROM USERS WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    // Check if user is verified
    if (!users[0].isVerified) {
      return res.status(400).json({ msg: "User is not verified" });
    }

    const user = users[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate token and send response
    generateToken(user.id, res);

    return res.status(200).json({
      msg: "Login successful",
      user: {
        _id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login Controller Error: " + err.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const verify = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Verify Controller Error: " + err.message);
    res.status(500).json({ msg: "Internal Server Error" });
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
    console.error("Logout Controller Error: " + err.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = { login, verify, logout, getCode, register };
