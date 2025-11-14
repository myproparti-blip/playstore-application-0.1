import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    role: {
      type: [String],
      enum: ["buyer", "seller", "owner", "investor", "agent", "consultant", "admin"],
      required: true,
    },
    refreshToken: { type: String },
    tokenVersion: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    lastOtpSentAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.statics.isPhoneBlocked = async function (phone) {
  const existing = await this.findOne({ phone });
  return !!existing; 
};

export default mongoose.models.User || mongoose.model("User", userSchema);
