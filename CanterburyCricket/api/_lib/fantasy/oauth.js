/**
 * "Continue with Google / Microsoft / Yahoo" (OpenID Connect, authorization-code flow).
 *
 * - state + nonce (+ PKCE where the provider supports it) live in a signed, 10-minute,
 *   HttpOnly cookie, so a callback can't be forged or replayed from another browser.
 * - The code is exchanged server-to-server over TLS with the client secret, and the ID token
 *   that comes back is checked for issuer, audience, expiry and nonce (OIDC Core 3.1.3.7:
 *   received directly from the token endpoint over TLS, so TLS authenticates the issuer).
 * - Only emails the provider vouches for are accepted:
 *     Google / Yahoo → email_verified must be true
 *     Microsoft      → personal accounts only (consumers tenant). Work/school tenants can
 *                      assert unverified emails ("nOAuth"), so they're refused.
 * - Accounts are found by provider + subject first, then by that verified email.
 *
 * A provider is switched on by setting its CLIENT_ID and CLIENT_SECRET env vars.
 */
import { createHash, randomBytes } from "node:crypto";
import { isDeployed, readCookie, safeEqual, signFor } from "./auth.js";

const MS_CONSUMERS_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";

export const PROVIDERS = {
  google: {
    label: "Google",
    env: "GOOGLE",
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    issuers: ["https://accounts.google.com", "accounts.google.com"],
    pkce: true,
    extraAuth: { prompt: "select_account" },
    emailOk: (c) => c.email_verified === true || c.email_verified === "true",
  },
  microsoft: {
    label: "Microsoft",
    hint: "Hotmail, Outlook, Live",
    env: "MICROSOFT",
    authorize: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    issuers: [`https://login.microsoftonline.com/${MS_CONSUMERS_TENANT}/v2.0`],
    pkce: true,
    extraAuth: { prompt: "select_account" },
    // Personal Microsoft accounts own their sign-in address; nothing from work/school tenants.
    emailOk: (c) => c.tid === MS_CONSUMERS_TENANT,
  },
  yahoo: {
    label: "Yahoo",
    hint: "Yahoo, ymail",
    env: "YAHOO",
    authorize: "https://api.login.yahoo.com/oauth2/request_auth",
    token: "https://api.login.yahoo.com/oauth2/get_token",
    issuers: ["https://api.login.yahoo.com", "https://login.yahoo.com"],
    pkce: false, // not advertised by Yahoo; state + nonce + client secret still apply
    basicAuth: true,
    emailOk: (c) => c.email_verified === true || c.email_verified === "true",
  },
};

const creds = (p) => ({ id: process.env[`${p.env}_CLIENT_ID`], secret: process.env[`${p.env}_CLIENT_SECRET`] });

/** Providers with credentials configured, for the sign-in buttons. */
export const enabledProviders = () =>
  Object.entries(PROVIDERS)
    .filter(([, p]) => creds(p).id && creds(p).secret)
    .map(([id, p]) => ({ id, label: p.label, hint: p.hint ?? null }));

export function providerOrNull(id) {
  const p = Object.hasOwn(PROVIDERS, id) ? PROVIDERS[id] : null;
  return p && creds(p).id && creds(p).secret ? p : null;
}

export const callbackUrl = (base, id) => `${base}/auth/${id}/callback`;

// ── Signed short-lived cookies ──────────────────────────────────────────────

const STATE_COOKIE = () => (isDeployed() ? "__Host-ccc_oauth" : "ccc_oauth");
const SIGNUP_COOKIE = () => (isDeployed() ? "__Host-ccc_signup" : "ccc_signup");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function seal(domain, payload) {
  const body = b64(payload);
  return `${body}.${signFor(domain, body)}`;
}

