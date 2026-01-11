import nodemailer from "nodemailer";
import { z } from "zod";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

/* =========================
   Email validation (same logic as client)
========================= */
function isValidEmailStrict(input) {
  const email = String(input || "").trim();

  if (!email) return false;
  if (email.length > 254) return false;
  if (email.includes(" ")) return false;

  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();

  if (!local || local.length > 64) return false;
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;

  const labels = domain.split(".");
  if (labels.some((l) => !l.length)) return false;
  if (labels.some((l) => l.startsWith("-") || l.endsWith("-"))) return false;

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;

  const re =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  if (!re.test(email)) return false;

  const providerAllowlist = [
    { base: "gmail", allowed: ["gmail.com"] },
    { base: "yahoo", allowed: ["yahoo.com", "yahoo.ca"] },
    { base: "outlook", allowed: ["outlook.com"] },
    { base: "hotmail", allowed: ["hotmail.com"] },
    { base: "live", allowed: ["live.com"] },
    { base: "icloud", allowed: ["icloud.com"] },
  ];
  for (const p of providerAllowlist) {
    if (domain === p.base || domain.startsWith(p.base + ".")) {
      return p.allowed.includes(domain);
    }
  }

  const blockedTlds = new Set(["con", "cmo", "comm", "cim", "vom", "chh"]);
  if (blockedTlds.has(tld)) return false;

  return true;
}

/* =========================
   Validation Schema
========================= */
const ContactSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),

    email: z
      .string()
      .trim()
      .max(120, "Email is too long")
      .refine(isValidEmailStrict, { message: "Invalid email address" }),

    profile: z
      .string()
      .trim()
      .max(300, "Profile link is too long")
      .optional()
      .or(z.literal(""))
      .refine((v) => {
        if (!v) return true;
        try {
          const u = new URL(v);
          return /^https?:$/.test(u.protocol);
        } catch {
          return false;
        }
      }, { message: "Invalid profile URL" }),

    message: z
      .string()
      .trim()
      .min(5, "Message is too short")
      .max(2000, "Message is too long"),

    website: z.string().trim().optional().or(z.literal("")), // honeypot

    startedAt: z.number().int().optional(), // bot-signal
  })
  .strict(); // reject unknown keys

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

function getClientIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "")
      .toString()
      .split(",")[0]
      .trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function isAllowedOrigin(req) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // If no allowlist is configured, allow (common for same-origin deployments).
  if (!allowedOrigins.length) return true;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // Prefer Origin when present
  if (origin) return allowedOrigins.includes(origin);

  // If Origin missing (some clients), fall back to Referer (best-effort)
  // Only allow if referer starts with an allowed origin.
  if (referer) return allowedOrigins.some((o) => referer.startsWith(o + "/") || referer === o);

  return false;
}

/* =========================
   Handler
========================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Content-Type guard (security + predictability)
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }

  /* ---------- Origin Protection ---------- */
  if (!isAllowedOrigin(req)) {
    console.warn("Blocked request. origin=", req.headers.origin, "referer=", req.headers.referer);
    return res.status(403).json({ error: "Forbidden origin" });
  }

  /* ---------- Rate Limit ---------- */
  const ip = getClientIp(req);
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
    const msg = parsed.error.issues?.[0]?.message || "Invalid form data";
    return res.status(400).json({ error: msg });
  }

  const { name, email, profile, message, website, startedAt } = parsed.data;

  /* ---------- Honeypot ---------- */
  if (website) {
    // Bot submission — pretend success
    return res.status(200).json({ ok: true });
  }

  /* ---------- Timing Bot Check ---------- */
  // Reject submissions that happen "instantly" after page load (bots)
  // Keep this gentle to avoid blocking real fast users.
  if (typeof startedAt === "number") {
    const dt = Date.now() - startedAt;
    if (dt >= 0 && dt < 1200) {
      return res.status(200).json({ ok: true }); // pretend success
    }
  }

  /* ---------- Ensure SMTP is configured ---------- */
  const requiredEnv = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO"];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env vars:", missing);
    return res.status(500).json({ error: "Server email is not configured" });
  }

  /* ---------- Mail Transport ---------- */
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
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
      // Use the *validated* email (no header injection, no “safeText” guesswork)
      replyTo: email,
      subject: `New Contact Form Message — ${safeText(name)}`,
      text: emailText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
