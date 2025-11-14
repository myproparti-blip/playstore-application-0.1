// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

// ===== Import Routes =====
import authRoutes from "./routes/authRoutes.js";
import consultantRoutes from "./routes/consultantRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import advertisementRoutes from "./routes/advertisementRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

const app = express();

// ===== File & Directory Setup =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Connect Database =====
await connectDB();

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/locations", locationRoutes);

// ✅ ADD THIS ROOT ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend API Server is Running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      consultants: "/api/consultants", 
      properties: "/api/properties",
      payments: "/api/payments",
      agents: "/api/agents",
      advertisements: "/api/advertisements",
      locations: "/api/locations"
    },
    documentation: "Check API docs for available endpoints"
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Backend API running successfully ✅",
    serverTime: new Date(),
  });
});

// ===== Error Handler =====
app.use(errorHandler);
// 🚫 REMOVE app.listen()
// Instead export app for Vercel Serverless
export default app;
