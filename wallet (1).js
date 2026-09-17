import Wallet from "./Wallet.js";
import Transaction from "./Transaction.js";
import Withdrawal from "./Withdrawal.js";

const SUPPORTED = ["USDT", "BTC", "ETH"];

export async function getWallet(req, res) {
  const wallet = await Wallet.findOne({ user: req.user._id });
  res.json({ wallet });
}

export async function deposit(req, res) {
  const asset = String(req.body.asset || "").toUpperCase();
  const amount = Number(req.body.amount);
  const txid = String(req.body.txid || "").trim();
  if (!SUPPORTED.includes(asset) || !Number.isFinite(amount) || amount <= 0 || !txid)
    return res.status(400).json({ error: "اطلاعات واریز نامعتبر است." });

  // IMPORTANT: this endpoint does not trust a client claim of payment.
  // A production deployment must verify txid on the relevant blockchain before crediting balance.
  const exists = await Transaction.findOne({ txid });
  if (exists) return res.status(409).json({ error: "این TXID قبلاً ثبت شده است." });
  const row = await Transaction.create({ user: req.user._id, type: "deposit", asset, amount, txid, status: "pending", note: "نیازمند تأیید بلاکچین" });
  res.status(201).json({ transaction: row, message: "درخواست واریز ثبت شد و پس از تأیید بلاکچین اعتبار می‌گیرد." });
}

export async function requestWithdrawal(req, res) {
  const asset = String(req.body.asset || "").toUpperCase();
  const amount = Number(req.body.amount);
  const address = String(req.body.address || "").trim();
  if (!SUPPORTED.includes(asset) || !Number.isFinite(amount) || amount <= 0 || !address)
    return res.status(400).json({ error: "اطلاعات برداشت نامعتبر است." });

  const wallet = await Wallet.findOne({ user: req.user._id });
  const a = wallet.assets.find(x => x.symbol === asset);
  if (!a || a.balance < amount) return res.status(400).json({ error: "موجودی کافی نیست." });

  a.balance -= amount;
  await wallet.save();
  const row = await Withdrawal.create({ user: req.user._id, asset, amount, address });
  res.status(201).json({ withdrawal: row, message: "درخواست برداشت برای بررسی ثبت شد." });
}

export async function transactions(req, res) {
  const rows = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ deposits: rows, withdrawals });
}