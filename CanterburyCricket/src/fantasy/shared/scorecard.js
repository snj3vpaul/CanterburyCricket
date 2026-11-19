/**
 * CricHeroes scorecard → fantasy stats.
 *
 * Step 1 (api/_lib/fantasy/extract.js): Claude reads the uploaded PDF / screenshots /
 *         pasted text and TRANSCRIBES the scorecard into SCORECARD_SCHEMA. No judgement.
 * Step 2 (this file, pure + tested): we derive everything the fantasy league needs —
 *         which innings is Canterbury's, runs, wickets, catches/stumpings (parsed from the
 *         opposition's dismissal text), the winner and Man of the Match — and match the
 *         CricHeroes names to the Playing XI. Anything uncertain is returned for the admin
 *         to resolve; nothing is saved until the admin taps "Save & score".
 */
import { z } from "zod";

// ── What Claude must return (JSON Schema for structured outputs) ─────────────

const str = (description) => ({ type: "string", description });
const int = (description) => ({ type: "integer", description });

export const SCORECARD_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["teams", "result_text", "winner_team_name", "player_of_the_match", "innings", "unreadable_notes"],
  properties: {
    teams: { type: "array", items: { type: "string" }, description: "The two team names exactly as printed." },
    result_text: str('The result line exactly as printed, e.g. "Canterbury T20 won by 23 runs". Empty string if not shown.'),
    winner_team_name: str('Name of the winning team as printed. Empty string if tied, no result, abandoned or not shown.'),
    player_of_the_match: str("Player of the Match / Man of the Match name as printed. Empty string if not shown."),
    innings: {
      type: "array",
      description: "Every innings in the order played.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["batting_team", "batting", "bowling"],
        properties: {
          batting_team: str("Name of the team batting in this innings, as printed."),
          batting: {
            type: "array",
            description: "Every batting row, including 'not out'. Omit players who did not bat.",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "dismissal", "runs"],
              properties: {
                name: str("Batter name as printed (drop * captain and † keeper marks)."),
                dismissal: str('Dismissal text exactly as printed, e.g. "c Paul b Khan", "st †Ali b Rao", "c & b Rao", "run out (Smith)", "not out", "lbw b Rao".'),
                runs: int("Runs scored (0 or more)."),
              },
            },
          },
          bowling: {
            type: "array",
            description: "Every bowling row for this innings (bowlers from the fielding side).",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "wickets"],
              properties: {
                name: str("Bowler name as printed."),
                wickets: int("Wickets taken (0 or more)."),
              },
            },
          },
        },
      },
    },
    unreadable_notes: str("Anything you could not read clearly. Empty string if everything was legible."),
  },
};

const nonNeg = z.coerce.number().int().min(0).max(1000);
export const scorecardSchema = z.object({
  teams: z.array(z.string()).max(4),
  result_text: z.string(),
  winner_team_name: z.string(),
  player_of_the_match: z.string(),
  innings: z
    .array(
      z.object({
        batting_team: z.string(),
        batting: z.array(z.object({ name: z.string().min(1), dismissal: z.string(), runs: nonNeg })).max(15),
        bowling: z.array(z.object({ name: z.string().min(1), wickets: nonNeg.max(10) })).max(15),
      }),
    )
    .min(1, { message: "No innings were found in the scorecard." })
    .max(4),
  unreadable_notes: z.string(),
});

// ── Name matching ────────────────────────────────────────────────────────────

