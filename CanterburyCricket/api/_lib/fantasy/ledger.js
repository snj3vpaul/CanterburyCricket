/**
 * Fantasy league state transitions — pure functions: (state, input, ctx) => nextState.
 * They never do I/O, so store.mutate() can safely retry them, and they're easy to test.
 * Inputs are already zod-validated by api/fantasy.js; these functions enforce the
 * rules that need the current state (whitelist, Playing XI, lock time, …).
 */
import { PICK_COUNT, XI_SIZE, scorePrediction } from "../../../src/fantasy/shared/scoring.js";
import { compositionErrors, namesMatch, usernameProblems } from "../../../src/fantasy/shared/validation.js";

export class LedgerError extends Error {
  constructor(errors, status = 400, code = undefined) {
    super(Array.isArray(errors) ? errors[0] : errors);
    this.code = code;
    this.errors = Array.isArray(errors) ? errors : [errors];
    this.status = status;
  }
}

export const isPredictionOpen = (match, now) => match.status === "UPCOMING" && new Date(match.predictionsLockAt) > now;

const byId = (list, id) => list.find((x) => x.id === id);

function findMatch(state, matchId) {
  const match = byId(state.matches, matchId);
  if (!match) throw new LedgerError("Match not found.", 404);
  return match;
}

// ── Members ──────────────────────────────────────────────────────────────────
//
// Account lifecycle:  UNVERIFIED --(clicks email link)--> PENDING --(admin approves)--> ACTIVE
//                                                     \--> ACTIVE   (ADMIN_EMAILS / pre-approved)
//                     PENDING/ACTIVE --(admin rejects / removes)--> REJECTED
// Every member except the club moderator account claims exactly one squad player. A squad
// player can belong to only one approved account, and the typed full name must match the sheet.

/**
 * The club's shared admin account is the FIRST address in ADMIN_EMAILS (cricketcanterbury@gmail.com).
 * It moderates and doesn't play: shown as "ADMIN", no squad player, no username.
 */
const clubAccountEmail = () => (process.env.ADMIN_EMAILS || "").split(",")[0].trim().toLowerCase();
export const isClubAccountEmail = (email) => Boolean(clubAccountEmail()) && email === clubAccountEmail();
export const isClubAccount = (user) => isClubAccountEmail(user.email);
/** What other members see: "ADMIN" for the club account, otherwise the chosen username. */
export const displayName = (user) => (isClubAccount(user) ? "ADMIN" : user.username || user.name);

/** Account status. Older records without a status are treated as ACTIVE. */
export const statusOf = (user) => user.status ?? "ACTIVE";
export const isActive = (user) => statusOf(user) === "ACTIVE";
const counts = (user) => statusOf(user) !== "REJECTED"; // holds its username / can hold a claim

const UNVERIFIED_TTL_MS = 48 * 60 * 60 * 1000;
/** Registrations never confirmed by email are dropped after 48h (frees the username and email). */
const purgeStale = (state, now) => ({
  ...state,
  users: state.users.filter((u) => statusOf(u) !== "UNVERIFIED" || now - new Date(u.createdAt) < UNVERIFIED_TTL_MS),
});

/** The approved account (if any) that owns this squad player, other than `exceptUserId`. */
export const claimOwner = (state, playerId, exceptUserId) =>
  state.users.find((u) => u.playerId === playerId && u.id !== exceptUserId && isActive(u)) ?? null;

/** Squad players nobody has claimed with an approved account yet. */
export const claimablePlayers = (state) =>
  state.players
    .filter((p) => p.isActive && !claimOwner(state, p.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ id: p.id, name: p.name.trim(), role: p.role, jersey: p.jersey ?? "" }));

/** Validate a squad claim + username for `userId` (null for a new account). Returns the player. */
function checkIdentity(state, { name, playerId, username }, userId) {
  const player = state.players.find((p) => p.id === playerId && p.isActive);
  if (!player) throw new LedgerError("Pick which Canterbury squad player you are.");
  if (!namesMatch(name, player.name)) {
    throw new LedgerError(
      `Your full name doesn't match the squad sheet for that player. Use the name the club has for you (middle names optional).`,
    );
  }
  if (claimOwner(state, player.id, userId)) {
    throw new LedgerError("That squad player already has an account. If that's you, contact the club.", 409);
  }
  const others = state.players.filter((p) => p.id !== player.id).map((p) => p.name);
  const problems = usernameProblems(username, { otherSquadNames: others });
  if (problems.length) throw new LedgerError(problems);
  const lower = username.toLowerCase();
  if (state.users.some((u) => u.id !== userId && counts(u) && u.username?.toLowerCase() === lower)) {
    throw new LedgerError("That username is taken. Pick another.", 409);
  }
  return player;
}

