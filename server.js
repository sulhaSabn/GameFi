import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./database.js";
import { register, login, me, verifyEmail, forgotPassword, resetPassword, authRequired, adminRequired } from "./auth.js";
import { coinBalance, coinHistory, dailyReward, playGame } from "./coins.js";
import { listAds, startAd, completeAd } from "./advertisements.js";
import { getWallet, deposit, requestWithdrawal, transactions } from "./wallet.js";
import * as admin from "./admin.js";
import { errorHandler } from "./utils.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 10000);

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(x=>x.trim()) : true,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7" }));

app.get("/api/health", (req,res)=>res.json({ ok:true, service:"crypto-game-backend", time:new Date().toISOString() }));

app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/auth/verify-email", verifyEmail);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.get("/api/auth/me", authRequired, me);

app.get("/api/coins", authRequired, coinBalance);
app.get("/api/coins/history", authRequired, coinHistory);
app.post("/api/coins/daily", authRequired, dailyReward);
app.post("/api/games/play", authRequired, playGame);

app.get("/api/ads", authRequired, listAds);
app.post("/api/ads/:id/start", authRequired, startAd);
app.post("/api/ads/views/:viewId/complete", authRequired, completeAd);

app.get("/api/wallet", authRequired, getWallet);
app.post("/api/wallet/deposit", authRequired, deposit);
app.post("/api/wallet/withdraw", authRequired, requestWithdrawal);
app.get("/api/wallet/transactions", authRequired, transactions);

app.get("/api/admin/dashboard", authRequired, adminRequired, admin.dashboard);
app.get("/api/admin/users", authRequired, adminRequired, admin.users);
app.patch("/api/admin/users/:id", authRequired, adminRequired, admin.updateUser);
app.post("/api/admin/users/:id/reward", authRequired, adminRequired, admin.rewardUser);
app.get("/api/admin/ads", authRequired, adminRequired, admin.listAllAds);
app.post("/api/admin/ads", authRequired, adminRequired, admin.createAd);
app.patch("/api/admin/ads/:id", authRequired, adminRequired, admin.updateAd);
app.get("/api/admin/withdrawals", authRequired, adminRequired, admin.withdrawals);
app.patch("/api/admin/withdrawals/:id", authRequired, adminRequired, admin.reviewWithdrawal);
app.get("/api/admin/settings", authRequired, adminRequired, admin.settings);
app.put("/api/admin/settings/:key", authRequired, adminRequired, admin.updateSetting);

if (process.env.NODE_ENV === "production") {
  const frontend = path.join(__dirname, "frontend", "dist");
  app.use(express.static(frontend));
  app.get("*", (req,res,next)=> req.path.startsWith("/api/") ? next() : res.sendFile(path.join(frontend,"index.html")));
}

app.use(errorHandler);

await connectDB();
await admin.bootstrapAdmin();

app.listen(port, ()=>console.log(`Server running on port ${port}`));