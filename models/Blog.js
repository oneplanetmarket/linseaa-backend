import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: "" },
    producer: { type: mongoose.Schema.Types.ObjectId, ref: 'Producer', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;