/**
 * Anyone can register, but nothing happens until they confirm their email (UNVERIFIED).
 * Players must claim their squad player (name must match the sheet) and pick a unique
 * username. The club moderator account (first ADMIN_EMAILS address) doesn't play.
 */
export function registerUser(state, { id, name, email, passwordHash, playerId, username, identity = null }, { now }) {
  state = purgeStale(state, now);
  // Identity first, so its errors say nothing about whether the email is registered.
  const club = isClubAccountEmail(email);
  const player = club ? null : checkIdentity(state, { name, playerId, username }, null);
  if (state.users.some((u) => u.email === email)) {
    throw new LedgerError("An account with this email already exists. Try signing in.", 409, "DUPLICATE_EMAIL");
  }
  const user = {
    id,
    name,
    email,
    passwordHash, // null for accounts that only sign in with Google/Microsoft/Yahoo
    identities: identity ? [identity] : [],
    username: club ? null : username,
    playerId: player?.id ?? null,
    role: "MEMBER", // decided when the email is confirmed
    status: "UNVERIFIED",
    totalFantasyPoints: 0,
    sessionVersion: 1,
    createdAt: now.toISOString(),
  };
  return { ...state, users: [...state.users, user] };
}

/**
 * The owner clicked the link in their inbox. ADMIN_EMAILS and pre-approved emails become
 * ACTIVE now; everyone else waits for an admin (PENDING). No-op if already confirmed.
 */
export function verifyEmail(state, userId, { adminEmails, now }) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new LedgerError("That registration no longer exists. Please register again.", 404);
  if (statusOf(user) !== "UNVERIFIED") return state;
  const isAdmin = adminEmails.includes(user.email);
  const preApproved = state.allowedEmails.some((a) => a.email === user.email);
  // A pre-approval never overrides a squad player someone else already holds.
  const conflict = user.playerId && claimOwner(state, user.playerId, user.id);
  const active = isAdmin || (preApproved && !conflict);
  const stamp = now.toISOString();
  const next = {
    ...user,
    emailVerifiedAt: stamp,
    role: isAdmin ? "ADMIN" : "MEMBER",
    status: active ? "ACTIVE" : "PENDING",
    ...(active ? { approvedAt: stamp, approvedBy: isAdmin ? "admin-email" : "pre-approved" } : {}),
  };
  return { ...state, users: state.users.map((u) => (u.id === userId ? next : u)) };
}

/** The account linked to this Google/Microsoft/Yahoo login, if any. */
export const findByIdentity = (state, provider, sub) =>
  state.users.find((u) => (u.identities ?? []).some((i) => i.provider === provider && i.sub === sub)) ?? null;

/** Remember a provider login on an account (found by its provider-verified email). */
export function linkIdentity(state, userId, identity) {
  return {
    ...state,
    users: state.users.map((u) =>
      u.id === userId && !(u.identities ?? []).some((i) => i.provider === identity.provider && i.sub === identity.sub)
        ? { ...u, identities: [...(u.identities ?? []), identity] }
        : u,
    ),
  };
}

/** For accounts created before squad claims existed: claim a squad player and a username. */
export function completeProfile(state, userId, { playerId, username }, { now }) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new LedgerError("Account not found.", 404);
  if (isClubAccount(user)) throw new LedgerError("The club moderator account doesn't claim a squad player.");
  const player = checkIdentity(state, { name: user.name, playerId, username }, user.id);
  const next = { ...user, playerId: player.id, username, profileCompletedAt: now.toISOString() };
  return { ...state, users: state.users.map((u) => (u.id === userId ? next : u)) };
}

