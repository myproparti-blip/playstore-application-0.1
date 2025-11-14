import mongoose from "mongoose";

const consultantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    designation: { type: String, required: true },
    experience: { type: Number, required: true },
    money: { type: Number, required: true },
    moneyType: {
      type: String,
      enum: ["minute", "hour", "project"],
      default: "project",
    },
    expertise: { type: String, required: true },
    certifications: { type: String,  default: "" },
    languages: { type: [String], default: [] },
    image: { type: String, required: true },
    idProof: { type: String, required: true },

    // ✅ Basic address fields (for backward compatibility)
    address: { type: String, default: "" },
    location: { type: String, default: "" },

    // ✅ Detailed address fields
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

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Approval workflow fields
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Unique index
consultantSchema.index({ name: 1, phone: 1 }, { unique: true });

export default mongoose.model("Consultant", consultantSchema);
