import mongoose from "mongoose";

const blogCommentSchema = new mongoose.Schema({
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const BlogComment = mongoose.model('BlogComment', blogCommentSchema);

export default BlogComment;