import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import "dotenv/config";

import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import adminRoutes from "./routes/admin.js";

import producerRouter from "./routes/producerRoute.js";
import producerAuthRouter from "./routes/producerAuthRoute.js";
import producerProductRouter from "./routes/producerProductRoute.js";

import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import newsletterRouter from "./routes/newsletterRoute.js";
import ecoJourneyRouter from "./routes/ecoJourneyRoute.js";
import blogRouter from "./routes/blogRoute.js";

/* 🔥 WALLET ROUTES */
import walletRoutes from "./routes/walletRoutes.js";

import connectCloudinary from "./configs/cloudinary.js";
import { stripeWebhooks } from "./controllers/orderController.js";

import path from "path";
import { fileURLToPath } from "url";

/* ================= PATH SETUP ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= APP ================= */
const app = express();
const PORT = process.env.PORT || 4000;

/* ================= DATABASE ================= */
await connectDB();
await connectCloudinary();

/* ================= STRIPE WEBHOOK ================= */
/* ❗ Must be BEFORE express.json */
app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ================= API ROUTES ================= */
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminRoutes);

/* 🔥 WALLET */
app.use("/api/wallet", walletRoutes);

app.use("/api/producer", producerRouter);
app.use("/api/producer-auth", producerAuthRouter);
app.use("/api/producer", producerProductRouter);

app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/eco-journey", ecoJourneyRouter);
app.use("/api/blog", blogRouter);

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "API working" })
);

/* ================= FRONTEND (PRODUCTION) ================= */
const clientPath = path.join(__dirname, "../client/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

/* ================= START SERVER ================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});