import Product from "../models/Product.js";

export const addProduct = async (req, res) => {
  const images = req.files?.map((f) => f.path) || [];
  const product = await Product.create({ ...req.body, images });
  res.json({ success: true, product });
};

export const productList = async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, products });
};

export const productById = async (req, res) => {
  const product = await Product.findById(req.query.id);
  if (!product)
    return res.json({ success: false, message: "Not found" });
  res.json({ success: true, product });
};

export const changeStock = async (req, res) => {
  await Product.findByIdAndUpdate(req.body.id, {
    inStock: req.body.inStock,
  });
  res.json({ success: true });
};

export const updateStockQuantity = async (req, res) => {
  await Product.findByIdAndUpdate(req.body.id, {
    stock: req.body.stock,
  });
  res.json({ success: true });
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};