function unseal(domain, raw, now = Date.now()) {
  const [body, sig, extra] = String(raw ?? "").split(".");
  if (!body || !sig || extra !== undefined || raw.length > 4000) return null;
  if (!safeEqual(sig, signFor(domain, body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return p && typeof p.exp === "number" && p.exp > now ? p : null;
  } catch {
    return null;
  }
}

function cookie(name, value, maxAge) {
  const secure = isDeployed() ? "; Secure" : "";
  // Lax: sent on the top-level redirect back from the provider, never on cross-site posts.
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export const clearStateCookie = () => cookie(STATE_COOKIE(), "", 0);
export const clearSignupCookie = () => cookie(SIGNUP_COOKIE(), "", 0);

// ── Flow ─────────────────────────────────────────────────────────────────────

const rand = () => randomBytes(32).toString("base64url");

/** → { url, cookie } : where to send the browser, and the state cookie to set. */
export function beginAuth(id, base, { next = "/fantasy", now = Date.now() } = {}) {
  const p = providerOrNull(id);
  if (!p) return null;
  const state = rand();
  const nonce = rand();
  const verifier = p.pkce ? rand() : null;
  const params = new URLSearchParams({
    client_id: creds(p).id,
    redirect_uri: callbackUrl(base, id),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    ...(p.pkce ? { code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" } : {}),
    ...p.extraAuth,
  });
  const sealed = seal("oauth-state", { p: id, state, nonce, verifier, next, exp: now + 10 * 60 * 1000 });
  return { url: `${p.authorize}?${params}`, cookie: cookie(STATE_COOKIE(), sealed, 600) };
}

export class OAuthError extends Error {}

function decodeJwtPayload(jwt) {
  const parts = String(jwt ?? "").split(".");
  if (parts.length !== 3) throw new OAuthError("bad id_token");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

/**
 * Validate the callback and exchange the code.
 * → { provider, sub, email, name, next }  (email lower-cased and verified by the provider)
 */
export async function finishAuth(req, id, base, { now = Date.now() } = {}) {
  const p = providerOrNull(id);
  if (!p) throw new OAuthError("provider not enabled");
  const saved = unseal("oauth-state", readCookie(req, STATE_COOKIE()), now);
  const q = req.query ?? {};
  if (q.error) throw new OAuthError(`provider said ${String(q.error).slice(0, 40)}`);
  if (!saved || saved.p !== id || typeof q.state !== "string" || !safeEqual(q.state, saved.state)) {
    throw new OAuthError("state mismatch");
  }
  if (typeof q.code !== "string" || !q.code || q.code.length > 4096) throw new OAuthError("missing code");

  const { id: clientId, secret } = creds(p);
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code: q.code,
    redirect_uri: callbackUrl(base, id),
    ...(saved.verifier ? { code_verifier: saved.verifier } : {}),
    ...(p.basicAuth ? {} : { client_id: clientId, client_secret: secret }),
  });
  const headers = { "content-type": "application/x-www-form-urlencoded", accept: "application/json" };
  if (p.basicAuth) headers.authorization = `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`;
  const r = await fetch(p.token, { method: "POST", headers, body: form, signal: AbortSignal.timeout(10000) });
  const tok = await r.json().catch(() => ({}));
  if (!r.ok || !tok.id_token) throw new OAuthError(`token exchange failed (${r.status})`);

  const c = decodeJwtPayload(tok.id_token);
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!p.issuers.includes(c.iss)) throw new OAuthError("wrong issuer");
  if (!aud.includes(clientId) || (aud.length > 1 && c.azp !== clientId)) throw new OAuthError("wrong audience");
  if (!(Number(c.exp) * 1000 > now - 60_000)) throw new OAuthError("expired id_token");
  if (!c.nonce || !safeEqual(c.nonce, saved.nonce)) throw new OAuthError("nonce mismatch");
  if (!c.sub) throw new OAuthError("no subject");
  const email = String(c.email ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !p.emailOk(c)) throw new OAuthError("email not verified");

  const name = String(c.name || [c.given_name, c.family_name].filter(Boolean).join(" ") || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return { provider: id, sub: String(c.sub), email, name, next: saved.next };
}

// ── New member: provider sign-in done, still needs squad player + username ──

const SIGNUP_TTL_MS = 30 * 60 * 1000;

export const signupCookie = (who, now = Date.now()) =>
  cookie(SIGNUP_COOKIE(), seal("oauth-signup", { ...who, exp: now + SIGNUP_TTL_MS }), SIGNUP_TTL_MS / 1000);

/** → { provider, sub, email, name } or null */
export const readSignup = (req, now = Date.now()) => unseal("oauth-signup", readCookie(req, SIGNUP_COOKIE()), now);
