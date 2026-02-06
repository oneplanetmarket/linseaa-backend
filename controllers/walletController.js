import User from "../models/User.js";
import crypto from "crypto";

/* ================= GET USER WALLET ================= */
export const getMyWallet = async (req, res) => {
  try {
    res.json({
      success: true,
      balance: req.user.walletBalance || 0,
      transactions: req.user.transactions || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= SELLER ADD MONEY ================= */
export const addMoneyBySeller = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only seller/admin can add money",
      });
    }

    const { userId, amount, remark } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and valid amount are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* CREDIT WALLET */
    user.walletBalance += Number(amount);

    /* TRANSACTION */
    user.transactions.push({
      transactionId: crypto.randomUUID(),
      type: "credit",
      amount: Number(amount),
      remark: remark || "Added by seller",
      source: "admin",
      status: "success",
    });

    await user.save();

    res.json({
      success: true,
      message: "Wallet updated",
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= USER WITHDRAW MONEY ================= */
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    /* VALIDATIONS */
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹100",
      });
    }

    if (!user.paymentMethod || !user.paymentIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Payment method or identifier not set",
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    /* DEDUCT WALLET */
    user.walletBalance -= Number(amount);

    /* ADD WITHDRAWAL REQUEST (🔥 THIS IS THE KEY FIX) */
    user.withdrawals.push({
      amount: Number(amount),
      paymentMethod: user.paymentMethod,
      paymentIdentifier: user.paymentIdentifier,
      status: "pending",
    });

    /* ADD TRANSACTION (HISTORY) */
    user.transactions.push({
      transactionId: crypto.randomUUID(),
      type: "debit",
      amount: Number(amount),
      remark: "Withdrawal requested",
      source: "user",
      status: "success",
    });

    await user.save();

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};