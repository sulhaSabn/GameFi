import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  asset: { type: String, required: true, uppercase: true },
  amount: { type: Number, required: true, min: 0 },
  address: { type: String, required: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "sent"], default: "pending" },
  txid: { type: String, default: "" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Withdrawal", schema);