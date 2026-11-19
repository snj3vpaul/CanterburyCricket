// End-to-end test of api/fantasy.js against local file storage.
// Run: npm run test:fantasy
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

let handler;
const sentMail = [];
const allMail = []; // never cleared, for finding emailed links
const ADMIN = "captain@canterbury.test"; // club moderator account (first ADMIN_EMAILS)
const BACKUP = "backup@canterbury.test"; // backup admin: plays too
const MEMBER = "member@canterbury.test";

before(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ccc-fantasy-"));
  process.env.FANTASY_DATA_FILE = path.join(dir, "fantasy.json");
  process.env.ADMIN_EMAILS = `${ADMIN},${BACKUP}`;
  process.env.FANTASY_REGISTER_MIN_MS = "0";
  delete process.env.VERCEL;
  delete process.env.KV_REST_API_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  Object.assign(process.env, { SMTP_HOST: "smtp.test", SMTP_USER: "u", SMTP_PASS: "p", MAIL_FROM: "club@test" });
  process.env.FANTASY_SITE_URL = "https://canterburycricketclub.com";
  const { default: nodemailer } = await import("nodemailer");
  nodemailer.createTransport = () => ({ sendMail: async (m) => void (sentMail.push(m), allMail.push(m)) });
  ({ default: handler } = await import("../../fantasy.js"));
});

async function call(method, action, { body, cookie, origin, query = {}, headers = {} } = {}) {
  const req = {
    method,
    query: { action, ...query },
    body,
    headers: {
      host: "canterburycricketclub.com",
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
      ...headers,
    },
  };
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await handler(req, res);
  const set = res.headers["set-cookie"];
  return { status: res.statusCode, body: res.body, cookie: set ? set.split(";")[0] : undefined };
}

/** The confirm-your-email link most recently mailed to `email`. */
function verifyToken(email) {
  const mail = [...allMail].reverse().find((m) => m.to === email && /confirm your email/i.test(m.subject));
  assert.ok(mail, `verification email sent to ${email}`);
  return mail.text.match(/\/fantasy\/verify\?t=(\S+)/)[1];
}

/** Register + click the emailed link. Returns the verify-email response. */
async function join(body, opts = {}) {
  const r = await call("POST", "register", { body, ...opts });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.verify, true);
  assert.equal(r.cookie, undefined, "no session before the email is confirmed");
  return call("POST", "verify-email", { body: { t: verifyToken(body.email) } });
}

