import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registrationEmail } from "./notify.js";
import { makeDecisionToken, parseDecisionToken } from "./auth.js";

describe("decision link tokens", () => {
  it("round-trips, and rejects tampering, unknown decisions and expiry", () => {
    const t = makeDecisionToken("user-1", "APPROVE");
    assert.deepEqual(parseDecisionToken(t), { userId: "user-1", decision: "APPROVE" });
    assert.deepEqual(parseDecisionToken(t.replace("user-1", "user-2")), { error: "invalid" });
    assert.deepEqual(parseDecisionToken(t.replace("APPROVE", "REJECT")), { error: "invalid" });
    assert.deepEqual(parseDecisionToken("nonsense"), { error: "invalid" });
    assert.deepEqual(parseDecisionToken(t, Date.now() + 8 * 86400000), { error: "expired" });
    assert.throws(() => makeDecisionToken("user-1", "DELETE"));
  });
});

describe("admin registration email", () => {
  const msg = registrationEmail({
    name: 'Eve <script>alert(1)</script> "Hacker"',
    email: "eve@example.com",
    approveUrl: "https://site.test/fantasy/decide?t=APPROVE_TOKEN",
    rejectUrl: "https://site.test/fantasy/decide?t=REJECT_TOKEN",
    adminUrl: "https://site.test/fantasy/admin",
  });
  it("has Approve and Reject buttons (HTML) and links (plain text)", () => {
    assert.match(msg.html, /href="https:\/\/site\.test\/fantasy\/decide\?t=APPROVE_TOKEN"[^>]*>Approve</);
    assert.match(msg.html, /href="https:\/\/site\.test\/fantasy\/decide\?t=REJECT_TOKEN"[^>]*>Reject</);
    assert.match(msg.text, /APPROVE:\nhttps:\/\/site\.test\/fantasy\/decide\?t=APPROVE_TOKEN/);
    assert.match(msg.text, /REJECT:\nhttps:\/\/site\.test\/fantasy\/decide\?t=REJECT_TOKEN/);
  });
  it("can't be HTML-injected through the player's name", () => {
    assert.doesNotMatch(msg.html, /<script>/);
    assert.doesNotMatch(msg.subject, /[<>\r\n]/);
  });
});

import { hashPassword, makeToken, needsRehash, parseToken, verifyPassword } from "./auth.js";
import { scryptSync, randomBytes } from "node:crypto";

describe("password storage (A02)", () => {
  it("uses OWASP scrypt cost and upgrades first-release hashes", async () => {
    const h = await hashPassword("correct horse 42");
    assert.match(h, /^scrypt\$v2\$131072\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    assert.equal(await verifyPassword("correct horse 42", h), true);
    assert.equal(await verifyPassword("wrong horse 42", h), false);
    assert.equal(needsRehash(h), false);

    const salt = randomBytes(16);
    const legacy = `scrypt$${salt.toString("hex")}$${scryptSync("old-password-1", salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex")}`;
    assert.equal(await verifyPassword("old-password-1", legacy), true, "existing members can still sign in");
    assert.equal(needsRehash(legacy), true, "and get upgraded");
  });

  it("verifies against a dummy hash for unknown emails (same work, never true)", async () => {
    assert.equal(await verifyPassword("anything", undefined), false);
  });
});

describe("sessions (A07)", () => {
  it("admin sessions last 7 days, member sessions 30", () => {
    const now = Date.now();
    const exp = (role) => Number(makeToken({ id: "u", sessionVersion: 1, role }, now).split(".")[2]) - now;
    assert.equal(exp("ADMIN"), 7 * 86400000);
    assert.equal(exp("MEMBER"), 30 * 86400000);
  });
  it("rejects tampered and expired session tokens", () => {
    const t = makeToken({ id: "u1", sessionVersion: 3, role: "MEMBER" });
    assert.deepEqual(parseToken(t), { id: "u1", version: 3 });
    assert.equal(parseToken(t.replace("u1.3", "u1.4")), null);
    assert.equal(parseToken(t, Date.now() + 31 * 86400000), null);
  });
});
