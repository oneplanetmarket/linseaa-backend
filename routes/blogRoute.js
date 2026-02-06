import express from 'express';
import {
    createBlog,
    getApprovedBlogs,
    getBlogById,
    addComment,
    getProducerBlogs,
    updateBlog,
    deleteBlog,
    getAllBlogsForAdmin,
    approveBlog,
    rejectBlog,
    deleteBlogAdmin
} from '../controllers/blogController.js';
import authProducer from '../middlewares/authProducer.js';
import authSeller from '../middlewares/authSeller.js';

const blogRouter = express.Router();

// Public routes
blogRouter.get('/approved', getApprovedBlogs);
blogRouter.get('/:id', getBlogById);
blogRouter.post('/comment', addComment);

// Producer routes
blogRouter.post('/create', authProducer, createBlog);
blogRouter.get('/producer/my-blogs', authProducer, getProducerBlogs);
blogRouter.put('/producer/:id', authProducer, updateBlog);
blogRouter.delete('/producer/:id', authProducer, deleteBlog);

// Admin routes
blogRouter.get('/admin/all', authSeller, getAllBlogsForAdmin);
blogRouter.put('/admin/approve/:id', authSeller, approveBlog);
blogRouter.put('/admin/reject/:id', authSeller, rejectBlog);
blogRouter.delete('/admin/:id', authSeller, deleteBlogAdmin);

export default blogRouter;