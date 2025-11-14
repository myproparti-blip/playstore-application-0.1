import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // ✅ ensure one agent per phone
    },
    isPropertyDealer: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    agentName: { type: String, required: true, trim: true },
    firmName: { type: String, default: "", trim: true },
    operatingCity: { type: String, required: true, trim: true },
    operatingAreaChips: { type: [String], default: [] },
    operatingSince: { type: String, default: "" },
    teamMembers: { type: String, default: "" },
    dealsIn: { type: [String], default: [] },
    dealsInOther: { type: [String], default: [] },
    aboutAgent: { type: String, default: "" },
    image: { type: String, required: true },
    idProof: { type: String, required: true },

    address: { type: String, default: "" },
    location: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    landmark: { type: String, default: "" },
    locality: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    pincode: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: { type: String, default: "" },
  },
  { timestamps: true }
);

agentSchema.index({ user: 1, agentName: 1 }, { unique: true });

export default mongoose.model("Agent", agentSchema);
