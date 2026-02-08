import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,

    walletBalance: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: String,

    linkedinStatus: {
      type: String,
      default: "not_submitted",
    },

    transactions: [
      {
        transactionId: String,
        type: String,
        amount: Number,
        remark: String,
        source: String,
        status: String,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;