import nodemailer from "nodemailer";
import { z } from "zod";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

/* =========================
   Validation Schema
========================= */
const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  profile: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  website: z.string().trim().optional().or(z.literal("")), // honeypot
});

/* =========================
   Rate Limiting (simple)
========================= */
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }

  if (entry.count >= RATE_LIMIT.max) return true;
  entry.count += 1;
  return false;
}

/* =========================
   Helpers
========================= */
function safeText(str) {
  return String(str)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\r?\n|\r/g, " ")
    .trim();
}

function parseBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

/* =========================
   Handler
========================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* ---------- Origin Protection ---------- */
  const origin = req.headers.origin || "";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length && !allowedOrigins.includes(origin)) {
    console.warn("Blocked origin:", origin);
    return res.status(403).json({ error: "Forbidden origin" });
  }

  /* ---------- Rate Limit ---------- */
  const ip =
    (req.headers["x-forwarded-for"] || "")
      .toString()
      .split(",")[0]
      .trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }

  /* ---------- Parse Body ---------- */
  const body = parseBody(req);
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  /* ---------- Validate ---------- */
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.issues);
    return res.status(400).json({ error: "Invalid form data" });
  }

  const { name, email, profile, message, website } = parsed.data;

  /* ---------- Honeypot ---------- */
  if (website) {
    // Bot submission — pretend success
    return res.status(200).json({ ok: true });
  }

  /* ---------- Mail Transport ---------- */
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailText = `
New message from Canterbury Cricket Club website

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
      subject: `New Contact Form Message — ${safeText(name)}`,
      text: emailText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
