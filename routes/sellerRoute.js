import express from "express";
import User from "../models/User.js";
import authSeller from "../middlewares/authSeller.js";
import crypto from "crypto";

import {
  sellerLogin,
  sellerLogout,
  isSellerAuth,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  createTask,
} from "../controllers/sellerController.js";

const sellerRouter = express.Router();

/* ================= AUTH ================= */

sellerRouter.post("/login", sellerLogin);
sellerRouter.get("/is-auth", authSeller, isSellerAuth);
sellerRouter.get("/logout", sellerLogout);

/* ================= PROFILE VERIFICATION ================= */

sellerRouter.get("/user-verifications", authSeller, async (req, res) => {
  const users = await User.find({ status: "pending" });
  res.json({ success: true, users });
});

sellerRouter.get("/approved-users", authSeller, async (req, res) => {
  const users = await User.find({ status: "approved" });
  res.json({ success: true, users });
});

sellerRouter.get("/rejected-users", authSeller, async (req, res) => {
  const users = await User.find({ status: "rejected" });
  res.json({ success: true, users });
});

sellerRouter.post("/approve-user/:id", authSeller, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    status: "approved",
    rejectionReason: null,
  });
  res.json({ success: true });
});

sellerRouter.post("/reject-user/:id", authSeller, async (req, res) => {
  const { reason } = req.body;
  await User.findByIdAndUpdate(req.params.id, {
    status: "rejected",
    rejectionReason: reason || "Not specified",
  });
  res.json({ success: true });
});

/* ================= LINKEDIN ================= */

sellerRouter.get("/linkedin-submissions", authSeller, async (req, res) => {
  const users = await User.find({
    linkedinStatus: { $ne: "not_submitted" },
  });
  res.json({ success: true, users });
});

/* ================= PAYMENTS (IMPORTANT) ================= */

/** GET USERS */
sellerRouter.get("/payments", authSeller, async (req, res) => {
  const users = await User.find().select(
    "name email walletBalance status"
  );
  res.json({ success: true, users });
});

/** TRANSACTION HISTORY */
sellerRouter.get("/payments/:id/history", authSeller, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.json({ success: false, transactions: [] });
  }

  res.json({
    success: true,
    transactions: user.transactions || [],
  });
});

/** 🔥 SEND MONEY (ADMIN ONLY) */
sellerRouter.post(
  "/payments/send/:id",
  authSeller,
  async (req, res) => {
    const { amount, remark } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.walletBalance += Number(amount);

    user.transactions.push({
      transactionId: crypto.randomUUID(),
      type: "credit",
      amount: Number(amount),
      remark: remark || "Admin wallet credit",
      source: "admin",
      status: "success",
      createdAt: new Date(),
    });

    await user.save();

    res.json({ success: true });
  }
);

/* ================= WITHDRAWALS ================= */

sellerRouter.get("/withdrawals", authSeller, getWithdrawalRequests);
sellerRouter.post(
  "/withdrawals/update",
  authSeller,
  updateWithdrawalStatus
);

/* ================= TASKS ================= */

sellerRouter.post("/tasks/create", authSeller, createTask);

export default sellerRouter;