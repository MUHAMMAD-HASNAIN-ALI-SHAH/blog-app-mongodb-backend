const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 255 },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
