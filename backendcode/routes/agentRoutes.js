import express from "express";
import {
  getAgentById,
  addAgent,
  updateAgent,
  approveAgent,
  rejectAgent,
  getAgents,
} from "../controllers/agentController.js";

import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 All routes protected
router.use(protect);

// 🧾 Routes
router.get("/", getAgents);
router.get("/:id", getAgentById);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  addAgent
);

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  updateAgent
);

// ✅ Approval workflow
router.put("/:id/approve", approveAgent);
router.put("/:id/reject", rejectAgent);

export default router;
