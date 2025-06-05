const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Like = mongoose.model('Like', likeSchema);
module.exports = Like;
