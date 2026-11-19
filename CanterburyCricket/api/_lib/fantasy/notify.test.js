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
