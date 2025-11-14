import mongoose from "mongoose";
import { MESSAGES } from "../utils/messages.js";

let isConnected = false; // Track connection state (important for Vercel)

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "playstoreApp", 
      maxPoolSize: 10,        
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`${MESSAGES.GENERAL.DB_CONNECT_ERROR}: ${error.message}`);
    throw new Error("Database connection failed");
  }
};

export default connectDB;
