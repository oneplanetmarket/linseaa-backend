import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { google } from "googleapis";
import googleAuth from "../configs/googleAuth.js";
import User from "../models/User.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

/* ================= HELPERS ================= */

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* 🔥 DEV-SAFE COOKIE OPTIONS (localhost) */
const cookieOptions = {
  httpOnly: true,
  secure: false,     // ❌ https not required on localhost
  sameSite: "lax",   // ✅ works with Vite + Express
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ================= REGISTER ================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing details" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      walletBalance: 0,
      linkedinStatus: "pending",
    });

    res.cookie("token", signToken(user._id), cookieOptions);

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email & password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.cookie("token", signToken(user._id), cookieOptions);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

/* ================= GOOGLE CALLBACK ================= */

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await googleAuth.getToken(code);
    googleAuth.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: googleAuth });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        profilePicture: data.picture,
        walletBalance: 0,
        linkedinStatus: "pending",
      });
    }

    res.cookie("token", signToken(user._id), cookieOptions);

    res.send(`
      <script>
        window.opener.postMessage({ success: true }, "*");
        window.close();
      </script>
    `);
  } catch {
    res.send(`
      <script>
        window.opener.postMessage({ success: false }, "*");
        window.close();
      </script>
    `);
  }
};

/* ================= FORGOT PASSWORD ================= */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

/* ================= AUTH CHECK ================= */

export const isAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/* ================= LINKEDIN ================= */

export const getLinkedInStatus = async (req, res) => {
  res.json({
    success: true,
    linkedinStatus: req.user.linkedinStatus,
    rejectionReason: req.user.rejectionReason || "",
  });
};

export const submitLinkedIn = async (req, res) => {
  try {
    const { email, password, googleCode } = req.body;

    if (!email || !password || !googleCode) {
      return res.json({ success: false, message: "All fields required" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      linkedinCredentials: { email, password, googleCode },
      linkedinStatus: "submitted",
      rejectionReason: "",
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

/* ================= LOGOUT ================= */

export const logout = async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true });
};