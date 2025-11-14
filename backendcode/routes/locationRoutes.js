import express from "express";
import { getCurrentLocation, getLocationSuggestions } from "../controllers/locationControllers.js";

const router = express.Router();

// GET /api/locations/suggest?query=del
router.get("/suggest", getLocationSuggestions);
router.get("/current", getCurrentLocation);
export default router;
