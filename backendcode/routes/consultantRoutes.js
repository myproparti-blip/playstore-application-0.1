import express from "express";
import {
  getConsultants,
  addConsultant,
  updateConsultant,
  getConsultantById,
  approveConsultant,
  rejectConsultant,
} from "../controllers/consultantController.js";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/", getConsultants);
router.get("/:id", getConsultantById);
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  addConsultant
);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  updateConsultant
);
router.put("/:id/approve", approveConsultant);
router.put("/:id/reject", rejectConsultant);
export default router;
