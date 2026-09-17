import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  coins: { type: Number, default: 0, min: 0 },
  lastDailyRewardAt: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", schema);