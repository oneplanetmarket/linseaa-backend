import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifySeller = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
