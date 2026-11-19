/**
 * Member authentication — no session table, no extra dependencies.
 *
 *   Passwords  scrypt with OWASP-recommended cost (N=2^17, r=8, p=1), per-user salt.
 *              Older hashes are upgraded transparently on the next successful sign-in.
 *   Sessions   cookie = userId.sessionVersion.expiry.HMAC-SHA256 — HttpOnly, Secure,
 *              SameSite=Lax, and __Host- prefixed when deployed (no subdomain can set it).
 *              Bumping a user's sessionVersion revokes every session they have
 *              (used by sign-out, rejection and removal).
 *   Links      Approve/Reject email links are signed separately ("decision:" domain).
 */
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { redis, storageMode } from "./store.js";

const scrypt = promisify(scryptCb);

// OWASP Password Storage Cheat Sheet: scrypt N=2^17, r=8, p=1 (needs ~128 MiB, so raise maxmem).
const SCRYPT = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const LEGACY_SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;

const isDeployed = () => Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development");

// __Host- cookies must be Secure, Path=/ and have no Domain, so only this exact host can set them.
export const cookieName = () => (isDeployed() ? "__Host-ccc_member" : "ccc_member");

const MEMBER_SESSION_S = 60 * 60 * 24 * 30; // 30 days: members stay signed in on their phone
const ADMIN_SESSION_S = 60 * 60 * 24 * 7; // 7 days: admin accounts can approve people, so shorter

function secret() {
  const s = process.env.FANTASY_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!s) {
    if (isDeployed()) throw new Error("Set FANTASY_SESSION_SECRET to enable member login.");
    return "ccc-local-dev-secret";
  }
  if (isDeployed() && s.length < 32) throw new Error("FANTASY_SESSION_SECRET must be at least 32 characters.");
  return s;
}

const sign = (v) => createHmac("sha256", secret()).update(`session:${v}`).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// ── Passwords ────────────────────────────────────────────────────────────────

