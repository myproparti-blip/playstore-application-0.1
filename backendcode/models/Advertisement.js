import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video", "multiple"],
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    pageKey: {
      type: String,
      default: "default",
      index: true, // ✅ optional, helps filter faster
    },
    files: [
      {
        url: String,
        public_id: String,
        type: {
          type: String,
          enum: ["image", "video"],
        },
      },
    ],
  },
  { timestamps: true }
);

const Advertisement = mongoose.model("Advertisement", advertisementSchema);
export default Advertisement;