/**
 * /api/fantasy?action=…  — the whole member + fantasy API in ONE Vercel function
 * (keeps the project well under the Hobby plan's function limit).
 *
 * Public:  GET me · POST register · POST login · POST logout
 *          GET decision · POST decide   (signed Approve/Reject links from admin emails)
 * Member:  GET state · POST predict
 * Admin:   GET admin · POST admin-approve-member · admin-reject-member · admin-create-match · admin-set-xi · admin-add-player
 *          · admin-import-squad · admin-allow-emails · admin-results
 *          · admin-read-scorecard (CricHeroes PDF/screenshots → draft stats; saves nothing)
 */
import { randomUUID } from "node:crypto";
import {
  addPlayerSchema,
  allowedEmailsSchema,
  createMatchSchema,
  issuesOf,
  loginSchema,
  matchResultSchema,
  normalizeSheetRole,
  playingXISchema,
  predictionSchema,
  registerSchema,
  scorecardUploadSchema,
} from "../src/fantasy/shared/validation.js";
import { deriveFantasyStats } from "../src/fantasy/shared/scorecard.js";
import { extractScorecard } from "./_lib/fantasy/extract.js";
import { notifyAdminsOfRegistration, notifyMemberApproved } from "./_lib/fantasy/notify.js";
import { z } from "zod";
import { ConflictError, StorageMissingError, getState, mutate } from "./_lib/fantasy/store.js";
import {
  adminEmails,
  audit,
  clearCookie,
  clientIp,
  currentUser,
  hashPassword,
  makeDecisionToken,
  makeToken,
  maskEmail,
  needsRehash,
  parseDecisionToken,
  sessionCookie,
  throttle,
  verifyPassword,
} from "./_lib/fantasy/auth.js";
import {
  LedgerError,
  addPlayer,
  adminView,
  allowEmails,
  createMatch,
  decideMember,
  importPlayers,
  memberSummary,
  memberView,
  processMatchResults,
  registerUser,
  setPlayingXI,
  submitPrediction,
} from "./_lib/fantasy/ledger.js";

const ctx = () => ({ now: new Date(), newId: () => randomUUID() });

function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (!r.success) throw new LedgerError(issuesOf(r.error));
  return r.data;
}

/**
 * CSRF defence for every write (on top of the SameSite=Lax cookie):
 *  - the body must be JSON, so a cross-site page can't send it without a CORS preflight we never approve;
 *  - browsers' Sec-Fetch-Site must not say "cross-site"/"same-site";
 *  - when a browser sends Origin, it must be this host.
 */
function writeAllowed(req) {
  const type = String(req.headers["content-type"] || "");
  if (!type.toLowerCase().startsWith("application/json")) return false;
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * The site's own address, for links in emails. Taken from configuration or Vercel's system
 * variables, never from the request's Host header, so nobody can make the Approve/Reject
 * email point at a look-alike site (host-header poisoning).
 */
function siteUrl(req) {
  const env = process.env;
  if (env.FANTASY_SITE_URL) return env.FANTASY_SITE_URL.replace(/\/$/, "");
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_BRANCH_URL || env.VERCEL_URL) return `https://${env.VERCEL_BRANCH_URL || env.VERCEL_URL}`;
  return `http://${req.headers.host}`; // local development only
}

const memberIdSchema = z.object({ userId: z.string().min(1).max(80) });

const PENDING_MESSAGE = "Your registration has been sent to the club admins. You can sign in once they approve it.";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Every non-admin registration answers in at least this long, whether or not the email was new.
const REGISTER_MIN_MS = Number(process.env.FANTASY_REGISTER_MIN_MS ?? 2500);
/** Make two code paths take the same time, so timing can't reveal which one ran. */
async function padTo(startedAt, ms) {
  const left = ms - (Date.now() - startedAt);
  if (left > 0) await sleep(left);
}

async function requireMember(req) {
  const state = await getState();
  const user = currentUser(req, state);
  if (!user) throw new LedgerError("Please sign in.", 401);
  return { state, user };
}

async function requireAdmin(req) {
  const { state, user } = await requireMember(req);
  if (user.role !== "ADMIN") throw new LedgerError("Admins only.", 403);
  return { state, user };
}

// ── Handlers ─────────────────────────────────────────────────────────────────

