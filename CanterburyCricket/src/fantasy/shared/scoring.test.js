// Run: npm run test:fantasy   (Node's built-in test runner — no extra dependencies)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POINTS, describeItem, scorePlayer, scorePrediction } from "./scoring.js";
import { compositionErrors, predictionSchema } from "./validation.js";

const XI = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
const base = { winningTeam: "OPPONENT", motmPlayerId: null, playingXI: XI, stats: [] };
const sum = (items) => items.reduce((s, i) => s + i.points, 0);
const line = (runs, wickets, catches) => ({ ...base, stats: [{ playerId: "a", runs, wickets, catches }] });

describe("scorePlayer", () => {
  it("49 runs scores nothing; 50 scores the fifty bonus", () => {
    assert.equal(sum(scorePlayer("a", line(49, 0, 0))), 0);
    assert.equal(sum(scorePlayer("a", line(50, 0, 0))), POINTS.FIFTY);
  });
  it("a hundred replaces the fifty bonus (25, not 35)", () => {
    assert.equal(sum(scorePlayer("a", line(112, 0, 0))), 25);
  });
  it("wickets: 15 each, +10 bonus at 3+", () => {
    assert.equal(sum(scorePlayer("a", line(0, 2, 0))), 30);
    assert.equal(sum(scorePlayer("a", line(0, 3, 0))), 55);
  });
  it("catches 5 each, win +5, MOTM +10", () => {
    const r = { ...line(0, 0, 2), winningTeam: "CANTERBURY", motmPlayerId: "a" };
    assert.equal(sum(scorePlayer("a", r)), 25);
  });
  it("tie gives no win bonus", () => {
    assert.equal(sum(scorePlayer("a", { ...base, winningTeam: "TIE" })), 0);
  });
  it("a player outside the XI scores nothing", () => {
    assert.deepEqual(scorePlayer("zz", { ...base, winningTeam: "CANTERBURY", motmPlayerId: "zz" }), []);
  });
});

describe("scorePrediction", () => {
  it("doubles only the captain, and picks add up to the total", () => {
    const r = {
      ...base,
      winningTeam: "CANTERBURY",
      stats: [
        { playerId: "a", runs: 55, wickets: 0, catches: 0 }, // 10 + 5 = 15 → C 30
        { playerId: "b", runs: 0, wickets: 3, catches: 1 }, // 45 + 10 + 5 + 5 = 65
      ],
    };
    const s = scorePrediction({ selectedPlayerIds: ["a", "b", "c", "d", "e"], captainId: "a" }, r);
    assert.equal(s.picks[0].total, 30);
    assert.equal(s.picks[1].total, 65);
    assert.equal(s.total, 30 + 65 + 3 * 5);
  });
  it("formats the captain breakdown line", () => {
    assert.equal(describeItem({ label: "50+ Runs (55)", points: 10 }, 2), "50+ Runs (55) (10) x2 Captain = 20 pts");
  });
});

describe("validation", () => {
  const ok = (v) => predictionSchema.safeParse({ matchId: "m", ...v }).success;
  it("needs exactly 5 unique players with the captain among them", () => {
    assert.equal(ok({ selectedPlayerIds: ["a", "b", "c", "d"], captainId: "a" }), false);
    assert.equal(ok({ selectedPlayerIds: ["a", "a", "c", "d", "e"], captainId: "a" }), false);
    assert.equal(ok({ selectedPlayerIds: ["a", "b", "c", "d", "e"], captainId: "z" }), false);
    assert.equal(ok({ selectedPlayerIds: ["a", "b", "c", "d", "e"], captainId: "c" }), true);
  });
  it("enforces 2 batters + 2 bowlers", () => {
    assert.equal(compositionErrors(["BATTER", "BATTER", "BATTER", "BATTER", "WICKET_KEEPER"]).length, 1);
    assert.equal(compositionErrors(["BATTER", "WICKET_KEEPER", "BOWLER", "ALL_ROUNDER", "BATTER"]).length, 0);
  });
});
