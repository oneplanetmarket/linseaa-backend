import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./storage.js";

/* ROUTES */
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import adminRoutes from "./routes/admin.js";
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
    isConnected = true;
  }
}

/* ================= STRIPE WEBHOOK ================= */
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

/* ================= ROUTES ================= */
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);

/* ================= HEALTH ================= */
app.get("/api/health", (_, res) =>
  res.json({ success: true, message: "API working 🚀" })
);

/* ================= FRONTEND ================= */
const clientPath = path.join(__dirname, "../client/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientPath));
  app.get("*", (_, res) =>
    res.sendFile(path.join(clientPath, "index.html"))
  );
}

/* ❌ DO NOT app.listen() ON VERCEL */
export default app;