import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { google } from "googleapis";
import googleAuth from "../configs/googleAuth.js";

import {
  userStorage,
} from "../storage/storage.js";

import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

/* ================= HELPERS ================= */

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ================= REGISTER ================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing details" });
    }

    const exists = await userStorage.findByEmail(email);
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userStorage.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      walletBalance: 0,
      linkedinStatus: "pending",
      createdAt: new Date(),
    });

    res.cookie("token", signToken(user.id), cookieOptions);

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
      return res.json({ success: false, message: "Email & password required" });
    }

    const user = await userStorage.findByEmail(email);
    if (!user || !user.password) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.cookie("token", signToken(user.id), cookieOptions);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    let user = await userStorage.findByEmail(data.email);

    if (!user) {
      user = await userStorage.create({
        name: data.name,
        email: data.email,
        authProvider: "google",
        profilePicture: data.picture,
        walletBalance: 0,
        linkedinStatus: "pending",
        createdAt: new Date(),
      });
    }

    res.cookie("token", signToken(user.id), cookieOptions);

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
  const { email } = req.body;

  const user = await userStorage.findByEmail(email);
  if (!user) return res.json({ success: false });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  await userStorage.update(user.id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
  });

  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  res.json({ success: true });
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await userStorage.findByResetToken(hashedToken);
  if (!user) return res.json({ success: false });

  const hashedPassword = await bcrypt.hash(password, 10);

  await userStorage.update(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  res.json({ success: true });
};

/* ================= IS AUTH ================= */

export const isAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/* ================= LINKEDIN ================= */

export const getLinkedInStatus = async (req, res) => {
  res.json({
    success: true,
    linkedinStatus: req.user.linkedinStatus,
    rejectionReason: req.user.rejectionReason || "",
    earningRate: req.user.earningRate || 0,
  });
};

export const submitLinkedIn = async (req, res) => {
  const { email, password, googleCode } = req.body;

  if (!email || !password || !googleCode) {
    return res.json({ success: false, message: "All fields required" });
  }

  await userStorage.update(req.user.id, {
    linkedinCredentials: { email, password, googleCode },
    linkedinStatus: "submitted",
    rejectionReason: "",
  });

  res.json({ success: true });
};

/* ================= LOGOUT ================= */

export const logout = async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true });
};