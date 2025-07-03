const usernameValidator = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({
        msg: "Username is required and must be a string.",
      });
    }

    const hasOnlyLowercaseAndNumbers = (str) => /^[a-z0-9]+$/.test(str);
    const startsWithLowercaseLetter = (str) => /^[a-z]/.test(str);

    if (username.length < 3) {
      return res.status(400).json({
        msg: "Username must be at least 3 characters long.",
      });
    }

    if (username.includes(" ")) {
      return res.status(400).json({
        msg: "Username cannot contain spaces.",
      });
    }

    if (!startsWithLowercaseLetter(username)) {
      return res.status(400).json({
        msg: "Username must start with a lowercase letter.",
      });
    }

    if (!hasOnlyLowercaseAndNumbers(username)) {
      return res.status(400).json({
        msg: "Username can only contain lowercase letters and numbers.",
      });
    }

    next();
  } catch (error) {
    console.error("Username Validator Error:", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = usernameValidator;
