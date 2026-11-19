/**
 * Member sessions without a session table:
 *   cookie `ccc_member` = userId.sessionVersion.expiry.signature (HMAC-SHA256, HttpOnly)
 * Bumping a user's sessionVersion signs them out everywhere.
 * Passwords: scrypt (node:crypto) — no extra dependencies.
 */
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { redis, storageMode } from "./store.js";

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 16384, r: 8, p: 1 };

export const COOKIE = "ccc_member";
const MAX_AGE_S = 60 * 60 * 24 * 60; // 60 days — stay signed in on your phone

const isDeployed = () => Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development");

function secret() {
  const s = process.env.FANTASY_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!s) {
    if (isDeployed()) throw new Error("Set FANTASY_SESSION_SECRET to enable member login.");
    return "ccc-local-dev-secret";
  }
  return s;
}

const sign = (v) => createHmac("sha256", secret()).update(v).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ── Passwords ────────────────────────────────────────────────────────────────

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

// Used when the email doesn't exist so response timing doesn't reveal it.
const DUMMY = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function verifyPassword(password, stored) {
  const [alg, saltHex, hashHex] = (stored || DUMMY).split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, SCRYPT);
  return Boolean(stored) && got.length === expected.length && timingSafeEqual(got, expected);
}

// ── Session cookie ───────────────────────────────────────────────────────────

export function makeToken(user, now = Date.now()) {
  const body = `${user.id}.${user.sessionVersion}.${now + MAX_AGE_S * 1000}`;
  return `${body}.${sign(body)}`;
}

export function parseToken(token, now = Date.now()) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, version, exp, sig] = parts;
  if (!safeEqual(sig, sign(`${id}.${version}.${exp}`))) return null;
  if (Number(exp) <= now) return null;
  return { id, version: Number(version) };
}

export function readCookie(req, name = COOKIE) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function sessionCookie(token) {
  const secure = isDeployed() ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_S}${secure}`;
}

export function clearCookie() {
  const secure = isDeployed() ? "; Secure" : "";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** The signed-in user from state, or null (wrong signature, expired, or signed out elsewhere). */
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

// ── Throttling (login/register brute-force protection) ──────────────────────

const memoryHits = new Map();

/** true = allowed. Uses Redis when configured (shared across instances), else per-instance memory. */
export async function throttle(key, max = 8, windowS = 600) {
  if (storageMode === "redis") {
    const k = `ccc:fantasy:throttle:${key}`;
    const n = await redis(["INCR", k]);
    if (n === 1) await redis(["EXPIRE", k, windowS]);
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
