const registerValidator = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email is empty
    if (!email) {
      return res.status(400).json({ msg: "Please fill in email" });
    }

    // Check if password is empty
    if (!password) {
      return res.status(400).json({ msg: "Please fill in password" });
    }

    // Check if password is less than 6 characters
    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    // Check if the email is less than 20 characters
    if (email.length > 40) {
      return res
        .status(400)
        .json({ msg: "Email must be less than 40 characters" });
    }

    // check password length
    if (password.length < 8 || password.length > 20) {
      return res
        .status(400)
        .json({ msg: "Password must be between 8 and 20 characters" });
    }

    next();
  } catch (error) {
    console.error("Register Validator Error: " + error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const loginValidator = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email is empty
    if (!email) {
      return res.status(400).json({ msg: "Please fill in email" });
    }

    // Check if password is empty
    if (!password) {
      return res.status(400).json({ msg: "Please fill in password" });
    }

    next();
  } catch (error) {
    console.error("Login Validator Error: " + error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = { registerValidator, loginValidator };
