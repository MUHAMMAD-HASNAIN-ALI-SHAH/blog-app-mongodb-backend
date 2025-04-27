const cloudinary = require("../config/cloudinary");
const db = require("../config/db");

const addBlog = async (req, res) => {
  try {
    const user = req.user;

    const { title, description, image } = req.body;

    const url = await cloudinary.uploader.upload(image, {
      folder: "blogs_data",
    });

    const imageUrl = url.secure_url;

    const [addBlog] = await db
      .promise()
      .query(
        "INSERT INTO BLOGS (title, description, image, userId) VALUES (?, ?, ?, ?)",
        [title, description, imageUrl, user.id]
      );

    return res.status(201).json({ msg: "Blog added successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const editBlog = async (req, res) => {
  try {
    const user = req.user;
    const { id, title, description, image } = req.body;

    const [blog] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE id = ?", [id]);

    if (blog.length === 0) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    const getImageFromBlog = blog[0].image;

    if (blog[0].userID !== user.id) {
      return res.status(403).json({ msg: "You are not authorized" });
    }

    let imageUrl = blog[0].image;

    if (image !== blog[0].image) {
      const imagePublicKey = getImageFromBlog.split("/")[8].split(".")[0];

      await cloudinary.uploader.destroy(`blogs_data/${imagePublicKey}`);

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "blogs_data",
      });

      imageUrl = uploadResponse.secure_url;
    }

    await db
      .promise()
      .query(
        "UPDATE BLOGS SET title = ?, description = ?, image = ? WHERE id = ?",
        [title, description, imageUrl, id]
      );

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

    const [blog] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE id = ?", [id]);

    if (blog.length === 0) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    if (blog[0].userID !== user.id) {
      return res.status(403).json({ msg: "You are not authorized" });
    }

    const imagePublicKey = blog[0].image.split("/")[8].split(".")[0];

    await cloudinary.uploader.destroy(`blogs_data/${imagePublicKey}`);

    await db.promise().query("DELETE FROM BLOGS WHERE id = ?", [id]);

    return res.status(200).json({ msg: "Blog deleted successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const getMyBlogs = async (req, res) => {
  try {
    const user = req.user;

    const [getMyBlogs] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE userId = ?", [user.id]);

    if (getMyBlogs.length === 0) {
      return res.status(404).json({ blogs: [] });
    }

    return res.status(200).json({ blogs: getMyBlogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const allBlogs = async (req, res) => {
  try {
    const [getBlogs] = await db.promise().query("SELECT * FROM BLOGS");

    if (getBlogs.length === 0) {
      return res.status(404).json({ blogs: [] });
    }

    return res.status(200).json({ blogs: getBlogs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const blogData = async (req, res) => {
  try {
    
    const { id } = req.params;

    const [blogData] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE id = ?", [id]);

    if (blogData.length === 0) {
      return res.status(404).json({ msg: "No blog found" });
    }

    const [comments] = await db
      .promise()
      .query("SELECT * FROM COMMENTS WHERE blogID = ?", [id]);

    if (comments.length === 0) {
      blogData[0].comments = [];
    } else {
      blogData[0].comments = comments;
    }

    const [likes] = await db
      .promise()
      .query("SELECT * FROM LIKES WHERE blogID = ?", [id]);

    if (likes.length === 0) {
      blogData[0].likes = [];
    } else {
      blogData[0].likes = likes;
    }

    res.status(200).json({ blogData: blogData[0] });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const checkBlogOwnerShip = async (req, res) => {
  try {
    const user = req.user;

    const { blogId } = req.params;

    const blog = await Blog.findOne({ _id: blogId, userId: user._id });

    if (!blog) {
      return res.status(404).json({ valid: false });
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    const { comment } = req.body;

    const [rows] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: "No blog found" });
    }

    await db
      .promise()
      .query(
        "INSERT INTO COMMENTS (comment, blogID, userID, username) VALUES (?, ?, ?, ?)",
        [comment, id, user.id, user.username]
      );

    return res.status(200).json({ msg: "Comment added successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const totalComment = async (req, res) => {
  try {
    const user = req.user;

    const [getallBlogs] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE userID = ?", [user.id]);

    if (getallBlogs.length === 0) {
      return res.status(200).json({ comments: 0 });
    }

    let totalComments = 0;

    for (let i = 0; i < getallBlogs.length; i++) {
      const [getComments] = await db
        .promise()
        .query("SELECT * FROM COMMENTS WHERE blogID = ?", [getallBlogs[i].id]);

      totalComments += getComments.length;
    }
    return res.status(200).json({ comments: totalComments });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const like = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const [blog] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE id = ?", [id]);

    if (blog.length === 0) {
      return res.status(404).json({ msg: "No blog found" });
    }

    const [alreadyLiked] = await db
      .promise()
      .query("SELECT * FROM LIKES WHERE blogID = ? AND userID = ?", [
        id,
        user.id,
      ]);

    if (alreadyLiked.length > 0) {
      await db
        .promise()
        .query("DELETE FROM LIKES WHERE blogID = ? AND userID = ?", [
          id,
          user.id,
        ]);

      return res.status(200).json({ msg: "Disliked" });
    }

    await db
      .promise()
      .query("INSERT INTO LIKES (blogID, userID) VALUES (?, ?)", [id, user.id]);

    return res.status(200).json({ msg: "Liked" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const totalLikes = async (req, res) => {
  try {
    const user = req.user;

    const [getallBlogs] = await db
      .promise()
      .query("SELECT * FROM BLOGS WHERE userID = ?", [user.id]);

    if (getallBlogs.length === 0) {
      return res.status(200).json({ likes: 0 });
    }

    let totalLikes = 0;

    for (let i = 0; i < getallBlogs.length; i++) {
      const [getLikes] = await db
        .promise()
        .query("SELECT * FROM LIKES WHERE blogID = ?", [getallBlogs[i].id]);

      totalLikes += getLikes.length;
    }
    return res.status(200).json({ likes: totalLikes });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const checkLiked = async (req, res) => {
  try {
     
    const user = req.user;

    const { id } = req.params;

    const [liked] = await db
      .promise()
      .query("SELECT * FROM LIKES WHERE blogID = ? AND userID = ?", [
        id,
        user.id,
      ]);

    if (liked.length > 0) {
      return res.status(200).json({ liked: true });
    }

    return res.status(200).json({ liked: false });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const search = async (req, res) => {
  try {
    const { search } = req.query;

    const [getBlogs] = await db
      .promise()
      .query(
        "SELECT * FROM BLOGS WHERE title LIKE ? OR description LIKE ?",
        [`%${search}%`, `%${search}%`]
      );

    if (getBlogs.length === 0) {
      return res.status(200).json({ blogs: [] });
    }

    return res.status(200).json({ blogs: getBlogs });
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
  checkBlogOwnerShip,
  addComment,
  totalComment,
  like,
  totalLikes,
  checkLiked,
  search,
};
