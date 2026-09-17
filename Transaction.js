import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "withdrawal"], required: true },
  asset: { type: String, required: true, uppercase: true },
  amount: { type: Number, required: true, min: 0 },
  address: { type: String, default: "" },
  txid: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected", "confirmed"], default: "pending" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", schema);