/** Admin decision on a registration: APPROVE → ACTIVE, REJECT → REJECTED (can be approved later). */
export function decideMember(state, userId, decision, { now, adminId }) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new LedgerError("Member not found.", 404);
  if (user.role === "ADMIN") throw new LedgerError("Admin accounts can't be approved or rejected here.");
  if (statusOf(user) === "UNVERIFIED") throw new LedgerError("They haven't confirmed their email yet.", 409);
  if (decision === "APPROVE" && user.playerId) {
    const owner = claimOwner(state, user.playerId, user.id);
    if (owner) {
      const who = state.players.find((p) => p.id === user.playerId)?.name ?? "this squad player";
      throw new LedgerError(`${who} already belongs to @${owner.username ?? owner.name}. Reject one of them first.`, 409);
    }
  }
  const stamp = now.toISOString();
  const next =
    decision === "APPROVE"
      ? { ...user, status: "ACTIVE", approvedAt: stamp, approvedBy: adminId }
      : { ...user, status: "REJECTED", rejectedAt: stamp, rejectedBy: adminId, sessionVersion: user.sessionVersion + 1 };
  return { ...state, users: state.users.map((u) => (u.id === userId ? next : u)) };
}

export function allowEmails(state, emails, { now }) {
  const existing = new Set(state.allowedEmails.map((a) => a.email));
  const added = emails.filter((e) => !existing.has(e)).map((email) => ({ email, role: "MEMBER", addedAt: now.toISOString() }));
  return { ...state, allowedEmails: [...state.allowedEmails, ...added] };
}

// ── Squad & fixtures ─────────────────────────────────────────────────────────

export function addPlayer(state, { id, name, role }) {
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    throw new LedgerError(`${name} is already in the squad.`, 409);
  }
  return { ...state, players: [...state.players, { id, name, role, isActive: true }] };
}

/** Merge players from the club squad sheet by name: new names are added, existing roles refreshed. */
export function importPlayers(state, rows, newId, { now } = {}) {
  const players = state.players.map((p) => ({ ...p }));
  const index = new Map(players.map((p) => [p.name.toLowerCase(), p]));
  for (const { name, role, jersey = "" } of rows) {
    const hit = index.get(name.toLowerCase());
    if (hit) {
      hit.role = role;
      hit.jersey = jersey;
      hit.isActive = true;
    } else {
      const p = { id: newId(), name, role, jersey, isActive: true };
      players.push(p);
      index.set(name.toLowerCase(), p);
    }
  }
  return { ...state, players, ...(now ? { squadSyncedAt: now.toISOString() } : {}) };
}

export function createMatch(state, { id, opponent, venue, date, matchType }, { now }) {
  const match = {
    id,
    opponent,
    venue,
    date,
    matchType,
    status: "UPCOMING",
    predictionsLockAt: date, // picks lock at the start time
    playingXI: [],
    createdAt: now.toISOString(),
  };
  return { ...state, matches: [...state.matches, match] };
}

export function setPlayingXI(state, { matchId, playerIds }) {
  const match = findMatch(state, matchId);
  if (match.status === "COMPLETED") throw new LedgerError("Results are already in — the XI is locked.");
  const active = new Set(state.players.filter((p) => p.isActive).map((p) => p.id));
  if (!playerIds.every((id) => active.has(id))) throw new LedgerError("Some selected players don't exist or are inactive.");
  // Existing predictions are kept; a dropped pick scores 0 and the member is told to re-pick.
  return { ...state, matches: state.matches.map((m) => (m.id === matchId ? { ...m, playingXI: [...playerIds] } : m)) };
}

// ── Predictions ──────────────────────────────────────────────────────────────

