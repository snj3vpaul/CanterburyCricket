import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { namesMatch, usernameProblems } from "./validation.js";

describe("namesMatch: typed full name vs squad sheet", () => {
  const yes = [
    ["Sanjeev Paul", "Sanjeev K Paul"],
    ["Sanjeev K Paul", "Sanjeev Paul"],
    ["sanjeev k. paul", "Sanjeev K Paul"],
    ["VIKRAM ARORA", "Vikram Arora"],
    ["Jaideep Grover", 'Jaideep "JD" Grover'],
    ["Jawad Taqavi", "Jawad Taqavi "],
    ["Abdus Mufti", "Abdus Samad Mufti"],
    ["Zoë Brien", "Zoe Brien"],
    ["Chris O'Neill", "Chris O'Neill"],
    ["chris oneill", "Chris O’Neill"],
    ["Ryan D'Souza", "Ryan Mark D'Souza"],
    ["Ehsan Khan", "Ehsan 'Easy' Khan"],
  ];
  const no = [
    ["Samad Mufti", "Abdus Samad Mufti"],
    ["Sanjeev Kumar", "Sanjeev K Paul"],
    ["Akhter", "Akhter Mufti"],
    ["Paul Sanjeev", "Sanjeev Paul"],
    ["", "Sanjeev Paul"],
    ["Chris Neill", "Chris O'Neill"],
  ];
  for (const [a, b] of yes) it(`${a} ✓ ${b}`, () => assert.equal(namesMatch(a, b), true));
  for (const [a, b] of no) it(`${a} ✗ ${b}`, () => assert.equal(namesMatch(a, b), false));
});

describe("usernameProblems", () => {
  const others = ["Vikram Arora", "Varun Harish"];
  it("accepts ordinary handles", () => {
    for (const u of ["rahul_33", "sixer-king", "vikram", "J.D"]) assert.deepEqual(usernameProblems(u, { otherSquadNames: others }), [], u);
  });
  it("refuses bad format, reserved words and teammates' names", () => {
    for (const u of ["ab", "_lead", "way-too-long-username-x", "has space", "admin", "Admin.", "MODERATOR", "TheAdmin", "admin_bob", "ccc_official", "CanterburyKing", "VikramArora", "vikram.arora99", "the_varunharish"]) {
      assert.ok(usernameProblems(u, { otherSquadNames: others }).length, u);
    }
  });
});
