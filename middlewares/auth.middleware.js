const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protectedRoute = async (req, res, next) => {
    try {
        // Get the token from request cookies
        const token = req.cookies.jwt;

        // Check if the token exists
        if (!token) {
            return res.status(401).json({ msg: "No token provided" });
        }

        // Verify the token
        const isVerified = jwt.verify(token, process.env.JWT_SECRET);
        if (!isVerified) {
            return res.status(403).json({ msg: "Token verification failed" });
        }

        // Check if the user exists in MySQL
        const [users] = await db.promise().query("SELECT * FROM USERS WHERE id = ?", [isVerified.userId]);

        if (users.length === 0) {
            return res.status(404).json({ msg: "No user found" });
        }

        // Set user in request object
        req.user = users[0];

        next();
    } catch (err) {
        console.error("Protected Route Middleware Error: " + err.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

module.exports = { protectedRoute };
