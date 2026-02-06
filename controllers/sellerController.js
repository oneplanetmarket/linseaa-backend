import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Producer from "../models/Producer.js";

/* ================= SELLER LOGIN ================= */
/* POST /api/seller/login */
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.SELLER_EMAIL &&
      password === process.env.SELLER_PASSWORD
    ) {
      const token = jwt.sign(
        { role: "seller", email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("sellerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ success: true, message: "Seller logged in" });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid seller credentials",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= SELLER AUTH CHECK ================= */
/* GET /api/seller/is-auth */
export const isSellerAuth = async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* ================= SELLER LOGOUT ================= */
/* POST /api/seller/logout */
export const sellerLogout = async (req, res) => {
  try {
    res.clearCookie("sellerToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.json({ success: true, message: "Seller logged out" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* ================= GET ALL PRODUCERS ================= */
/* GET /api/seller/producers */
export const getAllProducers = async (req, res) => {
  try {
    const producers = await Producer.find({ isActive: true }).select(
      "name profileImageUrl email"
    );

    res.json({ success: true, producers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* ================= GET ALL WITHDRAWAL REQUESTS ================= */
/* GET /api/seller/withdrawals */
export const getWithdrawalRequests = async (req, res) => {
  try {
    const users = await User.find(
      { "withdrawals.0": { $exists: true } },
      "name email withdrawals"
    );

    const requests = users.flatMap((user) =>
      user.withdrawals.map((w) => ({
        userId: user._id,
        withdrawalId: w._id,
        name: user.name,
        email: user.email,
        amount: w.amount,
        paymentMethod: w.paymentMethod,
        paymentIdentifier: w.paymentIdentifier,
        status: w.status,
        requestedAt: w.createdAt,
      }))
    );

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= APPROVE / REJECT WITHDRAWAL ================= */
/* POST /api/seller/withdrawals/update */
export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { userId, withdrawalId, status, remark } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    withdrawal.status = status;
    withdrawal.remark = remark || "";

    /* REFUND IF REJECTED */
    if (status === "rejected") {
      user.walletBalance += withdrawal.amount;

      user.transactions.push({
        transactionId: `refund-${withdrawal._id}`,
        type: "credit",
        amount: withdrawal.amount,
        remark: "Withdrawal rejected – refunded",
        source: "admin",
        status: "success",
      });
    }

    await user.save();

    res.json({ success: true, message: `Withdrawal ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE TASK (SELLER → USERS) ================= */
/* POST /api/seller/tasks/create */
export const createTask = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const users = await User.find({ role: "user", status: "approved" });

    for (const user of users) {
      user.tasks = user.tasks || [];
      user.tasks.push({
        title,
        description,
        deadline,
        status: "pending",
      });
      await user.save();
    }

    res.json({
      success: true,
      message: "Task assigned to users",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};