export function submitPrediction(state, userId, { matchId, selectedPlayerIds, captainId }, { now, newId }) {
  const player = state.users.find((u) => u.id === userId);
  if (player && isClubAccount(player)) {
    throw new LedgerError("The club ADMIN account moderates the league and can't make picks.", 403);
  }
  if (player && !(player.playerId && player.username)) {
    throw new LedgerError("Tell us which squad player you are and pick a username first.", 403);
  }
  const match = findMatch(state, matchId);
  if (!isPredictionOpen(match, now)) throw new LedgerError("Predictions for this match are closed.", 409);
  if (match.playingXI.length !== XI_SIZE) throw new LedgerError("The Playing XI hasn't been announced yet.", 409);
  if (selectedPlayerIds.length !== PICK_COUNT) throw new LedgerError(`Select exactly ${PICK_COUNT} players.`);
  if (!selectedPlayerIds.every((id) => match.playingXI.includes(id))) {
    throw new LedgerError("Every pick must be in the official Playing XI.");
  }
  if (!selectedPlayerIds.includes(captainId)) throw new LedgerError("Your captain must be one of your 5 players.");

  const roles = selectedPlayerIds.map((id) => byId(state.players, id)?.role);
  const comp = compositionErrors(roles);
  if (comp.length) throw new LedgerError(comp);

  const stamp = now.toISOString();
  const existing = state.predictions.find((p) => p.userId === userId && p.matchId === matchId);
  const predictions = existing
    ? state.predictions.map((p) => (p === existing ? { ...p, selectedPlayerIds, captainId, updatedAt: stamp } : p))
    : [
        ...state.predictions,
        { id: newId(), userId, matchId, selectedPlayerIds, captainId, totalPoints: 0, pointsBreakdown: null, createdAt: stamp, updatedAt: stamp },
      ];
  return { ...state, predictions };
}

// ── Post-match processing (the "transaction") ───────────────────────────────

/**
 * Save the result, score every prediction for the match (captain ×2), and
 * recompute each member's season total from all their predictions.
 * Recomputing (rather than incrementing) makes re-processing a correction safe.
 * The whole thing is one state transition → one atomic write.
 */
export function processMatchResults(state, { matchId, winningTeam, motmPlayerId, stats }, { now }) {
  const match = findMatch(state, matchId);
  const playingXI = match.playingXI;
  if (playingXI.length !== XI_SIZE) throw new LedgerError("Set the Playing XI before entering results.");

  const errors = [];
  if (stats.some((s) => !playingXI.includes(s.playerId))) errors.push("Stats include a player who isn't in the Playing XI.");
  if (new Set(stats.map((s) => s.playerId)).size !== stats.length) errors.push("A player appears twice in the stats.");
  if (motmPlayerId && !playingXI.includes(motmPlayerId)) errors.push("Man of the Match must be in the Canterbury XI.");
  if (errors.length) throw new LedgerError(errors);

  const names = Object.fromEntries(state.players.map((p) => [p.id, p.name]));
  const result = { winningTeam, motmPlayerId, playingXI, stats };
  const stamp = now.toISOString();

  // 1. Save the result
  const record = { matchId, winningTeam, motmPlayerId, isCompleted: true, topPerformersData: stats, processedAt: stamp };
  const results = [...state.results.filter((r) => r.matchId !== matchId), record];
  const matches = state.matches.map((m) => (m.id === matchId ? { ...m, status: "COMPLETED" } : m));

  // 2–3. Score every prediction for this match
  const predictions = state.predictions.map((p) => {
    if (p.matchId !== matchId) return p;
    const score = scorePrediction(p, result, names);
    return { ...p, totalPoints: score.total, pointsBreakdown: score, updatedAt: stamp };
  });

  // 4. Recompute every member's total from their predictions
  const totals = new Map();
  for (const p of predictions) totals.set(p.userId, (totals.get(p.userId) ?? 0) + (p.totalPoints ?? 0));
  const users = state.users.map((u) => ({ ...u, totalFantasyPoints: totals.get(u.id) ?? 0 }));

  return { ...state, results, matches, predictions, users };
}

// ── Read models (never include password hashes) ──────────────────────────────

const publicPlayer = (p) => ({ id: p.id, name: p.name.trim(), role: p.role, jersey: p.jersey ?? "" });
const playerOf = (state, user) => (user.playerId ? state.players.find((p) => p.id === user.playerId) ?? null : null);

function rankOf(users, userId) {
  const sorted = users.filter((u) => isActive(u) && !isClubAccount(u)).sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints);
  const me = sorted.find((u) => u.id === userId);
  return me ? sorted.findIndex((u) => u.totalFantasyPoints === me.totalFantasyPoints) + 1 : null;
}