const GET = {
  async me(req) {
    const state = await getState();
    const user = currentUser(req, state);
    return { member: user ? memberSummary(state, user) : null };
  },

  async state(req) {
    const { state, user } = await requireMember(req);
    return memberView(state, user, new Date());
  },

  async admin(req) {
    const { state } = await requireAdmin(req);
    return adminView(state);
  },

  /** What an email Approve/Reject link is for. Read-only: GETs never change anything. */
  async decision(req) {
    const t = parseDecisionToken(req.query?.t);
    if (t.error) throw new LedgerError(t.error === "expired" ? LINK_EXPIRED : LINK_INVALID, 400);
    const state = await getState();
    const user = state.users.find((u) => u.id === t.userId);
    if (!user) throw new LedgerError("That registration no longer exists.", 404);
    return { decision: t.decision, name: user.name, email: user.email, status: user.status ?? "ACTIVE" };
  },
};

const LINK_EXPIRED = "This link has expired (links last 7 days). Decide on the admin page instead.";
const LINK_INVALID = "This link isn't valid. Decide on the admin page instead.";

const POST = {
  async register(req, res) {
    const startedAt = Date.now();
    const input = parse(registerSchema, req.body);
    const ip = clientIp(req);
    // 20 per IP per 10 minutes: enough for a whole squad registering on clubhouse Wi-Fi.
    if (!(await throttle(`register:${ip}`, 20))) {
      audit("register.throttled", { ip });
      throw new LedgerError("Too many attempts. Try again in a few minutes.", 429);
    }
    const passwordHash = await hashPassword(input.password);
    const id = randomUUID();
    let next;
    try {
      next = await mutate((s) => registerUser(s, { ...input, id, passwordHash }, { ...ctx(), adminEmails: adminEmails() }));
    } catch (e) {
      // Email already registered: answer exactly like a new registration (same message, same timing),
      // so this form can't be used to find out who is a member. Nothing is changed or emailed.
      if (e instanceof LedgerError && e.status === 409) {
        audit("register.duplicate", { email: maskEmail(input.email), ip });
        await padTo(startedAt, REGISTER_MIN_MS);
        return { pending: true, message: PENDING_MESSAGE };
      }
      throw e;
    }
    const user = next.users.find((u) => u.id === id);
    audit("register", { email: maskEmail(user.email), status: user.status, ip });
    if (user.status === "PENDING") {
      const base = siteUrl(req);
      await notifyAdminsOfRegistration({
        admins: adminEmails(),
        name: user.name,
        email: user.email,
        approveUrl: `${base}/fantasy/decide?t=${makeDecisionToken(user.id, "APPROVE")}`,
        rejectUrl: `${base}/fantasy/decide?t=${makeDecisionToken(user.id, "REJECT")}`,
        adminUrl: `${base}/fantasy/admin`,
      });
      await padTo(startedAt, REGISTER_MIN_MS);
      return { pending: true, message: PENDING_MESSAGE };
    }
    res.setHeader("Set-Cookie", sessionCookie(makeToken(user), user));
    return { member: memberSummary(next, user) };
  },

  async login(req, res) {
    const { email, password } = parse(loginSchema, req.body);
    const ip = clientIp(req);
    if (!(await throttle(`login:${email}`)) || !(await throttle(`login-ip:${ip}`, 30))) {
      audit("login.throttled", { email: maskEmail(email), ip });
      throw new LedgerError("Too many attempts. Try again in a few minutes.", 429);
    }
    const state = await getState();
    const user = state.users.find((u) => u.email === email);
    const ok = await verifyPassword(password, user?.passwordHash);
    if (!user || !ok) {
      audit("login.failed", { email: maskEmail(email), ip });
      throw new LedgerError("Incorrect email or password.", 401);
    }
    if (user.status === "PENDING") {
      throw new LedgerError("Your registration is waiting for approval by a club admin. You'll get an email once it's approved.", 403);
    }
    if (user.status === "REJECTED") {
      throw new LedgerError("This registration wasn't approved. If you play for Canterbury, contact the club.", 403);
    }
    // Upgrade hashes made with older, weaker scrypt settings now that we know the password.
    if (needsRehash(user.passwordHash)) {
      const upgraded = await hashPassword(password);
      await mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, passwordHash: upgraded } : u)) }));
    }
    audit("login", { email: maskEmail(email), role: user.role, ip });
    res.setHeader("Set-Cookie", sessionCookie(makeToken(user), user));
    return { member: memberSummary(state, user) };
  },

  /** Signs out on the server too: the old cookie stops working even if someone copied it. */
  async logout(req, res) {
    res.setHeader("Set-Cookie", clearCookie());
    const user = currentUser(req, await getState());
    if (user) {
      await mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, sessionVersion: u.sessionVersion + 1 } : u)) }));
      audit("logout", { email: maskEmail(user.email) });
    }
    return { ok: true };
  },

  async predict(req) {
    const { user } = await requireMember(req);
    const input = parse(predictionSchema, req.body);
    const next = await mutate((s) => submitPrediction(s, user.id, input, ctx()));
    return { ok: true, message: "Prediction saved. Good luck!", ...memberView(next, next.users.find((u) => u.id === user.id), new Date()) };
  },

  /**
   * Confirm button on the email-link page. The signed token is the authority (it was
   * emailed only to ADMIN_EMAILS); it acts only while the registration is still pending,
   * so a replayed or forwarded link can't undo a later decision.
   */
  async decide(req) {
    if (!(await throttle(`decide:${clientIp(req)}`, 30))) throw new LedgerError("Too many attempts. Try again in a few minutes.", 429);
    const t = parseDecisionToken(req.body?.t);
    if (t.error) {
      audit("decide.bad-link", { reason: t.error, ip: clientIp(req) });
      throw new LedgerError(t.error === "expired" ? LINK_EXPIRED : LINK_INVALID, 400);
    }
    const current = (await getState()).users.find((u) => u.id === t.userId);
    if (!current) throw new LedgerError("That registration no longer exists.", 404);
    if ((current.status ?? "ACTIVE") !== "PENDING") {
      return { ok: true, already: true, status: current.status ?? "ACTIVE", name: current.name };
    }
    const next = await mutate((s) => {
      const u = s.users.find((x) => x.id === t.userId);
      if ((u?.status ?? "ACTIVE") !== "PENDING") return s; // another admin got there first
      return decideMember(s, t.userId, t.decision, { ...ctx(), adminId: "email-link" });
    });
    const member = next.users.find((u) => u.id === t.userId);
    audit("member.decided", { via: "email-link", decision: t.decision, email: maskEmail(member.email), ip: clientIp(req) });
    if (t.decision === "APPROVE" && member.status === "ACTIVE") {
      await notifyMemberApproved({ name: member.name, email: member.email, siteUrl: siteUrl(req) });
    }
    return { ok: true, status: member.status, name: member.name };
  },

  async "admin-approve-member"(req) {
    const { user: admin } = await requireAdmin(req);
    const { userId } = parse(memberIdSchema, req.body);
    const next = await mutate((s) => decideMember(s, userId, "APPROVE", { ...ctx(), adminId: admin.id }));
    const member = next.users.find((u) => u.id === userId);
    audit("member.decided", { via: "admin-page", decision: "APPROVE", email: maskEmail(member.email), by: maskEmail(admin.email) });
    await notifyMemberApproved({ name: member.name, email: member.email, siteUrl: siteUrl(req) });
    return { ok: true, message: `${member.name} approved.`, ...adminView(next) };
  },

  async "admin-reject-member"(req) {
    const { user: admin } = await requireAdmin(req);
    const { userId } = parse(memberIdSchema, req.body);
    const next = await mutate((s) => decideMember(s, userId, "REJECT", { ...ctx(), adminId: admin.id }));
    const member = next.users.find((u) => u.id === userId);
    audit("member.decided", { via: "admin-page", decision: "REJECT", email: maskEmail(member.email), by: maskEmail(admin.email) });
    return { ok: true, message: `${member.name}'s registration was rejected.`, ...adminView(next) };
  },

  async "admin-allow-emails"(req) {
    await requireAdmin(req);
    const { emails } = parse(allowedEmailsSchema, req.body);
    const next = await mutate((s) => allowEmails(s, emails, ctx()));
    return { ok: true, message: `${emails.length} email${emails.length === 1 ? "" : "s"} whitelisted.`, ...adminView(next) };
  },

  async "admin-add-player"(req) {
    await requireAdmin(req);
    const input = parse(addPlayerSchema, req.body);
    const id = randomUUID();
    const next = await mutate((s) => addPlayer(s, { ...input, id }));
    return { ok: true, message: `${input.name} added to the squad.`, ...adminView(next) };
  },

  async "admin-import-squad"(req) {
    await requireAdmin(req);
    const base = process.env.SQUAD_API_URL;
    const key = process.env.SQUAD_API_KEY;
    if (!base || !key) throw new LedgerError("SQUAD_API_URL / SQUAD_API_KEY aren't set.", 500);
    const url = new URL(base);
    url.searchParams.set("key", key);
    const json = await (await fetch(url)).json();
    if (!json?.ok || !Array.isArray(json.data)) throw new LedgerError("The squad sheet didn't return any players.", 502);
    const rows = json.data
      .map((r) => ({ name: String(r["Full Name"] ?? "").trim(), role: normalizeSheetRole(r["Playing Role"]) }))
      .filter((r) => r.name.length >= 2);
    const next = await mutate((s) => importPlayers(s, rows, () => randomUUID()));
    return { ok: true, message: `Imported ${rows.length} players from the club squad sheet.`, ...adminView(next) };
  },

  async "admin-create-match"(req) {
    await requireAdmin(req);
    const input = parse(createMatchSchema, req.body);
    const id = randomUUID();
    const next = await mutate((s) => createMatch(s, { ...input, id, date: new Date(input.date).toISOString() }, ctx()));
    return { ok: true, matchId: id, message: "Match created — now pick the Playing XI.", ...adminView(next) };
  },

  async "admin-set-xi"(req) {
    await requireAdmin(req);
    const input = parse(playingXISchema, req.body);
    const next = await mutate((s) => setPlayingXI(s, input));
    return { ok: true, message: "Playing XI saved.", ...adminView(next) };
  },

  /**
   * Read a CricHeroes scorecard and return a DRAFT for the post-match form.
   * Nothing is saved: the admin reviews the numbers and taps "Save & score".
   */
  async "admin-read-scorecard"(req) {
    const { state } = await requireAdmin(req);
    const input = parse(scorecardUploadSchema, req.body);
    const match = state.matches.find((m) => m.id === input.matchId);
    if (!match) throw new LedgerError("Match not found.", 404);
    if (match.playingXI.length !== 11) throw new LedgerError("Set the Playing XI before reading the scorecard.");
    if (!(await throttle(`scorecard:${input.matchId}`, 20, 3600))) throw new LedgerError("Too many scorecard reads for this match. Try again later.", 429);

    const xi = match.playingXI.map((id) => state.players.find((p) => p.id === id)).filter(Boolean).map(({ id, name }) => ({ id, name }));
    const scorecard = await extractScorecard(input);
    return { ok: true, scorecard, draft: deriveFantasyStats(scorecard, xi) };
  },

  async "admin-results"(req) {
    await requireAdmin(req);
    const input = parse(matchResultSchema, req.body);
    const next = await mutate((s) => processMatchResults(s, input, ctx()));
    const scored = next.predictions.filter((p) => p.matchId === input.matchId).length;
    return {
      ok: true,
      message: `Result saved. Scored ${scored} prediction${scored === 1 ? "" : "s"}.`,
      ...adminView(next),
    };
  },
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const action = String(req.query?.action || "");
  try {
    const table = req.method === "GET" ? GET : req.method === "POST" ? POST : null;
    if (!table) throw new LedgerError("Method not allowed.", 405);
    if (req.method === "POST" && !writeAllowed(req)) {
      audit("request.blocked", { action, reason: "csrf", ip: clientIp(req) });
      throw new LedgerError("Cross-site request blocked.", 403);
    }
    const fn = Object.hasOwn(table, action) ? table[action] : null;
    if (!fn) throw new LedgerError("Unknown action.", 404);
    return res.status(200).json(await fn(req, res));
  } catch (e) {
    if (e instanceof LedgerError) return res.status(e.status).json({ ok: false, errors: e.errors });
    if (e instanceof ConflictError) return res.status(409).json({ ok: false, errors: [e.message] });
    if (e instanceof StorageMissingError) return res.status(503).json({ ok: false, errors: [e.message] });
    console.error("[fantasy]", e);
    return res.status(500).json({ ok: false, errors: ["Something went wrong. Please try again."] });
  }
}
