import Advertisement from "./Advertisement.js";
import AdView from "./AdView.js";
import { addCoins } from "./coins.js";

export async function listAds(req, res) {
  const ads = await Advertisement.find({
    active: true,
    $or: [{ assignedUserIds: { $size: 0 } }, { assignedUserIds: req.user._id }]
  }).sort({ createdAt: -1 }).limit(50);
  res.json({ ads });
}

export async function startAd(req, res) {
  const ad = await Advertisement.findOne({ _id: req.params.id, active: true });
  if (!ad) return res.status(404).json({ error: "تبلیغ پیدا نشد." });
  const since = new Date(); since.setHours(0,0,0,0);
  const count = await AdView.countDocuments({ user: req.user._id, advertisement: ad._id, createdAt: { $gte: since } });
  if (count >= ad.dailyLimit) return res.status(429).json({ error: "سقف روزانه این تبلیغ تکمیل شده است." });
  const view = await AdView.create({ user: req.user._id, advertisement: ad._id });
  res.json({ viewId: view._id, durationSeconds: ad.durationSeconds });
}

export async function completeAd(req, res) {
  const view = await AdView.findOne({ _id: req.params.viewId, user: req.user._id }).populate("advertisement");
  if (!view || view.rewarded) return res.status(400).json({ error: "مشاهده تبلیغ نامعتبر است." });
  const elapsed = Date.now() - new Date(view.startedAt).getTime();
  if (elapsed < view.advertisement.durationSeconds * 1000)
    return res.status(400).json({ error: "زمان مشاهده کامل نشده است." });

  view.rewarded = true;
  view.completedAt = new Date();
  await view.save();
  const reward = Number(view.advertisement.rewardCoins || 0);
  const balance = reward ? await addCoins(req.user._id, reward, "AD_REWARD", `پاداش تبلیغ: ${view.advertisement.title}`, String(view.advertisement._id)) : req.user.coins;
  res.json({ reward, coins: balance });
}