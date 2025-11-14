import express from "express";
import {
  sendOtp,
  verifyOtp,
  profile,
  deleteAccount,
  refreshToken,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/profile", protect, profile);
router.delete("/delete/:id", protect, deleteAccount);
router.post("/refresh",refreshToken );

export default router;
