import mongoose from "mongoose";
const locationSchema = new mongoose.Schema({
  name: String,
  country: String,
  region: String,
  latitude: Number,
  longitude: Number,
});
export default mongoose.model("Location", locationSchema);
