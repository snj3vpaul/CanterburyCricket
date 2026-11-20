// Google / Microsoft / Yahoo sign-in, end to end against local storage with a fake token endpoint.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

let handler;
const sentMail = [];
const ADMIN = "captain@canterbury.test";
const MS_CONSUMERS = "9188040d-6c67-4c5b-b112-36a304b66dad";

// The fake provider: the next token response's ID-token claims (or a full override).
let nextClaims = {};
let tokenRequests = [];
const realFetch = globalThis.fetch;
const jwt = (claims) =>
  [{ alg: "RS256" }, claims].map((p) => Buffer.from(JSON.stringify(p)).toString("base64url")).join(".") + ".sig";

before(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ccc-oauth-"));
  process.env.FANTASY_DATA_FILE = path.join(dir, "fantasy.json");
  process.env.ADMIN_EMAILS = `${ADMIN},backup@canterbury.test`;
  process.env.FANTASY_REGISTER_MIN_MS = "0";
  process.env.FANTASY_SITE_URL = "https://canterburycricketclub.com";
  delete process.env.SQUAD_API_URL;
  for (const p of ["GOOGLE", "MICROSOFT", "YAHOO"]) {
    process.env[`${p}_CLIENT_ID`] = `${p.toLowerCase()}-client`;
    process.env[`${p}_CLIENT_SECRET`] = `${p.toLowerCase()}-secret`;
  }
  Object.assign(process.env, { SMTP_HOST: "smtp.test", SMTP_USER: "u", SMTP_PASS: "p", MAIL_FROM: "club@test" });
  const { default: nodemailer } = await import("nodemailer");
  nodemailer.createTransport = () => ({ sendMail: async (m) => void sentMail.push(m) });
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (/oauth2\.googleapis\.com|login\.microsoftonline\.com|api\.login\.yahoo\.com/.test(u)) {
      tokenRequests.push({ url: u, headers: init.headers, body: new URLSearchParams(String(init.body)) });
      if (nextClaims === "fail") return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
      return new Response(JSON.stringify({ access_token: "a", id_token: jwt(nextClaims) }));
    }
    return realFetch(url, init);
  };
  ({ default: handler } = await import("../../fantasy.js"));
});

async function call(method, action, { body, cookies = [], query = {}, path: p } = {}) {
  const req = {
    method,
    url: p,
    query: { action, ...query },
    body,
    headers: {
      host: "canterburycricketclub.com",
      ...(method === "POST" ? { "content-type": "application/json", origin: "https://canterburycricketclub.com" } : {}),
      ...(cookies.length ? { cookie: cookies.join("; ") } : {}),
      "x-real-ip": "198.51.100.9",
    },
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    end() { return this; },
  };
  await handler(req, res);
  const raw = res.headers["set-cookie"];
  const set = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((c) => c.split(";")[0]).filter((c) => !c.endsWith("="));
  return { status: res.statusCode, body: res.body, location: res.headers.location, cookies: set };
}

const cookieNamed = (r, name) => r.cookies.find((c) => c.startsWith(`${name}=`));

/** Start a sign-in and come back from the provider with `claims` (nonce/aud/iss filled in). */
async function signIn(provider, claims, { tamper } = {}) {
  const start = await call("GET", "oauth-start", { query: { provider, next: "/fantasy" } });
  assert.equal(start.status, 302);
  const auth = new URL(start.location);
  const state = auth.searchParams.get("state");
  const nonce = auth.searchParams.get("nonce");
  const base = {
    google: { iss: "https://accounts.google.com", aud: "google-client" },
    microsoft: { iss: `https://login.microsoftonline.com/${MS_CONSUMERS}/v2.0`, aud: "microsoft-client", tid: MS_CONSUMERS },
    yahoo: { iss: "https://api.login.yahoo.com", aud: "yahoo-client" },
  }[provider];
  nextClaims = { ...base, nonce, exp: Math.floor(Date.now() / 1000) + 300, ...claims };
  const stateCookie = cookieNamed(start, "ccc_oauth");
  const q = { provider, code: "the-code", state, ...(tamper?.query ?? {}) };
  const cb = await call("GET", "oauth-callback", { query: q, cookies: tamper?.noCookie ? [] : [stateCookie] });
  return { start, auth, cb };
}

