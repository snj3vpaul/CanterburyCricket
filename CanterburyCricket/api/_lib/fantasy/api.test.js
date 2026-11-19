// End-to-end test of api/fantasy.js against local file storage.
// Run: npm run test:fantasy
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

let handler;
const ADMIN = "captain@canterbury.test";
const MEMBER = "member@canterbury.test";

before(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ccc-fantasy-"));
  process.env.FANTASY_DATA_FILE = path.join(dir, "fantasy.json");
  process.env.ADMIN_EMAILS = ADMIN;
  delete process.env.VERCEL;
  delete process.env.KV_REST_API_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  ({ default: handler } = await import("../../fantasy.js"));
});

async function call(method, action, { body, cookie, origin, query = {} } = {}) {
  const req = {
    method,
    query: { action, ...query },
    body,
    headers: { host: "canterburycricketclub.com", ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) },
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

describe("fantasy API", () => {
  let adminCookie, memberCookie, matchId, players;

  it("bootstraps the first admin from ADMIN_EMAILS", async () => {
    const r = await call("POST", "register", { body: { name: "Club Captain", email: ADMIN, password: "supersecret1" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.member.role, "ADMIN");
    assert.match(r.cookie, /^ccc_member=/);
    adminCookie = r.cookie;
  });

  it("puts unknown registrations on hold until an admin approves them", async () => {
    const r = await call("POST", "register", { body: { name: "New Player", email: "newbie@club.test", password: "supersecret1" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.pending, true);
    assert.equal(r.cookie, undefined); // no session while pending
    const login = await call("POST", "login", { body: { email: "newbie@club.test", password: "supersecret1" } });
    assert.equal(login.status, 403);
    assert.match(login.body.errors[0], /waiting for approval/);
    // wrong password still says "incorrect", so pending status isn't revealed to strangers
    assert.equal((await call("POST", "login", { body: { email: "newbie@club.test", password: "nope-nope" } })).status, 401);

    const admin = await call("GET", "admin", { cookie: adminCookie });
    const newbie = admin.body.members.find((m) => m.email === "newbie@club.test");
    assert.equal(newbie.status, "PENDING");

    assert.equal((await call("POST", "admin-approve-member", { cookie: adminCookie, body: { userId: newbie.id } })).status, 200);
    const ok = await call("POST", "login", { body: { email: "newbie@club.test", password: "supersecret1" } });
    assert.equal(ok.status, 200);
    assert.match(ok.cookie, /^ccc_member=/);
  });

  it("Approve/Reject links from the admin email: confirm page reads, confirm acts once, links can't be forged", async () => {
    const { makeDecisionToken } = await import("./auth.js");
    await call("POST", "register", { body: { name: "Email Link Player", email: "linky@club.test", password: "supersecret1" } });
    const admin = await call("GET", "admin", { cookie: adminCookie });
    const linky = admin.body.members.find((m) => m.email === "linky@club.test");
    const approve = makeDecisionToken(linky.id, "APPROVE");
    const reject = makeDecisionToken(linky.id, "REJECT");

    // Opening the link (GET, what email scanners do) only reads
    const info = await call("GET", "decision", { query: { t: approve } });
    assert.equal(info.status, 200);
    assert.deepEqual([info.body.decision, info.body.name, info.body.status], ["APPROVE", "Email Link Player", "PENDING"]);
    assert.equal((await call("GET", "admin", { cookie: adminCookie })).body.members.find((m) => m.id === linky.id).status, "PENDING");

    // Forged / tampered / expired links fail
    assert.equal((await call("POST", "decide", { body: { t: approve.replace("APPROVE", "REJECT") } })).status, 400);
    assert.equal((await call("POST", "decide", { body: { t: approve.slice(0, -2) + "xx" } })).status, 400);
    assert.equal((await call("POST", "decide", { body: { t: makeDecisionToken(linky.id, "APPROVE", Date.now() - 8 * 86400000) } })).status, 400);

    // Confirm acts (no login needed: the signed link is the authority)
    const done = await call("POST", "decide", { body: { t: approve } });
    assert.equal(done.status, 200);
    assert.equal(done.body.status, "ACTIVE");
    assert.equal((await call("POST", "login", { body: { email: "linky@club.test", password: "supersecret1" } })).status, 200);

    // Replays and the other button can't undo it
    assert.equal((await call("POST", "decide", { body: { t: approve } })).body.already, true);
    const late = await call("POST", "decide", { body: { t: reject } });
    assert.equal(late.body.already, true);
    assert.equal(late.body.status, "ACTIVE");
  });

  it("rejected registrations can't sign in, and admin accounts can't be rejected", async () => {
    await call("POST", "register", { body: { name: "Random Person", email: "random@else.test", password: "supersecret1" } });
    const admin = await call("GET", "admin", { cookie: adminCookie });
    const random = admin.body.members.find((m) => m.email === "random@else.test");
    const self = admin.body.members.find((m) => m.role === "ADMIN");
    assert.equal((await call("POST", "admin-reject-member", { cookie: adminCookie, body: { userId: random.id } })).status, 200);
    const login = await call("POST", "login", { body: { email: "random@else.test", password: "supersecret1" } });
    assert.equal(login.status, 403);
    assert.match(login.body.errors[0], /wasn't approved/);
    assert.equal((await call("POST", "admin-reject-member", { cookie: adminCookie, body: { userId: self.id } })).status, 400);
  });

  it("lets an admin whitelist a member, who can then register", async () => {
    assert.equal((await call("POST", "admin-allow-emails", { cookie: adminCookie, body: { emails: `${MEMBER}, other@club.test` } })).status, 200);
    const r = await call("POST", "register", { body: { name: "Mo Member", email: MEMBER, password: "anotherpass1" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.member.role, "MEMBER");
    memberCookie = r.cookie;
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

  it("admin sets up the squad, a match and the Playing XI", async () => {
    const roles = ["BATTER", "BATTER", "BATTER", "WICKET_KEEPER", "ALL_ROUNDER", "ALL_ROUNDER", "BOWLER", "BOWLER", "BOWLER", "BOWLER", "BATTER"];
    for (const [i, role] of roles.entries()) {
      const r = await call("POST", "admin-add-player", { cookie: adminCookie, body: { name: `Player ${i + 1}`, role } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
    }
    const dup = await call("POST", "admin-add-player", { cookie: adminCookie, body: { name: "player 1", role: "BATTER" } });
    assert.equal(dup.status, 409);

    const date = new Date(Date.now() + 86_400_000).toISOString();
    const m = await call("POST", "admin-create-match", { cookie: adminCookie, body: { opponent: "Ottawa Rivals", venue: "Lynda Lane Park", date, matchType: "T20" } });
    assert.equal(m.status, 200, JSON.stringify(m.body));
    matchId = m.body.matchId;
    players = m.body.players; // sorted by name

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
    assert.ok(!view.leaderboard.some((r) => r.name === "Random Person"), "rejected members stay off the table");
    const row = view.leaderboard.find((r) => r.userId === view.me.id);
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

  it("never leaks password hashes", async () => {
    const admin = await call("GET", "admin", { cookie: adminCookie });
    assert.doesNotMatch(JSON.stringify(admin.body), /scrypt\$/);
    const state = await call("GET", "state", { cookie: memberCookie });
    assert.doesNotMatch(JSON.stringify(state.body), /scrypt\$|passwordHash/);
  });
});
