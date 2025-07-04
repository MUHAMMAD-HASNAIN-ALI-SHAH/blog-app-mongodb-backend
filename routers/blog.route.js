const express = require("express");
const { protectedRoute } = require("../middlewares/auth.middleware");
const {
  addBlog,
  deleteBlog,
  editBlog,
  getMyBlogs,
  allBlogs,
  blogData,
  addComment,
  like,
  checkLiked,
  totalComment,
  totalLikes,
  search,
  categoryBlogs,
  viewBlogCount,
  popularBlogs,
  likedBlogs,
  totalViews,
} = require("../controllers/blog.controller");
const router = express.Router();

router.route("/").post(protectedRoute, addBlog); // add a blog
router.route("/:id").delete(protectedRoute, deleteBlog); // delete the blog
router.route("/").put(protectedRoute, editBlog); // update the blog
router.route("/").get(protectedRoute, getMyBlogs); // get my blogs

router.route("/blog").get(allBlogs); // get the blogs
router.route("/blog/:id").get(blogData); // get the blog data

router.route("/comment/:id").post(protectedRoute, addComment); // comment the blog
router.route("/comments").get(protectedRoute, totalComment); // get total comments
router.route("/like/:id").post(protectedRoute, like); // liked the blog
router.route("/likes").get(protectedRoute, totalLikes); // get total likes
router.route("/like/:id").get(protectedRoute, checkLiked); // check that liked the blog
router.route("/my-views").get(protectedRoute, totalViews); // views count

router.route("/search").post(search); // search the blog

router.route("/category").post(categoryBlogs); // category wise blogs

router.route("/view-blog").post(viewBlogCount); // views count

router.route("/popular-blogs").get(popularBlogs); // get popular blogs

router.route("/liked-blogs").get(protectedRoute, likedBlogs); // get liked blogs profile page

module.exports = router;
