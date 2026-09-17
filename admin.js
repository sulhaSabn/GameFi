import bcrypt from "bcryptjs";
import User from "./User.js";
import Wallet from "./Wallet.js";
import Transaction from "./Transaction.js";
import Withdrawal from "./Withdrawal.js";
import Advertisement from "./Advertisement.js";
import CoinTransaction from "./CoinTransaction.js";
import Setting from "./Setting.js";
import { addCoins } from "./coins.js";

export async function dashboard(req, res) {
  const [users, ads, pendingWithdrawals, coins] = await Promise.all([
    User.countDocuments(), Advertisement.countDocuments({ active: true }),
    Withdrawal.countDocuments({ status: "pending" }),
    CoinTransaction.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
  ]);
  res.json({ users, activeAds: ads, pendingWithdrawals, netCoinTransactions: coins[0]?.total ?? 0 });
}

export async function users(req, res) {
  const q = String(req.query.search || "").trim();
  const filter = q ? { $or: [{ email: new RegExp(q, "i") }, { name: new RegExp(q, "i") }] } : {};
  const rows = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(200);
  res.json({ users: rows });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "کاربر پیدا نشد." });
  if (typeof req.body.isActive === "boolean") user.isActive = req.body.isActive;
  if (["user","admin"].includes(req.body.role)) user.role = req.body.role;
  await user.save();
  res.json({ user });
}

export async function rewardUser(req, res) {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return res.status(400).json({ error: "مقدار پاداش نامعتبر است." });
  const balance = await addCoins(req.params.id, Math.floor(amount), "ADMIN_REWARD", String(req.body.note || "پاداش توسط Admin"));
  res.json({ coins: balance });
}

export async function listAllAds(req, res) {
  res.json({ ads: await Advertisement.find().sort({ createdAt: -1 }).limit(200) });
}

export async function createAd(req, res) {
  const { title, description, imageUrl, targetUrl, rewardCoins, durationSeconds, dailyLimit, assignedUserIds } = req.body;
  const ad = await Advertisement.create({
    title, description, imageUrl, targetUrl,
    rewardCoins: Number(rewardCoins || 0),
    durationSeconds: Number(durationSeconds || 10),
    dailyLimit: Number(dailyLimit || 1),
    assignedUserIds: Array.isArray(assignedUserIds) ? assignedUserIds : []
  });
  res.status(201).json({ ad });
}

export async function updateAd(req, res) {
  const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ad) return res.status(404).json({ error: "تبلیغ پیدا نشد." });
  res.json({ ad });
}

export async function withdrawals(req, res) {
  res.json({ withdrawals: await Withdrawal.find().populate("user","name email").sort({ createdAt: -1 }).limit(200) });
}

export async function reviewWithdrawal(req, res) {
  const row = await Withdrawal.findById(req.params.id);
  if (!row) return res.status(404).json({ error: "درخواست پیدا نشد." });
  if (!["approved","rejected","sent"].includes(req.body.status)) return res.status(400).json({ error: "وضعیت نامعتبر است." });
  row.status = req.body.status;
  row.txid = String(req.body.txid || row.txid || "");
  row.note = String(req.body.note || "");
  await row.save();
  res.json({ withdrawal: row });
}

export async function settings(req, res) {
  const rows = await Setting.find();
  res.json({ settings: rows });
}

export async function updateSetting(req, res) {
  const key = String(req.params.key);
  const value = req.body.value;
  const row = await Setting.findOneAndUpdate({ key }, { value, updatedAt: new Date() }, { upsert: true, new: true });
  res.json({ setting: row });
}

export async function bootstrapAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) return;
  const u = await User.create({
    name: process.env.ADMIN_NAME || "Administrator",
    email, role: "admin", emailVerified: true,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
  });
  await Wallet.create({ user: u._id });
  console.log("Bootstrap admin created:", email);
}