const blogValidator = async (req, res, next) => {
  try {
    const { title, description, image } = req.body;

    // Check if title is empty
    if (!title) {
      return res.status(400).json({ msg: "Please provide a title" });
    }

    // Check if description is empty
    if (!description) {
      return res.status(400).json({ msg: "Please provide a description" });
    }

    // Check if image is empty
    if (!image) {
      return res.status(400).json({ msg: "Please provide an image URL" });
    }

    // Validate title length (1 to 100 characters)
    if (title.length > 100) {
      return res
        .status(400)
        .json({ msg: "Title must be at most 100 characters" });
    }

    // Validate description length (1 to 1000 characters)
    if (description.length > 1000) {
      return res
        .status(400)
        .json({ msg: "Description must be at most 1000 characters" });
    }

    next();
  } catch (error) {
    console.error("Blog Validator Error: " + error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = blogValidator;
