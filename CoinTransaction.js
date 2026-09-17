import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["GAME_REWARD", "AD_REWARD", "DAILY_BONUS", "ADMIN_REWARD", "COIN_PURCHASE", "COIN_SPENT", "CONVERSION"],
    required: true
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  sourceId: { type: String, default: "" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CoinTransaction", schema);