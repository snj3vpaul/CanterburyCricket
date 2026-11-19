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

/** Names/emails are user-supplied: strip anything that could break a header or line. */
const clean = (s) => String(s ?? "").replace(/[\r\n<>]/g, " ").slice(0, 80).trim();
const html = (s) =>
  clean(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

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

const button = (href, label, bg, fg) =>
  `<a href="${href}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:${bg};color:${fg};` +
  `font-weight:800;font-size:16px;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${label}</a>`;

/**
 * The admin notification, with one-click Approve / Reject buttons.
 * Each button opens a short confirm page on the site (so email link-scanners can't
 * trigger a decision), signed for this one registration and valid for 7 days.
 */
export function registrationEmail({ name, email, approveUrl, rejectUrl, adminUrl, claim = null }) {
  const subject = `Fantasy League: approve ${clean(name)}?`;
  const claimLines = claim
    ? [
        `Says they are squad player: ${clean(claim.playerName)}${claim.jersey ? ` (#${clean(claim.jersey)})` : ""}`,
        `Name on the form ${claim.nameMatches ? "matches" : "does NOT match"} the squad sheet.`,
        `Username on the leaderboard: @${clean(claim.username)}`,
        ...(claim.conflict ? [`WARNING: that squad player already belongs to @${clean(claim.conflict)}.`] : []),
      ]
    : [];
  const text = [
    `${clean(name)} (${clean(email)}) registered for the Canterbury CC Fantasy League and confirmed their email.`,
    ...claimLines,
    "",
    "If they're a Canterbury player, APPROVE:",
    approveUrl,
    "",
    "If you don't recognise them, REJECT:",
    rejectUrl,
    "",
    "Each link asks you to confirm and works for 7 days. You can also decide on the admin page:",
    adminUrl,
  ].join("\n");

  const body = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#f4f2ec">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#0d111c;border-radius:16px;color:#fbf8f1;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif" cellpadding="0" cellspacing="0">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;color:#f7b500;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Canterbury CC · Fantasy League</p>
      <h1 style="margin:10px 0 6px;font-size:22px;line-height:1.3">${html(name)} wants to join</h1>
      <p style="margin:0;color:rgba(251,248,241,.7);font-size:15px">${html(email)}</p>
    </td></tr>
    ${
      claim
        ? `<tr><td style="padding:16px 28px 0;font-size:15px;line-height:1.6;color:rgba(251,248,241,.86)">
      Squad player: <strong style="color:#fbf8f1">${html(claim.playerName)}${claim.jersey ? ` #${html(claim.jersey)}` : ""}</strong><br>
      Name ${claim.nameMatches ? '<span style="color:#7ee2a8">matches the squad sheet ✓</span>' : '<span style="color:#ff8aa0">does not match the squad sheet</span>'}<br>
      Leaderboard name: <strong style="color:#fbf8f1">@${html(claim.username)}</strong>
      ${claim.conflict ? `<br><span style="color:#ff8aa0">⚠ This squad player already belongs to @${html(claim.conflict)}.</span>` : ""}
    </td></tr>`
        : ""
    }
    <tr><td style="padding:20px 28px 8px;color:rgba(251,248,241,.86);font-size:15px;line-height:1.5">
      Only approve Canterbury players. They can't sign in until an admin decides.
    </td></tr>
    <tr><td style="padding:16px 28px 8px">
      ${button(approveUrl, "Approve", "#f7b500", "#1b1b1b")}
      &nbsp;&nbsp;
      ${button(rejectUrl, "Reject", "#2a1520", "#ff8aa0")}
    </td></tr>
    <tr><td style="padding:16px 28px 28px;color:rgba(251,248,241,.5);font-size:12px;line-height:1.5">
      Each button asks you to confirm, and works for 7 days. You can also decide on the
      <a href="${adminUrl}" style="color:#ffd36a">admin page</a>.
    </td></tr>
  </table></td></tr></table></body></html>`;

  return { subject, text, html: body };
}

export function notifyAdminsOfRegistration({ admins, ...details }) {
  if (!admins.length) return Promise.resolve(false);
  return send({ to: admins.join(", "), ...registrationEmail(details) });
}

/** Sent to the person registering: proves they own the inbox before an admin ever sees them. */
export function verifyEmail({ name, verifyUrl }) {
  const first = clean(name).split(" ")[0] || "there";
  const subject = "Confirm your email: Canterbury CC Fantasy League";
  const text = [
    `Hi ${first},`,
    "",
    "Confirm your email to finish registering for the Canterbury CC Fantasy League:",
    verifyUrl,
    "",
    "The link works for 48 hours. If you didn't register, ignore this email and nothing happens.",
    "",
    "Canterbury Cricket Club",
  ].join("\n");
  const body = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#f4f2ec">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#0d111c;border-radius:16px;color:#fbf8f1;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif" cellpadding="0" cellspacing="0">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;color:#f7b500;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Canterbury CC · Fantasy League</p>
      <h1 style="margin:10px 0 6px;font-size:22px;line-height:1.3">Hi ${html(first)}, confirm your email</h1>
    </td></tr>
    <tr><td style="padding:16px 28px 8px">${button(verifyUrl, "Confirm my email", "#f7b500", "#1b1b1b")}</td></tr>
    <tr><td style="padding:16px 28px 28px;color:rgba(251,248,241,.6);font-size:13px;line-height:1.5">
      The link works for 48 hours. If you didn't register, ignore this email and nothing happens.
    </td></tr>
  </table></td></tr></table></body></html>`;
  return { subject, text, html: body };
}

export function sendVerifyEmail({ name, email, verifyUrl }) {
  return send({ to: clean(email), ...verifyEmail({ name, verifyUrl }) });
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
