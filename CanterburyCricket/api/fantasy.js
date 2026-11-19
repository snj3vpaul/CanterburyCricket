/**
 * /api/fantasy?action=…  — the whole member + fantasy API in ONE Vercel function
 * (keeps the project well under the Hobby plan's function limit).
 *
 * Public:  GET me · POST register · POST login · POST logout
 * Member:  GET state · POST predict
 * Admin:   GET admin · POST admin-create-match · admin-set-xi · admin-add-player
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
import { ConflictError, StorageMissingError, getState, mutate } from "./_lib/fantasy/store.js";
import {
  adminEmails,
  clearCookie,
  currentUser,
  hashPassword,
  makeToken,
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

/** Reject cross-site writes: when a browser sends Origin, it must be this host. */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers["x-forwarded-host"] || req.headers.host);
  } catch {
    return false;
  }
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
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
};

const POST = {
  async register(req, res) {
    const input = parse(registerSchema, req.body);
    if (!(await throttle(`register:${clientIp(req)}`, 10))) throw new LedgerError("Too many attempts. Try again in a few minutes.", 429);
    const passwordHash = await hashPassword(input.password);
    const id = randomUUID();
    const next = await mutate((s) => registerUser(s, { ...input, id, passwordHash }, { ...ctx(), adminEmails: adminEmails() }));
    const user = next.users.find((u) => u.id === id);
    res.setHeader("Set-Cookie", sessionCookie(makeToken(user)));
    return { member: memberSummary(next, user) };
  },

  async login(req, res) {
    const { email, password } = parse(loginSchema, req.body);
    if (!(await throttle(`login:${email}`)) || !(await throttle(`login-ip:${clientIp(req)}`, 30))) {
      throw new LedgerError("Too many attempts. Try again in a few minutes.", 429);
    }
    const state = await getState();
    const user = state.users.find((u) => u.email === email);
    const ok = await verifyPassword(password, user?.passwordHash);
    if (!user || !ok) throw new LedgerError("Incorrect email or password.", 401);
    res.setHeader("Set-Cookie", sessionCookie(makeToken(user)));
    return { member: memberSummary(state, user) };
  },

  async logout(_req, res) {
    res.setHeader("Set-Cookie", clearCookie());
    return { ok: true };
  },

  async predict(req) {
    const { user } = await requireMember(req);
    const input = parse(predictionSchema, req.body);
    const next = await mutate((s) => submitPrediction(s, user.id, input, ctx()));
    return { ok: true, message: "Prediction saved. Good luck!", ...memberView(next, next.users.find((u) => u.id === user.id), new Date()) };
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
  const action = String(req.query?.action || "");
  try {
    const table = req.method === "GET" ? GET : req.method === "POST" ? POST : null;
    if (!table) throw new LedgerError("Method not allowed.", 405);
    if (req.method === "POST" && !sameOrigin(req)) throw new LedgerError("Cross-site request blocked.", 403);
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
