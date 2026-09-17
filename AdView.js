import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  advertisement: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  rewarded: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

schema.index({ user: 1, advertisement: 1, createdAt: -1 });

export default mongoose.model("AdView", schema);