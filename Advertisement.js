import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", maxlength: 1000 },
  imageUrl: { type: String, default: "" },
  targetUrl: { type: String, default: "" },
  rewardCoins: { type: Number, default: 0, min: 0 },
  durationSeconds: { type: Number, default: 10, min: 0, max: 3600 },
  active: { type: Boolean, default: true },
  assignedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dailyLimit: { type: Number, default: 1, min: 1, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Advertisement", schema);