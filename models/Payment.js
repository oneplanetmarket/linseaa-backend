import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    method: {
      type: String,
      enum: ["upi", "paypal", "bank"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
