const mongoose = require("mongoose");

const allowedCategories = [
  "technology",
  "travel",
  "food",
  "lifestyle",
  "health",
  "education",
  "finance",
  "sports",
  "fashion",
  "entertainment",
];

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: allowedCategories,
      maxlength: 50,
    },
    views: { type: Number, default: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
