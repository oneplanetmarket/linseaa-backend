import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import authProducer from '../middlewares/authProducer.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add product by producer
router.post('/add-product', authProducer, upload.array('images', 4), async (req, res) => {
    try {
        const { name, description, price, offerPrice, category, stock } = req.body;
        const { producerId } = req.body;

        if (!name || !description || !price || !category || !stock) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, message: "At least one image is required" });
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        for (const file of req.files) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'image', folder: 'products' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(file.buffer);
            });
            imageUrls.push(result.secure_url);
        }

        // Create product
        const productData = {
            name,
            description: [description],
            price: Number(price),
            offerPrice: Number(offerPrice) || Number(price),
            image: imageUrls,
            category,
            inStock: Number(stock) > 0,
            stock: Number(stock),
            producerId,
            addedBy: 'producer'
        };

        const product = new Product(productData);
        await product.save();

        res.json({ 
            success: true, 
            message: "Product added successfully",
            product 
        });

    } catch (error) {
        console.error('Error adding product:', error);
        res.json({ success: false, message: error.message });
    }
});

// Get producer's products
router.get('/my-products', authProducer, async (req, res) => {
    try {
        const { producerId } = req.body;
        
        const products = await Product.find({ producerId }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            products: products.map(product => ({
                ...product.toObject(),
                images: product.image // Map image field to images for frontend compatibility
            }))
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.json({ success: false, message: error.message });
    }
});

// Delete producer's product
router.delete('/delete-product/:id', authProducer, async (req, res) => {
    try {
        const { id } = req.params;
        const { producerId } = req.body;

        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: "Product not found or not authorized" });
        }

        await Product.findByIdAndDelete(id);
        
        res.json({ success: true, message: "Product deleted successfully" });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.json({ success: false, message: error.message });
    }
});

// Update stock quantity
router.post('/update-stock', authProducer, async (req, res) => {
    try {
        const { id, stock } = req.body;
        const { producerId } = req.body;
        
        if (!id || stock === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        
        if (stock < 0) {
            return res.json({ success: false, message: 'Stock quantity cannot be negative' });
        }
        
        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found or not authorized' });
        }
        
        await Product.findByIdAndUpdate(id, { stock, inStock: stock > 0 });
        res.json({ success: true, message: 'Stock quantity updated successfully' });
        
    } catch (error) {
        console.error('Error updating stock:', error);
        res.json({ success: false, message: error.message });
    }
});

// Update offer price
router.post('/update-offer', authProducer, async (req, res) => {
    try {
        const { id, offerPrice } = req.body;
        const { producerId } = req.body;
        
        if (!id || offerPrice === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        
        if (offerPrice < 0) {
            return res.json({ success: false, message: 'Offer price cannot be negative' });
        }
        
        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found or not authorized' });
        }
        
        await Product.findByIdAndUpdate(id, { offerPrice });
        res.json({ success: true, message: 'Offer price updated successfully' });
        
    } catch (error) {
        console.error('Error updating offer price:', error);
        res.json({ success: false, message: error.message });
    }
});

export default router;