import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  balance: { type: Number, default: 0, min: 0 },
  depositAddress: { type: String, default: "" }
}, { _id: false });

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  assets: { type: [assetSchema], default: () => [
    { symbol: "USDT", balance: 0 },
    { symbol: "BTC", balance: 0 },
    { symbol: "ETH", balance: 0 }
  ]}
});

export default mongoose.model("Wallet", schema);