/** Format: scrypt$v2$N$r$p$saltHex$hashHex (params stored so they can be raised later). */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, SCRYPT);
  return `scrypt$v2$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function parseHash(stored) {
  const parts = String(stored ?? "").split("$");
  if (parts[0] !== "scrypt") return null;
  if (parts[1] === "v2" && parts.length === 7) {
    const [, , N, r, p, salt, hash] = parts;
    return { params: { N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem }, salt, hash, legacy: false };
  }
  if (parts.length === 3) return { params: LEGACY_SCRYPT, salt: parts[1], hash: parts[2], legacy: true }; // first release
  return null;
}

// Verified when the email doesn't exist, so sign-in takes the same time either way (no user enumeration).
let dummyHash;
const getDummy = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

export async function verifyPassword(password, stored) {
  const parsed = parseHash(stored ?? (await getDummy()));
  if (!parsed) return false;
  const expected = Buffer.from(parsed.hash, "hex");
  // First-release hashes were made from the raw password; current ones from its NFKC form.
  const input = parsed.legacy ? String(password) : String(password).normalize("NFKC");
  const got = await scrypt(input, Buffer.from(parsed.salt, "hex"), expected.length, parsed.params);
  return Boolean(stored) && got.length === expected.length && timingSafeEqual(got, expected);
}

/** True when a stored hash uses weaker-than-current parameters (upgrade it after sign-in). */
export function needsRehash(stored) {
  const parsed = parseHash(stored);
  return !parsed || parsed.legacy || parsed.params.N < SCRYPT.N || parsed.params.r !== SCRYPT.r || parsed.params.p !== SCRYPT.p;
}

// ── Session cookie ───────────────────────────────────────────────────────────

const sessionSeconds = (user) => (user.role === "ADMIN" ? ADMIN_SESSION_S : MEMBER_SESSION_S);

export function makeToken(user, now = Date.now()) {
  const body = `${user.id}.${user.sessionVersion}.${now + sessionSeconds(user) * 1000}`;
  return `${body}.${sign(body)}`;
}

export function parseToken(token, now = Date.now()) {
  if (!token || token.length > 300) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, version, exp, sig] = parts;
  if (!safeEqual(sig, sign(`${id}.${version}.${exp}`))) return null;
  if (!(Number(exp) > now)) return null;
  return { id, version: Number(version) };
}

// ── One-click decision links (Approve / Reject buttons in admin emails) ──────

const DECISION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DECISIONS = new Set(["APPROVE", "REJECT"]);
// Domain-separated from session cookies so a cookie signature can never pass as a link (or vice versa).
const signDecision = (body) => createHmac("sha256", secret()).update(`decision:${body}`).digest("base64url");

/** Signed link token for one decision about one registration. Holds no personal data. */
export function makeDecisionToken(userId, decision, now = Date.now()) {
  if (!DECISIONS.has(decision)) throw new Error("bad decision");
  const body = `${userId}.${decision}.${now + DECISION_TTL_MS}`;
  return `${body}.${signDecision(body)}`;
}

/** → { userId, decision } or { error: "invalid" | "expired" } */
export function parseDecisionToken(token, now = Date.now()) {
  const raw = String(token ?? "");
  if (raw.length > 300) return { error: "invalid" };
  const parts = raw.split(".");
  if (parts.length !== 4) return { error: "invalid" };
  const [userId, decision, exp, sig] = parts;
  if (!DECISIONS.has(decision) || !safeEqual(sig, signDecision(`${userId}.${decision}.${exp}`))) return { error: "invalid" };
  if (!(Number(exp) > now)) return { error: "expired" };
  return { userId, decision };
}

// ── Email confirmation links (sent to the person registering) ────────────────

export const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;
const signVerify = (body) => createHmac("sha256", secret()).update(`verify:${body}`).digest("base64url");

/** Proves the registrant controls the inbox. Domain-separated from sessions and admin links. */
export function makeVerifyToken(userId, now = Date.now()) {
  const body = `${userId}.VERIFY.${now + VERIFY_TTL_MS}`;
  return `${body}.${signVerify(body)}`;
}

/** → { userId } or { error: "invalid" | "expired" } */
export function parseVerifyToken(token, now = Date.now()) {
  const raw = String(token ?? "");
  if (raw.length > 300) return { error: "invalid" };
  const parts = raw.split(".");
  if (parts.length !== 4 || parts[1] !== "VERIFY") return { error: "invalid" };
  const [userId, kind, exp, sig] = parts;
  if (!safeEqual(sig, signVerify(`${userId}.${kind}.${exp}`))) return { error: "invalid" };
  if (!(Number(exp) > now)) return { error: "expired" };
  return { userId };
}

// ── Cookies ──────────────────────────────────────────────────────────────────

export function readCookie(req, name = cookieName()) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function sessionCookie(token, user) {
  const secure = isDeployed() ? "; Secure" : "";
  return `${cookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionSeconds(user)}${secure}`;
}

export function clearCookie() {
  const secure = isDeployed() ? "; Secure" : "";
  return `${cookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** The signed-in user from state, or null (bad signature, expired, revoked, or not approved). */
export function currentUser(req, state) {
  const t = parseToken(readCookie(req));
  if (!t) return null;
  const user = state.users.find((u) => u.id === t.id);
  // Only approved (ACTIVE) members have a session; legacy records without a status count as ACTIVE.
  return user && user.sessionVersion === t.version && (user.status ?? "ACTIVE") === "ACTIVE" ? user : null;
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ── Client identity, throttling and audit logging ───────────────────────────

/** Client IP as set by Vercel's edge (clients can't spoof x-vercel-forwarded-for / x-real-ip there). */
export function clientIp(req) {
  const h = req.headers;
  return String(h["x-vercel-forwarded-for"] || h["x-real-ip"] || h["x-forwarded-for"] || "unknown").split(",")[0].trim();
}

const memoryHits = new Map();
// INCR + EXPIRE in one atomic step, so a key can never be left without an expiry (a permanent lockout).
const INCR_WITH_TTL = `local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return n`;
const hashKey = (k) => createHash("sha256").update(k).digest("base64url").slice(0, 32); // no emails/IPs in Redis keys

/** true = allowed. Redis when configured (shared across instances), else per-instance memory. */
export async function throttle(key, max = 8, windowS = 600) {
  if (storageMode === "redis") {
    const n = await redis(["EVAL", INCR_WITH_TTL, 1, `ccc:fantasy:throttle:${hashKey(key)}`, windowS]);
    return n <= max;
  }
  const now = Date.now();
  const h = memoryHits.get(key);
  if (!h || h.until < now) {
    memoryHits.set(key, { n: 1, until: now + windowS * 1000 });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}

/** "sanjeev@gmail.com" → "s***@gmail.com" (enough to investigate, without full PII in logs). */
export const maskEmail = (email) => String(email ?? "").replace(/^(.).*(@.*)$/, "$1***$2");

/** Security events → Vercel runtime logs (searchable for "fantasy-audit"). Never logs passwords or tokens. */
export function audit(event, details = {}) {
  console.info(JSON.stringify({ tag: "fantasy-audit", event, at: new Date().toISOString(), ...details }));
}
