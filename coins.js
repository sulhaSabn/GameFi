import User from "./User.js";
import CoinTransaction from "./CoinTransaction.js";
import Setting from "./Setting.js";

async function rate() {
  const s = await Setting.findOne({ key: "coinsPerUsdCent" });
  return Number(s?.value ?? 1000); // 1000 coins = $0.01
}

export async function addCoins(userId, amount, type, note = "", sourceId = "") {
  amount = Math.floor(Number(amount));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid coin amount");
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.coins += amount;
  await user.save();
  await CoinTransaction.create({ user: userId, type, amount, balanceAfter: user.coins, note, sourceId });
  return user.coins;
}

export async function spendCoins(userId, amount, type = "COIN_SPENT", note = "") {
  amount = Math.floor(Number(amount));
  const user = await User.findById(userId);
  if (!user || amount <= 0 || user.coins < amount) throw new Error("Insufficient coins");
  user.coins -= amount;
  await user.save();
  await CoinTransaction.create({ user: userId, type, amount: -amount, balanceAfter: user.coins, note });
  return user.coins;
}

export async function coinBalance(req, res) {
  const r = await rate();
  res.json({ coins: req.user.coins, usdValue: req.user.coins / r / 100 });
}

export async function coinHistory(req, res) {
  const rows = await CoinTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ transactions: rows });
}

export async function dailyReward(req, res) {
  const user = await User.findById(req.user._id);
  const now = new Date();
  if (user.lastDailyRewardAt && now - user.lastDailyRewardAt < 24 * 60 * 60 * 1000)
    return res.status(429).json({ error: "پاداش روزانه قبلاً دریافت شده است." });
  const s = await Setting.findOne({ key: "dailyReward" });
  const amount = Number(s?.value ?? 500);
  user.lastDailyRewardAt = now;
  await user.save();
  const balance = await addCoins(user._id, amount, "DAILY_BONUS", "پاداش روزانه");
  res.json({ added: amount, coins: balance });
}

export async function playGame(req, res) {
  const { gameId, score, proof } = req.body;
  const allowed = ["tap", "memory", "target"];
  if (!allowed.includes(gameId)) return res.status(400).json({ error: "بازی نامعتبر است." });
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) return res.status(400).json({ error: "امتیاز نامعتبر است." });

  // The server caps rewards. The client score is never trusted for arbitrary coin amounts.
  const maxReward = Number((await Setting.findOne({ key: `gameReward:${gameId}` }))?.value ?? 100);
  const reward = Math.min(maxReward, Math.max(1, Math.floor(n / 10)));
  const balance = await addCoins(req.user._id, reward, "GAME_REWARD", `پاداش بازی ${gameId}`);
  res.json({ reward, coins: balance, message: "پاداش ثبت شد." });
}