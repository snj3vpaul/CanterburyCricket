import nodemailer from "nodemailer";
import { z } from "zod";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  profile: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  website: z.string().trim().max(200).optional().or(z.literal("")), // honeypot
});

// Simple in-memory rate limit (fine for small club site).
// If you ever need stronger limits across instances, switch to Upstash Redis.
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  if (entry.count >= RATE_LIMIT.max) return false;
  entry.count += 1;
  return true;
}

// Avoid control chars & header injection surprises
function safeText(str) {
  return String(str).replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Origin allowlist (helps prevent cross-site form posting)
  const origin = req.headers.origin || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!rateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again soon." });
  }

  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid form data." });

  const { name, email, profile, message, website } = parsed.data;

  // Honeypot filled => likely bot. Return OK to avoid giving feedback.
  if (website) return res.status(200).json({ ok: true });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = `New Website Message — ${safeText(name)}`;

  // Text-only email: safest default against HTML/XSS in email clients
  const text =
`New message from the website:

Name: ${safeText(name)}
Email: ${safeText(email)}
Profile: ${safeText(profile || "-")}

Message:
${safeText(message)}
`;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      replyTo: safeText(email),
      subject,
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
}
