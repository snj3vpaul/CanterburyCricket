/**
 * Membership emails, sent with the same SMTP settings as the Contact form
 * (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM).
 * Best-effort: if SMTP isn't configured or sending fails, nothing breaks; the
 * pending registration still shows on /fantasy/admin.
 */
import nodemailer from "nodemailer";

const SMTP_KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];

function transporter() {
  if (SMTP_KEYS.some((k) => !process.env[k])) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Strip anything that could break out of a header or line (names are user-supplied). */
const clean = (s) => String(s ?? "").replace(/[\r\n<>]/g, " ").slice(0, 80).trim();

async function send(message) {
  const t = transporter();
  if (!t) return false;
  try {
    // Don't let a slow mail server hold up the member's request.
    await Promise.race([
      t.sendMail({ from: process.env.MAIL_FROM, ...message }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP timeout")), 8000)),
    ]);
    return true;
  } catch (e) {
    console.error("[fantasy] email failed:", e.message);
    return false;
  }
}

export function notifyAdminsOfRegistration({ admins, name, email, siteUrl }) {
  if (!admins.length) return Promise.resolve(false);
  return send({
    to: admins.join(", "),
    subject: `Fantasy League: ${clean(name)} is waiting for approval`,
    text: [
      `${clean(name)} (${clean(email)}) registered for the Canterbury CC Fantasy League.`,
      "",
      "If they're a Canterbury player, approve them here:",
      `${siteUrl}/fantasy/admin`,
      "",
      "If you don't recognise them, reject the registration on the same page.",
    ].join("\n"),
  });
}

export function notifyMemberApproved({ name, email, siteUrl }) {
  return send({
    to: clean(email),
    subject: "You're in: Canterbury CC Fantasy League",
    text: [
      `Hi ${clean(name).split(" ")[0] || "there"},`,
      "",
      "A club admin has approved your Fantasy League account. Sign in to make your picks:",
      `${siteUrl}/member-login`,
      "",
      "Canterbury Cricket Club",
    ].join("\n"),
  });
}