/** "†Sanjeev K. Paul (c)" → ["sanjeev", "k", "paul"] */
export function nameTokens(raw) {
  return String(raw ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\((c|wk|vc|sub)\)/gi, " ")
    .replace(/[†*]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function similarity(a, b) {
  const x = nameTokens(a);
  const y = nameTokens(b);
  if (!x.length || !y.length) return 0;
  if (x.join(" ") === y.join(" ")) return 100;
  const [fx, lx] = [x[0], x[x.length - 1]];
  const [fy, ly] = [y[0], y[y.length - 1]];
  if (fx === fy && lx === ly) return 90; // middle initials differ
  const sx = new Set(x);
  const sy = new Set(y);
  const long = (t) => t.length > 1;
  const xInY = x.filter(long).every((t) => sy.has(t));
  const yInX = y.filter(long).every((t) => sx.has(t));
  if ((xInY && x.some(long)) || (yInX && y.some(long))) return 80; // "Paul" ⊂ "Sanjeev K Paul"
  if (lx === ly && (fx[0] === fy[0])) return 75; // "S Paul" vs "Sanjeev Paul"
  if (x.length === 1 || y.length === 1) {
    const single = x.length === 1 ? x[0] : y[0];
    const other = x.length === 1 ? sy : sx;
    if (single.length > 2 && other.has(single)) return 70;
  }
  return 0;
}

/**
 * Best unique match for `name` among `players` ({id, name}). Returns the player or null.
 * Ambiguous (two players tie for the best score) → null, so the admin decides.
 */
export function matchPlayer(name, players, minScore = 70) {
  let best = null;
  let bestScore = 0;
  let tie = false;
  for (const p of players) {
    const s = similarity(name, p.name);
    if (s > bestScore) {
      best = p;
      bestScore = s;
      tie = false;
    } else if (s === bestScore && s > 0 && p.id !== best?.id) {
      tie = true;
    }
  }
  return bestScore >= minScore && !tie ? best : null;
}

// ── Dismissals → fielding credit ─────────────────────────────────────────────

/**
 * Who gets fielding credit for a dismissal?
 *   "c Paul b Khan" → { kind: "catch", fielder: "Paul" }
 *   "c & b Khan" / "c and b Khan" → { kind: "catch", fielder: "Khan" }  (bowler caught it)
 *   "st †Ali b Rao" → { kind: "stumping", fielder: "Ali" }
 *   "c sub (Rahul) b Khan" → { kind: "catch", fielder: "Rahul", substitute: true }
 *   run out / lbw / bowled / not out → null (no catch/stumping points)
 */
export function fieldingCredit(dismissal) {
  const d = String(dismissal ?? "").replace(/\s+/g, " ").trim();
  let m = d.match(/^c\s*(?:&|and)\s*b\s+(.+)$/i);
  if (m) return { kind: "catch", fielder: clean(m[1]) };
  m = d.match(/^c\s+sub\s*(?:\(([^)]+)\))?\s*b\s+/i);
  if (m) return m[1] ? { kind: "catch", fielder: clean(m[1]), substitute: true } : null;
  m = d.match(/^c\s+(.+?)\s+b\s+.+$/i);
  if (m) return { kind: "catch", fielder: clean(m[1]) };
  m = d.match(/^st\s+(.+?)\s+b\s+.+$/i);
  if (m) return { kind: "stumping", fielder: clean(m[1]) };
  return null;
}
const clean = (s) => s.replace(/[†*]/g, "").replace(/\((c|wk|vc)\)/gi, "").trim();

// ── Derive the fantasy result ────────────────────────────────────────────────

const isCanterbury = (team) => /canterbury/i.test(team ?? "");

/**
 * @param scorecard  validated output of scorecardSchema
 * @param xi         the match's Canterbury Playing XI: [{ id, name }]
 * @returns {{ winningTeam, motmPlayerId, stats, unmatched, warnings, summary }}
 *   stats      one { playerId, runs, wickets, catches } per XI player
 *   unmatched  CricHeroes names we couldn't tie to an XI player, with their numbers,
 *              so the admin can assign them in the form
 */
export function deriveFantasyStats(scorecard, xi) {
  const warnings = [];
  const unmatched = [];
  const stats = Object.fromEntries(xi.map((p) => [p.id, { playerId: p.id, runs: 0, wickets: 0, catches: 0 }]));

  // Which innings did Canterbury bat? Prefer the team name; fall back to whichever
  // batting card best matches our XI (for scorecards that only show short names).
  let ours = scorecard.innings.filter((inn) => isCanterbury(inn.batting_team));
  if (!ours.length) {
    const hits = scorecard.innings.map((inn) => inn.batting.filter((b) => matchPlayer(b.name, xi)).length);
    const best = Math.max(...hits);
    if (best >= 3) {
      ours = scorecard.innings.filter((_, i) => hits[i] === best);
      warnings.push("Couldn't see \"Canterbury\" in the team names — picked Canterbury's innings by matching player names.");
    } else {
      warnings.push("Couldn't tell which innings was Canterbury's. Check the numbers before saving.");
    }
  }
  const theirs = scorecard.innings.filter((inn) => !ours.includes(inn));

  const credit = (name, field, amount, context) => {
    if (!amount) return;
    const p = matchPlayer(name, xi);
    if (p) stats[p.id][field] += amount;
    else unmatched.push({ name, field, amount, context });
  };

  // Runs: Canterbury's batting card(s)
  for (const inn of ours) for (const b of inn.batting) credit(b.name, "runs", b.runs, "batting");

  // Wickets: Canterbury's bowlers appear in the opposition's innings
  for (const inn of theirs) for (const b of inn.bowling) credit(b.name, "wickets", b.wickets, "bowling");

  // Catches & stumpings: parsed from how the opposition got out
  for (const inn of theirs) {
    for (const b of inn.batting) {
      const c = fieldingCredit(b.dismissal);
      if (!c) continue;
      credit(c.fielder, "catches", 1, `${c.kind}${c.substitute ? " (substitute)" : ""}: ${b.name} ${b.dismissal}`);
    }
  }

  // Merge duplicate unmatched names so the admin assigns each person once.
  const merged = [];
  for (const u of unmatched) {
    const hit = merged.find((m) => m.field === u.field && nameTokens(m.name).join(" ") === nameTokens(u.name).join(" "));
    if (hit) hit.amount += u.amount;
    else merged.push({ ...u });
  }

  // Result
  const resultText = `${scorecard.winner_team_name} ${scorecard.result_text}`.trim();
  let winningTeam;
  if (/\b(tie|tied)\b/i.test(resultText)) winningTeam = "TIE";
  else if (/no result|abandon|cancel|washed out/i.test(resultText)) winningTeam = "NO_RESULT";
  else if (isCanterbury(scorecard.winner_team_name) || /^canterbury[^,]*\bwon\b/i.test(scorecard.result_text)) winningTeam = "CANTERBURY";
  else if (scorecard.winner_team_name.trim() || /\bwon\b/i.test(scorecard.result_text)) winningTeam = "OPPONENT";
  else {
    winningTeam = null;
    warnings.push("The result wasn't on the scorecard — pick it below.");
  }

  // Man of the Match (only Canterbury XI players earn the bonus)
  let motmPlayerId = null;
  if (scorecard.player_of_the_match.trim()) {
    const p = matchPlayer(scorecard.player_of_the_match, xi);
    if (p) motmPlayerId = p.id;
    else warnings.push(`Man of the Match "${scorecard.player_of_the_match}" isn't in the Canterbury XI (or the name didn't match) — no MOTM bonus set.`);
  }

  if (scorecard.unreadable_notes.trim()) warnings.push(`Parts of the scorecard were hard to read: ${scorecard.unreadable_notes.trim()}`);
  for (const [id, line] of Object.entries(stats)) {
    if (line.wickets > 10) warnings.push(`${xi.find((p) => p.id === id).name} has more than 10 wickets — check the scorecard.`);
  }

  const opponent = scorecard.teams.find((t) => !isCanterbury(t)) ?? theirs[0]?.batting_team ?? "";
  return {
    winningTeam,
    motmPlayerId,
    stats: Object.values(stats).map((s) => ({ ...s, wickets: Math.min(10, s.wickets), catches: Math.min(10, s.catches) })),
    unmatched: merged,
    warnings,
    summary: { resultText: scorecard.result_text || scorecard.winner_team_name, opponent, innings: scorecard.innings.length },
  };
}
