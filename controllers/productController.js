import { v2 as cloudinary } from "cloudinary"
import Product from "../models/Product.js"

// Add Product : /api/product/add
export const addProduct = async (req, res)=>{
    try {
        let productData = JSON.parse(req.body.productData)

        const images = req.files

        let imagesUrl = await Promise.all(
            images.map(async (item)=>{
                let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
                return result.secure_url
            })
        )

        // Handle producer assignment
        const productWithImages = {
            ...productData, 
            image: imagesUrl,
            producerId: productData.producerId || null,
            addedBy: productData.producerId ? 'admin' : 'admin' // Admin can assign to producer
        }

        await Product.create(productWithImages)

        res.json({success: true, message: "Product Added"})

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get Product : /api/product/list
export const productList = async (req, res)=>{
    try {
        const products = await Product.find({}).populate('producerId', 'name profileImageUrl')
        res.json({success: true, products})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get single Product : /api/product/id
export const productById = async (req, res)=>{
    try {
        const { id } = req.body
        const product = await Product.findById(id).populate('producerId', 'name profileImageUrl')
        
        res.json({success: true, product})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Update Product Stock : /api/product/change-stock
export const changeStock = async (req, res)=>{
    try {
        const { id, inStock } = req.body;
        
        if(!id || inStock === undefined) {
            return res.json({success: false, message: 'Missing required fields'});
        }
        
        await Product.findByIdAndUpdate(id, { inStock });
        res.json({success: true, message: 'Stock updated successfully'});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Update Stock Quantity : /api/product/update-stock
export const updateStockQuantity = async (req, res) => {
    try {
        const { id, stock } = req.body;
        
        if (!id || stock === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        
        if (stock < 0) {
            return res.json({ success: false, message: 'Stock quantity cannot be negative' });
        }
        
        await Product.findByIdAndUpdate(id, { stock });
        res.json({ success: true, message: 'Stock quantity updated successfully' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Delete Product : /api/product/delete/:id
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.json({ success: false, message: 'Product ID is required' });
        }
        
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}