describe("sign in with Google / Microsoft / Yahoo", () => {
  let gurId;

  it("set up: squad players exist and the providers are offered", async () => {
    // The club account signs in with Google and is the moderator straight away (no squad claim).
    const { cb } = await signIn("google", { sub: "g-admin", email: ADMIN, email_verified: true, name: "Club Admin" });
    assert.equal(cb.location, "/fantasy");
    const admin = cookieNamed(cb, "ccc_member");
    assert.ok(admin);
    for (const name of ["Gurpreet Singh Sandhu", "Yash Khanna", "Mike Brown", "Pat Pending"]) {
      const r = await call("POST", "admin-add-player", { cookies: [admin], body: { name, role: "BATTER" } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
    }
    const opts = await call("GET", "register-options");
    assert.deepEqual(opts.body.providers.map((p) => p.id), ["google", "microsoft", "yahoo"]);
    gurId = opts.body.players.find((p) => p.name.startsWith("Gurpreet")).id;
  });

  it("the trip to Google carries state, nonce and PKCE; only http(s) site paths come back", async () => {
    const start = await call("GET", "oauth-start", { query: { provider: "google", next: "//evil.example" } });
    const auth = new URL(start.location);
    assert.equal(auth.origin + auth.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    assert.equal(auth.searchParams.get("redirect_uri"), "https://canterburycricketclub.com/auth/google/callback");
    assert.equal(auth.searchParams.get("scope"), "openid email profile");
    assert.equal(auth.searchParams.get("code_challenge_method"), "S256");
    assert.ok(auth.searchParams.get("state").length >= 40);
    assert.ok(auth.searchParams.get("nonce").length >= 40);
    // `next` is sealed in the cookie, not trusted from the callback; "//evil" was replaced
    const sealed = decodeURIComponent(cookieNamed(start, "ccc_oauth").split("=")[1]).split(".")[0];
    assert.equal(JSON.parse(Buffer.from(sealed, "base64url")).next, "/fantasy");
    const unknown = await call("GET", "oauth-start", { query: { provider: "myspace" } });
    assert.equal(unknown.location, "/member-login?oauth=unavailable");
  });

  it("a new player: provider sign-in → which squad player are you → admins emailed (no confirm-email step)", async () => {
    sentMail.length = 0;
    const { cb } = await signIn("google", { sub: "g-gur", email: "Guri@Gmail.com", email_verified: true, name: "Gurpreet Sandhu" });
    assert.equal(cb.location, "/member-login?oauth=signup");
    assert.equal(cookieNamed(cb, "ccc_member"), undefined, "no session yet");
    const signup = cookieNamed(cb, "ccc_signup");
    assert.ok(signup);
    // the code was exchanged with PKCE and the client secret
    const req = tokenRequests.at(-1);
    assert.ok(req.body.get("code_verifier"));
    assert.equal(req.body.get("client_secret"), "google-secret");

    const info = await call("GET", "oauth-signup", { cookies: [signup] });
    assert.deepEqual(info.body, { email: "guri@gmail.com", name: "Gurpreet Sandhu", provider: "Google" });

    // still the same rules: name must match the squad sheet, username must be fair
    const wrong = await call("POST", "oauth-register", { cookies: [signup], body: { name: "Someone Else", playerId: gurId, username: "guri" } });
    assert.equal(wrong.status, 400);
    const ok = await call("POST", "oauth-register", { cookies: [signup], body: { name: "Gurpreet Sandhu", playerId: gurId, username: "GuriSixes" } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.status, "PENDING");
    assert.equal(cookieNamed(ok, "ccc_member"), undefined);
    assert.ok(!sentMail.some((m) => /confirm your email/i.test(m.subject)), "provider already proved the email");
    const mail = sentMail.find((m) => /approve/i.test(m.subject));
    assert.match(mail.text, /squad player: Gurpreet Singh Sandhu/);
    assert.match(mail.text, /matches the squad sheet/);

    // signing in again while waiting → told to wait
    const again = await signIn("google", { sub: "g-gur", email: "guri@gmail.com", email_verified: true });
    assert.equal(again.cb.location, "/member-login?oauth=pending");

    // approve, then the next Google sign-in goes straight in
    const admin = (await signIn("google", { sub: "g-admin", email: ADMIN, email_verified: true })).cb;
    const members = (await call("GET", "admin", { cookies: [cookieNamed(admin, "ccc_member")] })).body.members;
    const gur = members.find((m) => m.email === "guri@gmail.com");
    assert.equal((await call("POST", "admin-approve-member", { cookies: [cookieNamed(admin, "ccc_member")], body: { userId: gur.id } })).status, 200);
    const inNow = await signIn("google", { sub: "g-gur", email: "guri@gmail.com", email_verified: true });
    assert.equal(inNow.cb.location, "/fantasy");
    const me = await call("GET", "me", { cookies: [cookieNamed(inNow.cb, "ccc_member")] });
    assert.equal(me.body.member.name, "GuriSixes");

    // a Google-only account has no password to guess
    const pw = await call("POST", "login", { body: { email: "guri@gmail.com", password: "anything-at-all-1" } });
    assert.equal(pw.status, 401);
  });

  it("an existing email/password member is linked by their provider-verified email", async () => {
    const reg = await call("POST", "register", {
      body: { name: "Yash Khanna", email: "yash@ymail.com", password: "long-on-boundary-9", playerId: (await call("GET", "register-options")).body.players.find((p) => p.name === "Yash Khanna").id, username: "yashk" },
    });
    assert.equal(reg.status, 200, JSON.stringify(reg.body));
    // never clicked the confirm link: signing in with Yahoo proves the inbox and sends them for approval
    sentMail.length = 0;
    const { cb } = await signIn("yahoo", { sub: "y-1", email: "yash@ymail.com", email_verified: true });
    assert.equal(cb.location, "/member-login?oauth=pending");
    assert.ok(sentMail.some((m) => /approve/i.test(m.subject)));
    // Yahoo: client secret via HTTP Basic, no PKCE
    const req = tokenRequests.at(-1);
    assert.match(req.headers.authorization, /^Basic /);
    assert.equal(req.body.get("code_verifier"), null);
    assert.equal(req.body.get("client_secret"), null);
  });

  it("Microsoft: personal accounts only; work/school tenants can't vouch for an email", async () => {
    const work = await signIn("microsoft", { sub: "m-x", email: "guri@gmail.com", tid: "72f988bf-0000-0000-0000-000000000000", iss: "https://login.microsoftonline.com/72f988bf-0000-0000-0000-000000000000/v2.0" });
    assert.match(work.cb.location, /oauth=(error|unverified)/);
    assert.equal(cookieNamed(work.cb, "ccc_member"), undefined);
    const personal = await signIn("microsoft", { sub: "m-mike", email: "mike@hotmail.com", name: "Mike Brown" });
    assert.equal(personal.cb.location, "/member-login?oauth=signup");
  });

  it("refuses forged, replayed or unverified sign-ins", async () => {
    const bad = [
      ["state mismatch", "google", { sub: "x", email: "x@gmail.com", email_verified: true }, { query: { state: "forged" } }],
      ["no state cookie (other browser)", "google", { sub: "x", email: "x@gmail.com", email_verified: true }, { noCookie: true }],
      ["wrong nonce", "google", { sub: "x", email: "x@gmail.com", email_verified: true, nonce: "replayed" }],
      ["wrong audience", "google", { sub: "x", email: "x@gmail.com", email_verified: true, aud: "someone-else" }],
      ["wrong issuer", "google", { sub: "x", email: "x@gmail.com", email_verified: true, iss: "https://evil.example" }],
      ["expired token", "google", { sub: "x", email: "x@gmail.com", email_verified: true, exp: 1000 }],
      ["unverified email", "google", { sub: "x", email: ADMIN, email_verified: false }],
      ["provider error", "google", { sub: "x", email: "x@gmail.com", email_verified: true }, { query: { error: "access_denied" } }],
    ];
    for (const [why, provider, claims, tamper] of bad) {
      const { cb } = await signIn(provider, claims, { tamper });
      assert.match(cb.location, /^\/member-login\?oauth=(error|unverified)$/, why);
      assert.equal(cookieNamed(cb, "ccc_member"), undefined, why);
      assert.equal(cookieNamed(cb, "ccc_signup"), undefined, why);
    }
    nextClaims = "fail";
    const start = await call("GET", "oauth-start", { query: { provider: "google" } });
    const state = new URL(start.location).searchParams.get("state");
    const cb = await call("GET", "oauth-callback", { query: { provider: "google", code: "c", state }, cookies: [cookieNamed(start, "ccc_oauth")] });
    assert.equal(cb.location, "/member-login?oauth=error");
  });

  it("a sign-up cookie can't be forged or used to grab someone else's email", async () => {
    const forged = await call("POST", "oauth-register", { cookies: ["ccc_signup=eyJlbWFpbCI6ImFkbWluQHgifQ.fake"], body: { name: "Pat Pending", playerId: "x", username: "patp" } });
    assert.equal(forged.status, 401);
    const none = await call("POST", "oauth-register", { body: { name: "Pat Pending", playerId: "x", username: "patp" } });
    assert.equal(none.status, 401);
  });
});
