import express from "express";
import authUser from "../middlewares/authUser.js";

import {
  register,
  login,
  googleCallback,
  forgotPassword,
  resetPassword,
  isAuth,
  logout,
  getLinkedInStatus,
  submitLinkedIn,
} from "../controllers/userController.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/register", register);
router.post("/login", login);
router.get("/google-callback", googleCallback);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/* ================= SESSION ================= */
router.get("/is-auth", authUser, isAuth);
router.post("/logout", authUser, logout);

/* ================= LINKEDIN ================= */
// 🔥 REQUIRED for /dashboard/linkedin
router.get("/linkedin-status", authUser, getLinkedInStatus);
router.post("/submit-linkedin", authUser, submitLinkedIn);

export default router;