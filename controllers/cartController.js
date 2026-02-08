import User from "../models/User.js";

export const updateCart = async (req, res) => {
  const { cartItems } = req.body;
  await User.findByIdAndUpdate(req.user._id, { cartItems });
  res.json({ success: true, message: "Cart updated" });
};