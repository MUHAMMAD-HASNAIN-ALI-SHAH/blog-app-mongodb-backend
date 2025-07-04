const cloudinary = require("../config/cloudinary");
const Blog = require("../models/blog.model");
const Like = require("../models/like.model");
const Comment = require("../models/comment.model");

const addBlog = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, image, category } = req.body;

    const url = await cloudinary.uploader.upload(image, {
      folder: "blogs_data",
    });
    const imageUrl = url.secure_url;

    const blog = new Blog({
      title,
      description,
      image: imageUrl,
      category,
      userId: user._id,
    });

    await blog.save();

    return res.status(201).json({ msg: "Blog added successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const editBlog = async (req, res) => {
  try {
    const user = req.user;
    const { _id, title, description, image, category } = req.body;

    const blog = await Blog.findById(_id);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    if (!blog.userId.equals(user._id)) {
      return res.status(403).json({ msg: "You are not authorized" });
    }

    let imageUrl = blog.image;

    if (image !== blog.image) {
      // Extract public ID from image URL (assuming Cloudinary format)
      const parts = blog.image.split("/");
      const fileName = parts[parts.length - 1];
      const imagePublicKey = fileName.split(".")[0];

      await cloudinary.uploader.destroy(`blogs_data/${imagePublicKey}`);

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "blogs_data",
      });
      imageUrl = uploadResponse.secure_url;
    }

    blog.title = title;
    blog.description = description;
    blog.image = imageUrl;
    blog.category = category;

    await blog.save();

    return res.status(200).json({ msg: "Blog updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    if (!blog.userId.equals(user._id)) {
      return res.status(403).json({ msg: "You are not authorized" });
    }

    // Extract public key for deletion
    const parts = blog.image.split("/");
    const fileName = parts[parts.length - 1];
    const imagePublicKey = fileName.split(".")[0];

    await cloudinary.uploader.destroy(`blogs_data/${imagePublicKey}`);

    await Blog.findByIdAndDelete(id);

    return res.status(200).json({ msg: "Blog deleted successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const getMyBlogs = async (req, res) => {
  try {
    const user = req.user;
    const blogs = await Blog.find({ userId: user._id });
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const allBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const blogData = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ msg: "No blog found" });
    }

    const comments = await Comment.find({ blogId: id });
    const likes = await Like.find({ blogId: id });

    const blogObject = blog.toObject();
    blogObject.comments = comments;
    blogObject.likes = likes;

    return res.status(200).json({ blogData: blogObject });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.id;
    const { comment } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ msg: "No blog found" });
    }

    const newComment = new Comment({
      comment,
      blogId: id,
      userId: user._id,
      username: user.username,
    });

    await newComment.save();

    return res.status(200).json({ msg: "Comment added successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const totalComment = async (req, res) => {
  try {
    const user = req.user;
    const blogs = await Blog.find({ userId: user._id });

    if (blogs.length === 0) {
      return res.status(200).json({ comments: 0 });
    }

    // Sum comments count across all blogs
    const blogIds = blogs.map((b) => b._id);
    const totalComments = await Comment.countDocuments({
      blogId: { $in: blogIds },
    });

    return res.status(200).json({ comments: totalComments });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const like = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ msg: "No blog found" });
    }

    const existingLike = await Like.findOne({ blogId: id, userId: user._id });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res.status(200).json({ msg: "Disliked" });
    }

    const newLike = new Like({
      blogId: id,
      userId: user._id,
    });
    await newLike.save();

    return res.status(200).json({ msg: "Liked" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const totalLikes = async (req, res) => {
  try {
    const user = req.user;
    const blogs = await Blog.find({ userId: user._id });

    if (blogs.length === 0) {
      return res.status(200).json({ likes: 0 });
    }

    const blogIds = blogs.map((b) => b._id);
    const totalLikes = await Like.countDocuments({ blogId: { $in: blogIds } });

    return res.status(200).json({ likes: totalLikes });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const checkLiked = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const liked = await Like.findOne({ blogId: id, userId: user._id });

    return res.status(200).json({ liked: !!liked });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const search = async (req, res) => {
  try {
    const { search } = req.body;
    // MongoDB regex search on title or description (case insensitive)
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });

    if (blogs.length === 0) {
      return res.status(400).json({ blogs: [] });
    }

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const categoryBlogs = async (req, res) => {
  try {
    const { category } = req.body;
    const blogs = await Blog.find({ category });

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const viewBlogCount = async (req, res) => {
  try {
    const { blogId } = req.body;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    blog.views = (blog.views || 0) + 1;
    await blog.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const popularBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ views: -1 }).limit(3);
    if (blogs.length === 0) {
      return res.status(404).json({ msg: "No popular blogs found" });
    }

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const likedBlogs = async (req, res) => {
  try {
    const user = req.user;
    const blogs = await Like.find({ userId: user._id }).populate("blogId");
    if (likedBlogs.length === 0) {
      return res.status(404).json({ blogs: [] });
    }

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const totalViews = async (req, res) => {
  try {
    const user = req.user;

    const blogs = await Blog.find({ userId: user._id });
    if (blogs.length === 0) {
      return res.status(200).json({ views: 0 });
    }

    const totalViews = blogs.reduce((acc, blog) => acc + blog.views, 0);
    return res.status(200).json({ views: totalViews });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  addBlog,
  editBlog,
  deleteBlog,
  getMyBlogs,
  allBlogs,
  blogData,
  addComment,
  totalComment,
  like,
  totalLikes,
  checkLiked,
  search,
  categoryBlogs,
  viewBlogCount,
  popularBlogs,
  likedBlogs,
  totalViews
};
