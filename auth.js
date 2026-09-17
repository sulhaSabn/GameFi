import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "./User.js";
import Wallet from "./Wallet.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.js";

function token(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function safeUser(u) {
  return {
    id: u._id, name: u.name, email: u.email, role: u.role,
    emailVerified: u.emailVerified, isActive: u.isActive, coins: u.coins
  };
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: "نام، ایمیل و رمز حداقل ۸ کاراکتری لازم است." });

  const normalized = String(email).trim().toLowerCase();
  if (await User.findOne({ email: normalized }))
    return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است." });

  const user = await User.create({
    name: String(name).trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 12)
  });
  await Wallet.create({ user: user._id });

  const raw = crypto.randomBytes(32).toString("hex");
  await user.updateOne({ emailVerificationTokenHash: crypto.createHash("sha256").update(raw).digest("hex") }).catch(()=>{});
  await sendVerificationEmail(user, raw);

  res.status(201).json({ message: "ثبت‌نام انجام شد. ایمیل تأیید برای شما ارسال شد." });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ error: "ایمیل یا رمز عبور نادرست است." });
  if (!user.isActive) return res.status(403).json({ error: "حساب شما غیرفعال است." });
  if (!user.emailVerified) return res.status(403).json({ error: "ابتدا ایمیل خود را تأیید کنید." });
  res.json({ token: token(user), user: safeUser(user) });
}

export async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}

export async function verifyEmail(req, res) {
  const hash = crypto.createHash("sha256").update(String(req.query.token || "")).digest("hex");
  const user = await User.findOne({ emailVerificationTokenHash: hash });
  if (!user) return res.status(400).json({ error: "لینک تأیید نامعتبر یا منقضی شده است." });
  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  await user.save();
  res.json({ message: "ایمیل با موفقیت تأیید شد." });
}

export async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    const raw = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save();
    await sendPasswordResetEmail(user, raw);
  }
  res.json({ message: "اگر ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود." });
}

export async function resetPassword(req, res) {
  const hash = crypto.createHash("sha256").update(String(req.body.token || "")).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: Date.now() }
  }).select("+passwordHash");
  if (!user) return res.status(400).json({ error: "توکن نامعتبر یا منقضی شده است." });
  if (!req.body.password || req.body.password.length < 8)
    return res.status(400).json({ error: "رمز جدید باید حداقل ۸ کاراکتر باشد." });
  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ message: "رمز عبور تغییر کرد." });
}

export async function authRequired(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) return res.status(401).json({ error: "نیاز به ورود است." });
    const decoded = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ error: "حساب نامعتبر است." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "توکن نامعتبر یا منقضی شده است." });
  }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "دسترسی Admin لازم است." });
  next();
}