import Product from "../models/Product.js";

/* ================= ADD PRODUCT ================= */
export const addProduct = async (req, res) => {
  try {
    const images = req.files?.map((file) => file.path) || [];

    const product = await Product.create({
      ...req.body,
      images,
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= LIST PRODUCTS (🔥 IMPORTANT) ================= */
export const productList = async (req, res) => {
  try {
    const products = await Product.find();

    // 🔥 THIS FORMAT IS REQUIRED
    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("productList error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= PRODUCT BY ID ================= */
export const productById = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CHANGE STOCK ================= */
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;

    await Product.findByIdAndUpdate(id, { inStock });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE STOCK ================= */
export const updateStockQuantity = async (req, res) => {
  try {
    const { id, stock } = req.body;

    await Product.findByIdAndUpdate(id, { stock });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};