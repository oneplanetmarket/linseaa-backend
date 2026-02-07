import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";

/* ROUTES */
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
import walletRoutes from "./routes/walletRoutes.js";

import { stripeWebhooks } from "./controllers/orderController.js";

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= APP ================= */
const app = express();

/* ================= DB (SERVERLESS SAFE) ================= */
let isConnected = false;

async function connectOnce() {
  if (!isConnected) {
    await connectDB();
    await connectCloudinary();
    isConnected = true;
    console.log("✅ MongoDB & Cloudinary connected");
  }
}

/* ================= STRIPE WEBHOOK ================= */
/* ❗ MUST be before express.json */
app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

/* ================= MIDDLEWARE ================= */
app.use(async (req, res, next) => {
  await connectOnce();
  next();
});

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
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API working 🚀" });
});

/* ================= FRONTEND (PRODUCTION) ================= */
const clientPath = path.join(__dirname, "../client/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

/* ================= SERVERLESS EXPORT ================= */
/* ❌ DO NOT USE app.listen() */
export default app;