describe("fantasy API", () => {
  let adminCookie, memberCookie, matchId, players;
  const squad = {}; // name → id
  const pid = (name) => squad[name];

  it("the club moderator account registers without a squad player and confirms its email", async () => {
    const r = await join({ name: "Club Captain", email: ADMIN, password: "supersecret1" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.status, "ACTIVE");
    assert.equal(r.body.member.role, "ADMIN");
    assert.equal(r.body.member.name, "ADMIN");
    assert.equal(r.body.member.needsProfile, false);
    assert.match(r.cookie, /^ccc_member=/);
    adminCookie = r.cookie;
    // the link only works once
    const again = await call("POST", "verify-email", { body: { t: verifyToken(ADMIN) } });
    assert.equal(again.body.already, true);
    assert.equal(again.cookie, undefined);
  });

  it("admin sets up the squad; register-options lists the squad players with jersey numbers", async () => {
    const roles = ["BATTER", "BATTER", "BATTER", "WICKET_KEEPER", "ALL_ROUNDER", "ALL_ROUNDER", "BOWLER", "BOWLER", "BOWLER", "BOWLER", "BATTER"];
    for (const [i, role] of roles.entries()) {
      const r = await call("POST", "admin-add-player", { cookie: adminCookie, body: { name: `Player ${i + 1}`, role } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
    }
    const people = ["Mo K Member", "New Player", "Email Link Player", "Random Person", "Brand New", "Header Trick", "Backup Admin", "Legacy Larry", "Taken Tim", "Vikram Arora"];
    for (const name of people) assert.equal((await call("POST", "admin-add-player", { cookie: adminCookie, body: { name, role: "BATTER" } })).status, 200);
    const dup = await call("POST", "admin-add-player", { cookie: adminCookie, body: { name: "player 1", role: "BATTER" } });
    assert.equal(dup.status, 409);

    const opts = await call("GET", "register-options");
    assert.equal(opts.status, 200);
    for (const p of opts.body.players) squad[p.name] = p.id;
    assert.equal(opts.body.players.length, 21);
    assert.deepEqual(Object.keys(opts.body.players[0]).sort(), ["id", "jersey", "name", "role"]);
  });

  it("registration needs a squad player, a matching full name and a fair username", async () => {
    const base = { email: "newbie@club.test", password: "supersecret1" };
    const reg = (body) => call("POST", "register", { body: { ...base, ...body } });

    const noPlayer = await reg({ name: "New Player", username: "newbie" });
    assert.equal(noPlayer.status, 400);
    assert.match(noPlayer.body.errors[0], /which Canterbury squad player/);

    const wrongName = await reg({ name: "Someone Else", playerId: pid("New Player"), username: "newbie" });
    assert.equal(wrongName.status, 400);
    assert.match(wrongName.body.errors[0], /doesn't match the squad sheet/);

    for (const username of ["admin", "Moderator", "ab", "has space", "VikramArora"]) {
      const r = await reg({ name: "New Player", playerId: pid("New Player"), username });
      assert.equal(r.status, 400, `${username} should be refused`);
    }

    // middle names are optional either way; case doesn't matter
    const ok = await call("POST", "register", { body: { name: "mo member", email: MEMBER, password: "anotherpass1", playerId: pid("Mo K Member"), username: "MoMoney" } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));

    const taken = await reg({ name: "New Player", playerId: pid("New Player"), username: "momoney" });
    assert.equal(taken.status, 409);
    assert.match(taken.body.errors[0], /username is taken/);
  });

  it("nobody reaches the admins until they confirm their email; then the admin email shows the claim", async () => {
    sentMail.length = 0;
    const body = { name: "New Player", email: "newbie@club.test", password: "supersecret1", playerId: pid("New Player"), username: "newbie" };
    assert.equal((await call("POST", "register", { body })).status, 200);
    assert.ok(!sentMail.some((m) => /approve/i.test(m.subject)), "admins not emailed before confirmation");

    // signing in before confirming: right password → new link; wrong password → generic
    const early = await call("POST", "login", { body: { email: body.email, password: body.password } });
    assert.equal(early.status, 403);
    assert.match(early.body.errors[0], /Confirm your email/);
    assert.equal((await call("POST", "login", { body: { email: body.email, password: "nope-nope" } })).status, 401);
    const admin0 = await call("GET", "admin", { cookie: adminCookie });
    assert.equal(admin0.body.members.find((m) => m.email === body.email).status, "UNVERIFIED");
    assert.equal((await call("POST", "admin-approve-member", { cookie: adminCookie, body: { userId: admin0.body.members.find((m) => m.email === body.email).id } })).status, 409);

    // the link: GET only reads, POST confirms; forged links fail
    const t = verifyToken(body.email);
    assert.equal((await call("GET", "verify", { query: { t } })).body.status, "UNVERIFIED");
    assert.equal((await call("POST", "verify-email", { body: { t: t.slice(0, -2) + "xx" } })).status, 400);
    const v = await call("POST", "verify-email", { body: { t } });
    assert.equal(v.body.status, "PENDING");
    assert.equal(v.cookie, undefined);

    const mail = sentMail.find((m) => /approve/i.test(m.subject));
    assert.ok(mail, "admins emailed after confirmation");
    assert.match(mail.to, new RegExp(ADMIN));
    assert.match(mail.text, /squad player: New Player/);
    assert.match(mail.text, /matches the squad sheet/);
    assert.match(mail.text, /@newbie/);

    const pendingLogin = await call("POST", "login", { body: { email: body.email, password: body.password } });
    assert.equal(pendingLogin.status, 403);
    assert.match(pendingLogin.body.errors[0], /waiting for approval/);

    const admin = await call("GET", "admin", { cookie: adminCookie });
    const newbie = admin.body.members.find((m) => m.email === body.email);
    assert.equal(newbie.status, "PENDING");
    assert.equal(newbie.player.name, "New Player");
    assert.equal(newbie.nameMatches, true);
    assert.equal((await call("POST", "admin-approve-member", { cookie: adminCookie, body: { userId: newbie.id } })).status, 200);
    const ok = await call("POST", "login", { body: { email: body.email, password: body.password } });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.member.name, "newbie");
  });

  it("one approved account per squad player: no impersonating a teammate who already joined", async () => {
    // claimed players disappear from the register form…
    const opts = await call("GET", "register-options");
    assert.ok(!opts.body.players.some((p) => p.name === "New Player"));
    // …and can't be claimed by posting the id directly
    const steal = await call("POST", "register", { body: { name: "New Player", email: "imposter@club.test", password: "supersecret1", playerId: pid("New Player"), username: "realnewbie" } });
    assert.equal(steal.status, 409);
    assert.match(steal.body.errors[0], /already has an account/);

    // two pending claims on the same player: approving the second is refused
    const a = await join({ name: "Taken Tim", email: "tim1@club.test", password: "supersecret1", playerId: pid("Taken Tim"), username: "tim_one" });
    const b = await join({ name: "Taken Tim", email: "tim2@club.test", password: "supersecret1", playerId: pid("Taken Tim"), username: "tim_two" });
    assert.equal(a.body.status, "PENDING");
    assert.equal(b.body.status, "PENDING");
    const members = (await call("GET", "admin", { cookie: adminCookie })).body.members;
    const [t1, t2] = ["tim1@club.test", "tim2@club.test"].map((e) => members.find((m) => m.email === e));
    assert.equal((await call("POST", "admin-approve-member", { cookie: adminCookie, body: { userId: t1.id } })).status, 200);
    const after = (await call("GET", "admin", { cookie: adminCookie })).body.members.find((m) => m.id === t2.id);
    assert.equal(after.claimConflict, "tim_one");
    const second = await call("POST", "admin-approve-member", { cookie: adminCookie, body: { userId: t2.id } });
    assert.equal(second.status, 409);
    assert.match(second.body.errors[0], /already belongs to @tim_one/);
  });

  it("Approve/Reject links from the admin email: confirm page reads, confirm acts once, links can't be forged", async () => {
    const { makeDecisionToken } = await import("./auth.js");
    await join({ name: "Email Link Player", email: "linky@club.test", password: "supersecret1", playerId: pid("Email Link Player"), username: "linky" });
    const admin = await call("GET", "admin", { cookie: adminCookie });
    const linky = admin.body.members.find((m) => m.email === "linky@club.test");
    const approve = makeDecisionToken(linky.id, "APPROVE");
    const reject = makeDecisionToken(linky.id, "REJECT");

    const info = await call("GET", "decision", { query: { t: approve } });
    assert.equal(info.status, 200);
    assert.deepEqual([info.body.decision, info.body.name, info.body.status], ["APPROVE", "Email Link Player", "PENDING"]);
    assert.equal((await call("GET", "admin", { cookie: adminCookie })).body.members.find((m) => m.id === linky.id).status, "PENDING");

    assert.equal((await call("POST", "decide", { body: { t: approve.replace("APPROVE", "REJECT") } })).status, 400);
    assert.equal((await call("POST", "decide", { body: { t: approve.slice(0, -2) + "xx" } })).status, 400);
    assert.equal((await call("POST", "decide", { body: { t: makeDecisionToken(linky.id, "APPROVE", Date.now() - 8 * 86400000) } })).status, 400);

    const done = await call("POST", "decide", { body: { t: approve } });
    assert.equal(done.status, 200);
    assert.equal(done.body.status, "ACTIVE");
    assert.equal((await call("POST", "login", { body: { email: "linky@club.test", password: "supersecret1" } })).status, 200);

    assert.equal((await call("POST", "decide", { body: { t: approve } })).body.already, true);
    const late = await call("POST", "decide", { body: { t: reject } });
    assert.equal(late.body.already, true);
    assert.equal(late.body.status, "ACTIVE");
  });

  it("rejected registrations can't sign in, and admin accounts can't be rejected", async () => {
    await join({ name: "Random Person", email: "random@else.test", password: "supersecret1", playerId: pid("Random Person"), username: "randy" });
    const admin = await call("GET", "admin", { cookie: adminCookie });
    const random = admin.body.members.find((m) => m.email === "random@else.test");
    const self = admin.body.members.find((m) => m.role === "ADMIN");
    assert.equal((await call("POST", "admin-reject-member", { cookie: adminCookie, body: { userId: random.id } })).status, 200);
    const login = await call("POST", "login", { body: { email: "random@else.test", password: "supersecret1" } });
    assert.equal(login.status, 403);
    assert.match(login.body.errors[0], /wasn't approved/);
    assert.equal((await call("POST", "admin-reject-member", { cookie: adminCookie, body: { userId: self.id } })).status, 400);
  });

  it("pre-approved emails and the backup admin are in as soon as they confirm (still claiming a squad player)", async () => {
    assert.equal((await call("POST", "admin-allow-emails", { cookie: adminCookie, body: { emails: `${MEMBER}, other@club.test` } })).status, 200);
    // MEMBER registered earlier but never confirmed: confirming now signs them straight in
    const r = await call("POST", "verify-email", { body: { t: verifyToken(MEMBER) } });
    assert.equal(r.body.status, "ACTIVE");
    assert.equal(r.body.member.role, "MEMBER");
    assert.equal(r.body.member.name, "MoMoney");
    assert.equal(r.body.member.player.name, "Mo K Member");
    memberCookie = r.cookie;

    const noClaim = await call("POST", "register", { body: { name: "Backup Admin", email: BACKUP, password: "supersecret1" } });
    assert.equal(noClaim.status, 400, "only the club account skips the squad claim");
    const b = await join({ name: "Backup Admin", email: BACKUP, password: "supersecret1", playerId: pid("Backup Admin"), username: "backup_bat" });
    assert.equal(b.body.status, "ACTIVE");
    assert.equal(b.body.member.role, "ADMIN");
    assert.equal(b.body.member.name, "backup_bat");
  });

  it("accounts from before squad claims must claim a player and username before playing", async () => {
    const { hashPassword } = await import("./auth.js");
    const file = process.env.FANTASY_DATA_FILE;
    const data = JSON.parse(await fs.readFile(file, "utf8"));
    data.users.push({ id: "legacy-1", name: "Legacy Larry", email: "larry@club.test", passwordHash: await hashPassword("legacy-pass-41"), role: "MEMBER", totalFantasyPoints: 0, sessionVersion: 1, createdAt: new Date().toISOString() });
    await fs.writeFile(file, JSON.stringify(data));

    const login = await call("POST", "login", { body: { email: "larry@club.test", password: "legacy-pass-41" } });
    assert.equal(login.status, 200);
    assert.equal(login.body.member.needsProfile, true);
    const wrong = await call("POST", "complete-profile", { cookie: login.cookie, body: { playerId: pid("Brand New"), username: "larry" } });
    assert.equal(wrong.status, 400);
    const ok = await call("POST", "complete-profile", { cookie: login.cookie, body: { playerId: pid("Legacy Larry"), username: "larry" } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.member.needsProfile, false);
    assert.equal(ok.body.member.name, "larry");
  });

  it("rejects bad passwords and accepts the right one", async () => {
    assert.equal((await call("POST", "login", { body: { email: MEMBER, password: "wrongpass" } })).status, 401);
    const ok = await call("POST", "login", { body: { email: MEMBER.toUpperCase(), password: "anotherpass1" } });
    assert.equal(ok.status, 200);
  });

  it("blocks members from admin actions, tampered cookies, and cross-site posts", async () => {
    assert.equal((await call("GET", "admin", { cookie: memberCookie })).status, 403);
    assert.equal((await call("POST", "admin-approve-member", { cookie: memberCookie, body: { userId: "x" } })).status, 403);
    assert.equal((await call("GET", "state", { cookie: memberCookie.replace(/.$/, "x") })).status, 401);
    assert.equal((await call("GET", "state")).status, 401);
    assert.equal((await call("POST", "logout", { origin: "https://evil.test" })).status, 403);
  });

  it("admin creates a match and the Playing XI", async () => {
    const date = new Date(Date.now() + 86_400_000).toISOString();
    const m = await call("POST", "admin-create-match", { cookie: adminCookie, body: { opponent: "Ottawa Rivals", venue: "Lynda Lane Park", date, matchType: "T20" } });
    assert.equal(m.status, 200, JSON.stringify(m.body));
    matchId = m.body.matchId;
    players = m.body.players.filter((p) => /^Player \d+$/.test(p.name));
    const xi = await call("POST", "admin-set-xi", { cookie: adminCookie, body: { matchId, playerIds: players.map((p) => p.id) } });
    assert.equal(xi.status, 200, JSON.stringify(xi.body));
  });

  it("validates and saves a member's 5 + captain", async () => {
    const id = (n) => players.find((p) => p.name === `Player ${n}`).id;
    const allBatters = await call("POST", "predict", {
      cookie: memberCookie,
      body: { matchId, selectedPlayerIds: [id(1), id(2), id(3), id(4), id(11)], captainId: id(1) },
    });
    assert.equal(allBatters.status, 400);
    assert.match(allBatters.body.errors[0], /Bowlers or All-Rounders/);

    const noCaptain = await call("POST", "predict", {
      cookie: memberCookie,
      body: { matchId, selectedPlayerIds: [id(1), id(2), id(5), id(7), id(8)], captainId: "" },
    });
    assert.equal(noCaptain.status, 400);

    const ok = await call("POST", "predict", {
      cookie: memberCookie,
      body: { matchId, selectedPlayerIds: [id(1), id(2), id(5), id(7), id(8)], captainId: id(7) },
    });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.matches[0].myPrediction.captainId, id(7));
  });

  it("scores the match atomically with captain x2, and re-processing is idempotent", async () => {
    const id = (n) => players.find((p) => p.name === `Player ${n}`).id;
    const body = {
      matchId,
      winningTeam: "CANTERBURY",
      motmPlayerId: id(7),
      stats: [
        { playerId: id(1), runs: 62, wickets: 0, catches: 1 }, // 10 + 5 + 5 win = 20
        { playerId: id(7), runs: 0, wickets: 3, catches: 0 }, // 45 + 10 + 5 + 10 MOTM = 70 → C 140
      ],
    };
    // Expected: P1 20 + P2 5 + P5 5 + P7 140 + P8 5 = 175
    const r1 = await call("POST", "admin-results", { cookie: adminCookie, body });
    assert.equal(r1.status, 200, JSON.stringify(r1.body));

    const view = (await call("GET", "state", { cookie: memberCookie })).body;
    assert.equal(view.me.totalFantasyPoints, 175);
    assert.equal(view.me.rank, 1);
    assert.ok(!view.leaderboard.some((r) => r.name === "randy"), "rejected members stay off the table");
    const row = view.leaderboard.find((r) => r.userId === view.me.id);
    assert.equal(row.name, "MoMoney", "the table shows usernames");
    assert.equal(row.player.name, "Mo K Member");
    const cap = row.matches[0].breakdown.picks.find((p) => p.isCaptain);
    assert.equal(cap.total, 140);
    assert.equal(cap.multiplier, 2);

    await call("POST", "admin-results", { cookie: adminCookie, body });
    assert.equal((await call("GET", "state", { cookie: memberCookie })).body.me.totalFantasyPoints, 175);

    // Correction: MOTM changed → captain loses 20 (10 × 2)
    await call("POST", "admin-results", { cookie: adminCookie, body: { ...body, motmPlayerId: id(1) } });
    assert.equal((await call("GET", "state", { cookie: memberCookie })).body.me.totalFantasyPoints, 175 - 20 + 10);
  });

  it("locks predictions once the match is completed", async () => {
    const id = (n) => players.find((p) => p.name === `Player ${n}`).id;
    const r = await call("POST", "predict", {
      cookie: memberCookie,
      body: { matchId, selectedPlayerIds: [id(1), id(2), id(5), id(7), id(8)], captainId: id(1) },
    });
    assert.equal(r.status, 409);
  });

  it("reads an uploaded CricHeroes scorecard into a draft without saving anything", async () => {
    const realFetch = globalThis.fetch;
    let sent;
    const scorecard = {
      teams: ["Canterbury T20", "Ottawa Rivals CC"],
      result_text: "Ottawa Rivals CC won by 5 wickets",
      winner_team_name: "Ottawa Rivals CC",
      player_of_the_match: "Visitor Star",
      unreadable_notes: "",
      innings: [
        { batting_team: "Canterbury T20", batting: [{ name: "Player 1", dismissal: "c Star b Ace", runs: 55 }], bowling: [{ name: "Ace", wickets: 1 }] },
        {
          batting_team: "Ottawa Rivals CC",
          batting: [{ name: "Star", dismissal: "st †Player 4 b Player 7", runs: 70 }],
          bowling: [{ name: "Player 7", wickets: 1 }],
        },
      ],
    };
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://api.anthropic.com/v1/messages");
      sent = JSON.parse(init.body);
      return new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(scorecard) }] }), { status: 200 });
    };
    try {
      const pdf = Buffer.from("%PDF-1.4 fake").toString("base64");
      const body = { matchId, files: [{ name: "scorecard.pdf", mediaType: "application/pdf", data: pdf }] };

      delete process.env.ANTHROPIC_API_KEY;
      assert.equal((await call("GET", "admin", { cookie: adminCookie })).body.scorecardReader, false);
      assert.equal((await call("POST", "admin-read-scorecard", { cookie: adminCookie, body })).status, 503);
      process.env.ANTHROPIC_API_KEY = "test-key";
      assert.equal((await call("GET", "admin", { cookie: adminCookie })).body.scorecardReader, true);

      assert.equal((await call("POST", "admin-read-scorecard", { cookie: memberCookie, body })).status, 403);
      assert.equal((await call("POST", "admin-read-scorecard", { cookie: adminCookie, body: { matchId } })).status, 400);

      const before = (await call("GET", "state", { cookie: memberCookie })).body.me.totalFantasyPoints;
      const r = await call("POST", "admin-read-scorecard", { cookie: adminCookie, body });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(sent.messages[0].content[0].type, "document");
      assert.equal(sent.output_config.format.type, "json_schema");

      const id = (n) => players.find((p) => p.name === `Player ${n}`).id;
      const line = (n) => r.body.draft.stats.find((s) => s.playerId === id(n));
      assert.equal(r.body.draft.winningTeam, "OPPONENT");
      assert.equal(line(1).runs, 55);
      assert.equal(line(4).catches, 1); // stumping
      assert.equal(line(7).wickets, 1);
      assert.equal(r.body.draft.motmPlayerId, null); // opposition MOTM
      assert.equal((await call("GET", "state", { cookie: memberCookie })).body.me.totalFantasyPoints, before); // draft only
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  // ── OWASP Top 10 regression tests ─────────────────────────────────────────

  it("A01/CSRF: writes need a JSON body and must not come from another site", async () => {
    const body = { email: MEMBER, password: "anotherpass1" };
    assert.equal((await call("POST", "login", { body, headers: { "content-type": "text/plain" } })).status, 403);
    assert.equal((await call("POST", "login", { body, headers: { "content-type": "application/x-www-form-urlencoded" } })).status, 403);
    assert.equal((await call("POST", "login", { body, headers: { "sec-fetch-site": "cross-site" } })).status, 403);
    assert.equal((await call("POST", "login", { body, headers: { "sec-fetch-site": "same-site" } })).status, 403);
    assert.equal((await call("POST", "login", { body, headers: { "sec-fetch-site": "same-origin" } })).status, 200);
  });

  it("A04: registering an existing email looks exactly like a new registration (no member enumeration)", async () => {
    sentMail.length = 0;
    const fresh = await call("POST", "register", { body: { name: "Brand New", email: "brandnew@club.test", password: "fresh-pass-41", playerId: pid("Brand New"), username: "brandy" } });
    const dupe = await call("POST", "register", { body: { name: "Brand New", email: MEMBER, password: "other-pass-41", playerId: pid("Brand New"), username: "brandy2" } });
    assert.equal(dupe.status, fresh.status);
    assert.deepEqual(dupe.body, fresh.body);
    assert.equal(dupe.cookie, undefined);
    assert.ok(!sentMail.some((m) => m.to === MEMBER), "nothing is sent to the existing account");
    assert.equal((await call("POST", "login", { body: { email: MEMBER, password: "anotherpass1" } })).status, 200);
    assert.equal((await call("POST", "login", { body: { email: MEMBER, password: "other-pass-41" } })).status, 401);
  });

  it("A10/host-header: emailed links always point at the real site", async () => {
    sentMail.length = 0;
    await join(
      { name: "Header Trick", email: "trick@club.test", password: "boundary-line-41", playerId: pid("Header Trick"), username: "tricky" },
      { headers: { host: "evil.example", "x-forwarded-host": "evil.example", "x-real-ip": "203.0.113.7" } },
    );
    const verify = sentMail.find((m) => /confirm your email/i.test(m.subject));
    assert.match(verify.html, /href="https:\/\/canterburycricketclub\.com\/fantasy\/verify\?t=/);
    const mail = sentMail.find((m) => /approve/i.test(m.subject));
    assert.ok(mail, "admin email sent");
    assert.doesNotMatch(mail.html + mail.text + verify.html + verify.text, /evil\.example/);
    assert.match(mail.html, /href="https:\/\/canterburycricketclub\.com\/fantasy\/decide\?t=/);
  });

  it("A07: signing out revokes the session on the server, not just in the browser", async () => {
    const a = await call("POST", "login", { body: { email: MEMBER, password: "anotherpass1" } });
    assert.equal((await call("GET", "state", { cookie: a.cookie })).status, 200);
    assert.equal((await call("POST", "logout", { cookie: a.cookie, body: {} })).status, 200);
    assert.equal((await call("GET", "state", { cookie: a.cookie })).status, 401, "copied cookie is dead after sign-out");
    memberCookie = (await call("POST", "login", { body: { email: MEMBER, password: "anotherpass1" } })).cookie;
  });

  it("A07: weak or common passwords and markup in names are refused", async () => {
    const r1 = await call("POST", "register", { body: { name: "Brand New", email: "weak@club.test", password: "password123", playerId: pid("Brand New"), username: "weakling" } });
    assert.equal(r1.status, 400);
    const r2 = await call("POST", "register", { body: { name: "<img src=x onerror=alert(1)>", email: "xss@club.test", password: "good-pass-41" } });
    assert.equal(r2.status, 400);
  });

  it("the club ADMIN account moderates only: it can't make picks", async () => {
    const view = (await call("GET", "state", { cookie: adminCookie })).body;
    const open = view.matches.find((m) => m.isOpen && m.playingXI.length === 11);
    const matchId = open?.id ?? view.matches[0].id;
    const ids = (open ?? view.matches[0]).playingXI.map((p) => p.id).slice(0, 5);
    const r = await call("POST", "predict", { cookie: adminCookie, body: { matchId, selectedPlayerIds: ids, captainId: ids[0] } });
    assert.equal(r.status, 403);
    assert.match(r.body.errors[0], /moderates/);
  });

  it("the club account (first ADMIN_EMAILS address) shows as ADMIN and stays off the leaderboard", async () => {
    const me = await call("GET", "me", { cookie: adminCookie });
    assert.equal(me.body.member.name, "ADMIN");
    const view = await call("GET", "state", { cookie: memberCookie });
    assert.ok(!view.body.leaderboard.some((r) => r.name === "ADMIN" || r.name === "Club Captain"));
  });

  it("registrations never confirmed are dropped after 48 hours (freeing the username)", async () => {
    const { registerUser } = await import("./ledger.js");
    const state = JSON.parse(await fs.readFile(process.env.FANTASY_DATA_FILE, "utf8"));
    assert.ok(state.users.some((u) => u.username === "brandy" && u.status === "UNVERIFIED"));
    const later = new Date(Date.now() + 49 * 3600 * 1000);
    const next = registerUser(state, { id: "n1", name: "Brand New", email: "brand2@club.test", passwordHash: "x", playerId: pid("Brand New"), username: "brandy" }, { now: later });
    assert.ok(!next.users.some((u) => u.email === "brandnew@club.test"));
    assert.equal(next.users.find((u) => u.id === "n1").username, "brandy");
  });

  it("never leaks password hashes", async () => {
    const admin = await call("GET", "admin", { cookie: adminCookie });
    assert.doesNotMatch(JSON.stringify(admin.body), /scrypt\$/);
    const state = await call("GET", "state", { cookie: memberCookie });
    assert.doesNotMatch(JSON.stringify(state.body), /scrypt\$|passwordHash/);
  });
});
