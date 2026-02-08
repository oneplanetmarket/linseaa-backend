import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./configs/db.js";

/* ================= ROUTES ================= */
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import adminRoutes from "./routes/admin.js";
import walletRoutes from "./routes/walletRoutes.js";
import productRouter from "./routes/productRoute.js";   // ✅ ADDED
import cartRouter from "./routes/cartRoute.js";         // ✅ ADDED

import { stripeWebhooks } from "./controllers/orderController.js";

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= APP ================= */
const app = express();

/* ================= DB ================= */
connectDB();

/* ================= STRIPE WEBHOOK ================= */
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

/* ================= ROUTES ================= */
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);

// 🔥 THESE TWO FIX YOUR ERRORS
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);

/* ================= HEALTH ================= */
app.get("/api/health", (_, res) => {
  res.json({ success: true, message: "API working 🚀" });
});

/* ================= FRONTEND ================= */
const clientPath = path.join(__dirname, "../client/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientPath));
  app.get("*", (_, res) =>
    res.sendFile(path.join(clientPath, "index.html"))
  );
}

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/* Export for Vercel */
export default app;