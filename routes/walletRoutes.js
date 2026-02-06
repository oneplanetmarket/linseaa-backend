import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  getMyWallet,
  addMoneyBySeller,
  requestWithdrawal,
} from "../controllers/walletController.js";

const router = express.Router();

/* USER */
router.get("/me", authUser, getMyWallet);
router.post("/withdraw", authUser, requestWithdrawal);

/* SELLER */
router.post("/add", authUser, addMoneyBySeller);

export default router;