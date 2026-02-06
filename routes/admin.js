import express from "express";
import User from "../models/User.js";
import { verifySeller } from "../middlewares/auth.js";

const router = express.Router();

/* ===== PROFILE VERIFICATIONS ===== */
router.get("/profile-verifications", verifySeller, async (req, res) => {
  const users = await User.find({
    role: "user",
    profileSubmitted: true,
    status: "pending",
  }).sort({ createdAt: -1 });

  res.json({ success: true, users });
});

/* ===== APPROVE USER ===== */
router.post("/approve/:id", verifySeller, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    status: "approved",
  });
  res.json({ success: true });
});

/* ===== REJECT USER ===== */
router.post("/reject/:id", verifySeller, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    status: "rejected",
  });
  res.json({ success: true });
});

export default router;