export function memberSummary(state, user) {
  return {
    id: user.id,
    name: displayName(user),
    username: user.username ?? null,
    fullName: user.name,
    isClubAccount: isClubAccount(user),
    // Accounts made before squad claims existed must claim a player + username first.
    needsProfile: !isClubAccount(user) && !(user.playerId && user.username),
    player: playerOf(state, user) ? publicPlayer(playerOf(state, user)) : null,
    email: user.email,
    role: user.role,
    totalFantasyPoints: user.totalFantasyPoints,
    rank: rankOf(state.users, user.id),
  };
}

export function memberView(state, user, now) {
  const players = new Map(state.players.map((p) => [p.id, p]));
  const resultOf = new Map(state.results.map((r) => [r.matchId, r]));
  const matchById = new Map(state.matches.map((m) => [m.id, m]));

  const matches = [...state.matches]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => {
      const mine = state.predictions.find((p) => p.userId === user.id && p.matchId === m.id);
      const r = resultOf.get(m.id);
      return {
        id: m.id,
        date: m.date,
        opponent: m.opponent,
        venue: m.venue,
        matchType: m.matchType,
        status: m.status,
        predictionsLockAt: m.predictionsLockAt,
        isOpen: isPredictionOpen(m, now),
        playingXI: m.playingXI.map((id) => players.get(id)).filter(Boolean).map(publicPlayer),
        myPrediction: mine
          ? { selectedPlayerIds: mine.selectedPlayerIds, captainId: mine.captainId, totalPoints: mine.totalPoints, pointsBreakdown: mine.pointsBreakdown }
          : null,
        result: r ? { winningTeam: r.winningTeam, motm: r.motmPlayerId ? players.get(r.motmPlayerId)?.name ?? null : null } : null,
      };
    });

  // Others' picks are only revealed once a match is scored.
  const hasScoredPick = (u) => state.predictions.some((p) => p.userId === u.id && matchById.get(p.matchId)?.status === "COMPLETED");
  const leaderboard = state.users
    .filter((u) => isActive(u) && (!isClubAccount(u) || hasScoredPick(u))) // club account can't pick, so it's never listed
    .map((u) => ({
    userId: u.id,
    name: displayName(u),
    player: playerOf(state, u) ? publicPlayer(playerOf(state, u)) : null,
    totalPoints: u.totalFantasyPoints,
    matches: state.predictions
      .filter((p) => p.userId === u.id && matchById.get(p.matchId)?.status === "COMPLETED")
      .map((p) => ({ match: matchById.get(p.matchId), p }))
      .sort((a, b) => new Date(b.match.date) - new Date(a.match.date))
      .map(({ match, p }) => ({
        matchId: match.id,
        opponent: match.opponent,
        date: match.date,
        points: p.totalPoints,
        breakdown: p.pointsBreakdown,
      })),
  }));

  return { me: memberSummary(state, user), matches, leaderboard };
}

/** Username of an approved account that already holds this user's squad player, if any. */
function conflictName(state, user) {
  const owner = user.playerId ? claimOwner(state, user.playerId, user.id) : null;
  return owner ? displayName(owner) : null;
}

export function adminView(state) {
  const resultOf = new Map(state.results.map((r) => [r.matchId, r]));
  return {
    // The CricHeroes scorecard reader needs a (paid) Claude API key; hide it when absent.
    scorecardReader: Boolean(process.env.ANTHROPIC_API_KEY),
    players: [...state.players].sort((a, b) => a.name.localeCompare(b.name)),
    matches: [...state.matches]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((m) => ({
        ...m,
        predictionCount: state.predictions.filter((p) => p.matchId === m.id).length,
        result: resultOf.get(m.id) ?? null,
      })),
    squadSyncedAt: state.squadSyncedAt ?? null,
    allowedEmails: [...state.allowedEmails].sort((a, b) => a.email.localeCompare(b.email)),
    members: state.users
      .map((u) => ({
        id: u.id,
        name: displayName(u),
        fullName: u.name,
        username: u.username ?? null,
        player: playerOf(state, u) ? publicPlayer(playerOf(state, u)) : null,
        // Typed name vs squad sheet, and whether someone else already holds that player.
        nameMatches: playerOf(state, u) ? namesMatch(u.name, playerOf(state, u).name) : null,
        claimConflict: conflictName(state, u),
        email: u.email,
        role: u.role,
        status: statusOf(u),
        createdAt: u.createdAt,
        totalFantasyPoints: u.totalFantasyPoints,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
