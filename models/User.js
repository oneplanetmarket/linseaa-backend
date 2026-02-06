import mongoose from "mongoose";

/* ================= TRANSACTION SUB-SCHEMA ================= */
const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: { type: Number, required: true },

    remark: { type: String, default: "" },

    source: {
      type: String,
      enum: ["admin", "system", "user"],
      default: "admin",
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

/* ================= WITHDRAWAL SUB-SCHEMA ================= */
const withdrawalSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String, // UPI / Bank / Paytm / etc
      required: true,
    },

    paymentIdentifier: {
      type: String, // UPI ID / Account No / Wallet ID
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    remark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* ================= USER SCHEMA ================= */
const userSchema = new mongoose.Schema(
  {
    /* ===== BASIC AUTH ===== */
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: String,

    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },

    /* ===== PROFILE VERIFICATION ===== */
    profileSubmitted: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: String,

    /* ===== PROFILE DETAILS ===== */
    contactEmail: String,
    contactMobile: String,
    linkedinUrl: String,
    linkedinYear: String,
    linkedinConnections: String,

    /* ===== PAYMENT DETAILS ===== */
    paymentMethod: String, // UPI / Bank
    paymentIdentifier: String, // UPI ID / Account No

    /* ===== LINKEDIN VERIFICATION ===== */
    linkedinStatus: {
      type: String,
      enum: [
        "not_submitted",
        "submitted",
        "rejected",
        "approved",
        "connected",
        "logged_in",
      ],
      default: "not_submitted",
    },

    linkedinCredentials: {
      email: String,
      password: String,
      googleCode: String,
    },

    /* ===== EARNING ===== */
    earningRate: {
      type: Number,
      default: 0,
    },

    /* ===== WALLET ===== */
    walletBalance: {
      type: Number,
      default: 0,
    },

    transactions: [transactionSchema],

    /* 🔥 NEW: WITHDRAWALS (FOR SELLER PANEL) */
    withdrawals: [withdrawalSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);