const bcrypt = require('bcrypt');
const { generateToken } = require('../config/utils.js');
const db = require('../config/db.js');
require("dotenv").config();

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const getUsername = username.toLowerCase();
        const getEmail = email.toLowerCase();

        // Check if the user already exists
        const [existingUser] = await db.promise().query(
            "SELECT * FROM USERS WHERE email = ?",
            [getEmail]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into database
        const [newUser] = await db.promise().query(
            "INSERT INTO USERS (username, email, password) VALUES (?, ?, ?)",
            [getUsername, getEmail, hashedPassword]
        );

        const userId = newUser.insertId;

        // Generate token and send response
        generateToken(userId, res);

        return res.status(201).json({
            msg: "Registration successful",
            user: {
                _id: userId,
                username: getUsername,
                email: getEmail,
            },
        });
    } catch (err) {
        console.error("Register Controller Error: " + err.message);
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
        const [users] = await db.promise().query("SELECT * FROM USERS WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(400).json({ msg: "User does not exist" });
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
        res.cookie("jwt", "", { maxAge: 0 });

        return res.status(200).json({ msg: "Logout successful" });
    } catch (err) {
        console.error("Logout Controller Error: " + err.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

module.exports = { register, login, verify, logout };
