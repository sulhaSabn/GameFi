import nodemailer from "nodemailer";

function transporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function send(to, subject, html) {
  const t = transporter();
  if (!t) {
    console.warn("SMTP is not configured. Email was not sent.");
    return;
  }
  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

export async function sendVerificationEmail(user, raw) {
  const url = `${process.env.APP_URL}/api/auth/verify-email?token=${raw}`;
  await send(user.email, "تأیید ایمیل حساب", `<p>سلام ${user.name}</p><p>برای تأیید ایمیل روی لینک زیر بزنید:</p><p><a href="${url}">${url}</a></p>`);
}

export async function sendPasswordResetEmail(user, raw) {
  const url = `${process.env.APP_URL}/reset-password?token=${raw}`;
  await send(user.email, "بازیابی رمز عبور", `<p>سلام ${user.name}</p><p>لینک بازیابی:</p><p><a href="${url}">${url}</a></p>`);
}