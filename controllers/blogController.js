import Blog from '../models/Blog.js';
import BlogComment from '../models/BlogComment.js';
import Producer from '../models/Producer.js';

// Create a new blog post (Producer)
export const createBlog = async (req, res) => {
    try {
        const { title, content, image } = req.body;
        const producerId = req.producer.id;

        const blog = new Blog({
            title,
            content,
            image,
            producer: producerId,
            status: 'pending'
        });

        await blog.save();

        res.json({
            success: true,
            message: "Blog submitted for review",
            blog
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all approved blogs for home page
export const getApprovedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: 'approved' })
            .populate('producer', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blogs
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get single blog by ID with comments
export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findById(id)
            .populate('producer', 'name profileImage')
            .lean();

        if (!blog || blog.status !== 'approved') {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        const comments = await BlogComment.find({ blogId: id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blog: { ...blog, comments }
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Add comment to blog
export const addComment = async (req, res) => {
    try {
        const { blogId, name, message } = req.body;

        const comment = new BlogComment({
            blogId,
            name,
            message
        });

        await comment.save();

        res.json({
            success: true,
            message: "Comment added successfully",
            comment
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get producer's blogs
export const getProducerBlogs = async (req, res) => {
    try {
        const producerId = req.producer.id;

        const blogs = await Blog.find({ producer: producerId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blogs
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update blog (Producer - only pending/rejected)
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image } = req.body;
        const producerId = req.producer.id;

        const blog = await Blog.findOne({ _id: id, producer: producerId });

        if (!blog) {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        if (blog.status === 'approved') {
            return res.json({
                success: false,
                message: "Cannot edit approved blogs"
            });
        }

        blog.title = title;
        blog.content = content;
        blog.image = image;
        blog.status = 'pending';
        blog.updatedAt = new Date();

        await blog.save();

        res.json({
            success: true,
            message: "Blog updated successfully",
            blog
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete blog (Producer - only pending/rejected)
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const producerId = req.producer.id;

        const blog = await Blog.findOne({ _id: id, producer: producerId });

        if (!blog) {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        if (blog.status === 'approved') {
            return res.json({
                success: false,
                message: "Cannot delete approved blogs"
            });
        }

        await Blog.findByIdAndDelete(id);
        await BlogComment.deleteMany({ blogId: id });

        res.json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Admin functions

// Get all blogs for admin review
export const getAllBlogsForAdmin = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const blogs = await Blog.find(query)
            .populate('producer', 'name')
            .sort({ createdAt: -1 });

        let filteredBlogs = blogs;

        if (search) {
            filteredBlogs = blogs.filter(blog => 
                blog.title.toLowerCase().includes(search.toLowerCase()) ||
                blog.producer.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        res.json({
            success: true,
            blogs: filteredBlogs
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Approve blog (Admin)
export const approveBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findByIdAndUpdate(
            id,
            { status: 'approved', updatedAt: new Date() },
            { new: true }
        ).populate('producer', 'name');

        if (!blog) {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        res.json({
            success: true,
            message: "Blog approved successfully",
            blog
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Reject blog (Admin)
export const rejectBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findByIdAndUpdate(
            id,
            { status: 'rejected', updatedAt: new Date() },
            { new: true }
        ).populate('producer', 'name');

        if (!blog) {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        res.json({
            success: true,
            message: "Blog rejected successfully",
            blog
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete blog (Admin)
export const deleteBlogAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findByIdAndDelete(id);

        if (!blog) {
            return res.json({
                success: false,
                message: "Blog not found"
            });
        }

        // Delete associated comments
        await BlogComment.deleteMany({ blogId: id });

        res.json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};