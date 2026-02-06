import Producer from '../models/Producer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Producer login
export const producerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const producer = await Producer.findOne({ email });
        if (!producer) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        
        const isMatch = await bcrypt.compare(password, producer.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        
        if (!producer.isActive) {
            return res.json({ success: false, message: "Account is deactivated" });
        }
        
        const token = jwt.sign({ id: producer._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('producerToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, message: "Login successful" });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Producer logout
export const producerLogout = async (req, res) => {
    try {
        res.clearCookie('producerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        res.json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get producer profile
export const getProducerProfile = async (req, res) => {
    try {
        const { producerId } = req.body;
        const producer = await Producer.findById(producerId).select('-password');
        
        if (!producer) {
            return res.json({ success: false, message: "Producer not found" });
        }
        
        res.json({ success: true, producer });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Create producer account (admin only)
export const createProducerAccount = async (req, res) => {
    try {
        const { name, email, password, address, profileImageUrl } = req.body;
        
        // Check if producer already exists
        const existingProducer = await Producer.findOne({ email });
        if (existingProducer) {
            return res.json({ success: false, message: "Producer with this email already exists" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create producer
        const producer = new Producer({
            name,
            email,
            password: hashedPassword,
            address,
            profileImageUrl: profileImageUrl || '',
            isActive: true
        });
        
        await producer.save();
        
        const responseProducer = await Producer.findById(producer._id).select('-password');
        
        res.json({ 
            success: true, 
            message: "Producer account created successfully",
            producer: responseProducer 
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all producers (admin only)
export const getAllProducers = async (req, res) => {
    try {
        const producers = await Producer.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, producers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update producer account (admin only)
export const updateProducerAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, address, profileImageUrl, isActive } = req.body;
        
        const producer = await Producer.findByIdAndUpdate(
            id,
            { name, email, address, profileImageUrl, isActive },
            { new: true }
        ).select('-password');
        
        if (!producer) {
            return res.json({ success: false, message: "Producer not found" });
        }
        
        res.json({ success: true, message: "Producer updated successfully", producer });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete producer account (admin only)
export const deleteProducerAccount = async (req, res) => {
    try {
        const { id } = req.params;
        
        const producer = await Producer.findByIdAndDelete(id);
        
        if (!producer) {
            return res.json({ success: false, message: "Producer not found" });
        }
        
        res.json({ success: true, message: "Producer deleted successfully" });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get producer's own products
export const getMyProducts = async (req, res) => {
    try {
        const producerId = req.producerId; // From auth middleware
        
        const products = await Product.find({ producerId }).sort({ createdAt: -1 });
        
        res.json({ success: true, products });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update stock quantity for producer's product
export const updateProductStock = async (req, res) => {
    try {
        const { id, stock } = req.body;
        const producerId = req.producerId;
        
        if (!id || stock === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        
        if (stock < 0) {
            return res.json({ success: false, message: 'Stock quantity cannot be negative' });
        }
        
        // Ensure the product belongs to this producer
        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found or not authorized' });
        }
        
        await Product.findByIdAndUpdate(id, { stock });
        res.json({ success: true, message: 'Stock quantity updated successfully' });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update offer price for producer's product
export const updateProductOffer = async (req, res) => {
    try {
        const { id, offerPrice } = req.body;
        const producerId = req.producerId;
        
        if (!id || offerPrice === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        
        if (offerPrice < 0) {
            return res.json({ success: false, message: 'Offer price cannot be negative' });
        }
        
        // Ensure the product belongs to this producer
        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found or not authorized' });
        }
        
        await Product.findByIdAndUpdate(id, { offerPrice });
        res.json({ success: true, message: 'Offer price updated successfully' });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete producer's product
export const deleteProducerProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const producerId = req.producerId;
        
        if (!id) {
            return res.json({ success: false, message: 'Product ID is required' });
        }
        
        // Ensure the product belongs to this producer
        const product = await Product.findOne({ _id: id, producerId });
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found or not authorized' });
        }
        
        await Product.findByIdAndDelete(id);
        res.json({ success: true, message: 'Product deleted successfully' });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

