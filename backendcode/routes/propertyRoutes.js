import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  approveProperty,
  rejectProperty,
  getUserProperties
} from "../controllers/propertylisController.js";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);
const uploadFields = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
]);

router.post("/",  uploadFields, createProperty);
router.get("/", getAllProperties);
router.get("/my-properties", getUserProperties);
router.get("/:id",getPropertyById);
router.put("/:id",uploadFields, updateProperty);
router.delete("/:id", deleteProperty);
router.put("/:id/approve",approveProperty);
router.put("/:id/reject", rejectProperty);
export default router;
