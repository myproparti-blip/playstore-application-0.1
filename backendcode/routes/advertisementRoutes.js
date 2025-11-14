import express from "express";
import upload from "../middleware/upload.js";
import {
  uploadImage,
  uploadVideo,
  uploadMultiple,
  getAllAdvertisements,
  deleteAdvertisement,
} from "../controllers/advertisementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload/image", protect, upload.single("image"), uploadImage);
router.post("/upload/video", protect, upload.single("video"), uploadVideo);
router.post("/upload/multiple", protect, upload.array("files", 10), uploadMultiple);
router.get("/", getAllAdvertisements);
router.delete("/:id", protect, deleteAdvertisement);
export default router;
