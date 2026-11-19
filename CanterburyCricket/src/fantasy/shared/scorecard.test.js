import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveFantasyStats, fieldingCredit, matchPlayer, scorecardSchema } from "./scorecard.js";

const XI = [
  { id: "sp", name: "Sanjeev K Paul" },
  { id: "aa", name: "Akram Ali" },
  { id: "vr", name: "Varun Rao" },
  { id: "hk", name: "Haris Khan" },
  { id: "zm", name: "Zain Malik" },
  { id: "am", name: "Ameer Mohammed" },
  { id: "ao", name: "Aoun Hussain" },
  { id: "mg", name: "Manoj Gupta" },
  { id: "ch", name: "Chandan Hegde" },
  { id: "rs", name: "Rahul Sharma" },
  { id: "ks", name: "Kiran Singh" },
];

describe("fieldingCredit", () => {
  it("parses catches, caught-and-bowled, stumpings and substitutes", () => {
    assert.deepEqual(fieldingCredit("c Paul b Khan"), { kind: "catch", fielder: "Paul" });
    assert.deepEqual(fieldingCredit("c †Akram Ali b Rao"), { kind: "catch", fielder: "Akram Ali" });
    assert.deepEqual(fieldingCredit("c & b Khan"), { kind: "catch", fielder: "Khan" });
    assert.deepEqual(fieldingCredit("c and b Haris Khan"), { kind: "catch", fielder: "Haris Khan" });
    assert.deepEqual(fieldingCredit("st †Ali b Rao"), { kind: "stumping", fielder: "Ali" });
    assert.deepEqual(fieldingCredit("c sub (Rahul) b Rao"), { kind: "catch", fielder: "Rahul", substitute: true });
  });
  it("gives no credit for run outs, lbw, bowled, not out", () => {
    for (const d of ["run out (Paul)", "lbw b Khan", "b Khan", "not out", "retired hurt", "hit wicket b Rao", "c sub b Rao"]) {
      assert.equal(fieldingCredit(d), null, d);
    }
  });
});

describe("matchPlayer", () => {
  it("matches full names, initials, and short surnames", () => {
    assert.equal(matchPlayer("Sanjeev K Paul", XI)?.id, "sp");
    assert.equal(matchPlayer("Sanjeev Paul", XI)?.id, "sp");
    assert.equal(matchPlayer("S Paul", XI)?.id, "sp");
    assert.equal(matchPlayer("Paul", XI)?.id, "sp");
    assert.equal(matchPlayer("†Akram Ali (wk)", XI)?.id, "aa");
  });
  it("refuses ambiguous or unknown names", () => {
    const twoKhans = [...XI, { id: "ik", name: "Imran Khan" }];
    assert.equal(matchPlayer("Khan", twoKhans), null);
    assert.equal(matchPlayer("John Smith", XI), null);
  });
});

const card = (overrides = {}) =>
  scorecardSchema.parse({
    teams: ["Canterbury T20", "Ottawa Rivals"],
    result_text: "Canterbury T20 won by 23 runs",
    winner_team_name: "Canterbury T20",
    player_of_the_match: "Haris Khan",
    unreadable_notes: "",
    innings: [
      {
        batting_team: "Canterbury T20",
        batting: [
          { name: "Sanjeev K Paul", dismissal: "c Lee b Grant", runs: 64 },
          { name: "Akram Ali", dismissal: "b Grant", runs: 12 },
          { name: "Varun Rao", dismissal: "not out", runs: 101 },
          { name: "Dave Guest", dismissal: "not out", runs: 3 },
        ],
        bowling: [{ name: "Grant", wickets: 2 }],
      },
      {
        batting_team: "Ottawa Rivals",
        batting: [
          { name: "Lee", dismissal: "c Paul b Khan", runs: 30 },
          { name: "Grant", dismissal: "st †Ali b Khan", runs: 4 },
          { name: "Moe", dismissal: "c & b Khan", runs: 0 },
          { name: "Nash", dismissal: "run out (Rao)", runs: 9 },
          { name: "Otto", dismissal: "c Smith b Malik", runs: 1 },
        ],
        bowling: [
          { name: "Haris Khan", wickets: 3 },
          { name: "Zain Malik", wickets: 1 },
          { name: "Varun Rao", wickets: 0 },
        ],
      },
    ],
    ...overrides,
  });

describe("deriveFantasyStats", () => {
  it("pulls runs, wickets, catches/stumpings, result and MOTM for the Canterbury XI", () => {
    const d = deriveFantasyStats(card(), XI);
    const by = Object.fromEntries(d.stats.map((s) => [s.playerId, s]));
    assert.equal(d.winningTeam, "CANTERBURY");
    assert.equal(d.motmPlayerId, "hk");
    assert.deepEqual(by.sp, { playerId: "sp", runs: 64, wickets: 0, catches: 1 });
    assert.deepEqual(by.vr, { playerId: "vr", runs: 101, wickets: 0, catches: 0 }); // run out gives nothing
    assert.deepEqual(by.hk, { playerId: "hk", runs: 0, wickets: 3, catches: 1 }); // c & b
    assert.deepEqual(by.aa, { playerId: "aa", runs: 12, wickets: 0, catches: 1 }); // stumping
    assert.equal(by.zm.wickets, 1);
    assert.equal(d.stats.length, 11);
    // Opposition bowler "Grant" never credited to us; unknown names surfaced, not guessed
    assert.deepEqual(d.unmatched.map((u) => `${u.name}:${u.field}:${u.amount}`).sort(), ["Dave Guest:runs:3", "Smith:catches:1"]);
  });

  it("reads losses, ties and no-results", () => {
    assert.equal(deriveFantasyStats(card({ winner_team_name: "Ottawa Rivals", result_text: "Ottawa Rivals won by 4 wickets" }), XI).winningTeam, "OPPONENT");
    assert.equal(deriveFantasyStats(card({ winner_team_name: "", result_text: "Match tied" }), XI).winningTeam, "TIE");
    assert.equal(deriveFantasyStats(card({ winner_team_name: "", result_text: "No result" }), XI).winningTeam, "NO_RESULT");
    const missing = deriveFantasyStats(card({ winner_team_name: "", result_text: "" }), XI);
    assert.equal(missing.winningTeam, null);
    assert.ok(missing.warnings.some((w) => /result/.test(w)));
  });

  it("warns when MOTM is an opposition player", () => {
    const d = deriveFantasyStats(card({ player_of_the_match: "Lee Chong" }), XI);
    assert.equal(d.motmPlayerId, null);
    assert.ok(d.warnings.some((w) => /Man of the Match/.test(w)));
  });

  it("finds Canterbury's innings by player names when team names are missing", () => {
    const c = card();
    c.innings[0].batting_team = "Team A";
    c.innings[1].batting_team = "Team B";
    const d = deriveFantasyStats(c, XI);
    assert.equal(d.stats.find((s) => s.playerId === "sp").runs, 64);
    assert.ok(d.warnings.some((w) => /matching player names/.test(w)));
  });
});
