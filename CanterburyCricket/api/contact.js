import nodemailer from "nodemailer";
import { z } from "zod";
import dns from "dns/promises";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

/* =========================
   Provider typo-squat detection
   - Blocks near-miss domains like ggmail.com / gmaill.com / gmial.com
========================= */
const COMMON_PROVIDER_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.ca",
  "icloud.com",
];

function levenshtein(a, b) {
  a = String(a || "");
  b = String(b || "");
  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // delete
        dp[i][j - 1] + 1, // insert
        dp[i - 1][j - 1] + cost // replace
      );
    }
  }
  return dp[m][n];
}

function detectProviderTypo(domain) {
  const d = String(domain || "").toLowerCase();

  // only for common provider-like TLDs; reduces false positives
  if (!/\.(com|ca)$/.test(d)) return null;

  for (const good of COMMON_PROVIDER_DOMAINS) {
    if (d === good) continue;

    // <=2 catches: ggmail.com (extra g), gmial.com (swap), gmaill.com (extra l)
    const dist = levenshtein(d, good);
    if (dist <= 2) return good;
  }

  return null;
}

/* =========================
   Email validation (syntax + common typos)
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

  // Provider "base" blocking (gmail.* -> must be gmail.com)
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

  // Optional: block ultra-common typo TLDs
  const blockedTlds = new Set(["con", "cmo", "comm", "cim", "vom", "chh"]);
  if (blockedTlds.has(tld)) return false;

  return true;
}

/* =========================
   DNS domain checks (deliverability-ish)
========================= */
const DOMAIN_CHECK_CACHE = new Map(); // domain -> { ok, exp }
const DOMAIN_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getDomainFromEmail(email) {
  const at = email.lastIndexOf("@");
  return at > 0 ? email.slice(at + 1).trim().toLowerCase() : "";
}

function isValidDomainShape(domain) {
  if (!domain || domain.length > 253) return false;
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;

  const labels = domain.split(".");
  if (labels.some((l) => !l.length || l.length > 63)) return false;
  if (labels.some((l) => l.startsWith("-") || l.endsWith("-"))) return false;

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;

  return true;
}

async function withTimeout(promise, ms) {
  return await Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function domainAcceptsMail(domain) {
  const now = Date.now();
  const cached = DOMAIN_CHECK_CACHE.get(domain);
  if (cached && cached.exp > now) return cached.ok;

  let ok = false;

  // 1) Prefer MX records
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 1500);
    ok = Array.isArray(mx) && mx.length > 0;
  } catch {
    ok = false;
  }

  // 2) Fallback: A/AAAA (some setups)
  if (!ok) {
    try {
      const [a, aaaa] = await withTimeout(
        Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]),
        1500
      );

      const hasA =
        a.status === "fulfilled" && Array.isArray(a.value) && a.value.length > 0;
      const hasAAAA =
        aaaa.status === "fulfilled" &&
        Array.isArray(aaaa.value) &&
        aaaa.value.length > 0;

      ok = hasA || hasAAAA;
    } catch {
      ok = false;
    }
  }

  DOMAIN_CHECK_CACHE.set(domain, { ok, exp: now + DOMAIN_CACHE_TTL_MS });
  return ok;
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
          return u.protocol === "http:" || u.protocol === "https:";
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
  .strict();

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

  if (!allowedOrigins.length) return true;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (origin) return allowedOrigins.includes(origin);

  if (referer) {
    return allowedOrigins.some((o) => referer.startsWith(o + "/") || referer === o);
  }

  return false;
}

/* =========================
   Handler
========================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Content-Type guard
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }

  // Origin allowlist
  if (!isAllowedOrigin(req)) {
    console.warn("Blocked request. origin=", req.headers.origin, "referer=", req.headers.referer);
    return res.status(403).json({ error: "Forbidden origin" });
  }

  // Rate limit
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }

  // Parse body
  const body = parseBody(req);
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  // Validate schema
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message || "Invalid form data";
    return res.status(400).json({ error: msg });
  }

  const { name, email, profile, message, website, startedAt } = parsed.data;

  // Honeypot -> pretend success
  if (website) {
    return res.status(200).json({ ok: true });
  }

  // Bot speed -> pretend success
  if (typeof startedAt === "number") {
    const dt = Date.now() - startedAt;
    if (dt >= 0 && dt < 1200) {
      return res.status(200).json({ ok: true });
    }
  }

  // Provider typo-squat blocking (ggmail.com, gmial.com, gmaill.com, etc.)
  const domain = getDomainFromEmail(email);
  const suggestion = detectProviderTypo(domain);
  if (suggestion) {
    return res.status(400).json({ error: `Did you mean ${suggestion}?` });
  }

  // DNS validation to reject random fake domains
  if (!isValidDomainShape(domain)) {
    return res.status(400).json({ error: "Email domain looks invalid." });
  }

  const domainOk = await domainAcceptsMail(domain);
  if (!domainOk) {
    return res.status(400).json({ error: "Email domain does not appear to exist." });
  }

  // SMTP env guard
  const requiredEnv = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO"];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env vars:", missing);
    return res.status(500).json({ error: "Server email is not configured" });
  }

  // Transport
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
      replyTo: email, // already validated
      subject: `New Contact Form Message — ${safeText(name)}`,
      text: emailText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
