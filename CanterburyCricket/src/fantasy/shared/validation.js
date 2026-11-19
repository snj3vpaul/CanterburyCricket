/**
 * Zod schemas + rules shared by the browser (instant feedback) and the API (the authority).
 */
import { z } from "zod";
import { PICK_COUNT, XI_SIZE } from "./scoring.js";

export const PLAYER_ROLES = ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];
export const ROLE_LABEL = {
  BATTER: "Batter",
  WICKET_KEEPER: "Wicket-Keeper",
  ALL_ROUNDER: "All-Rounder",
  BOWLER: "Bowler",
};

export const MIN_BATTERS = 2;
export const MIN_BOWLERS = 2;
export const isBattingRole = (r) => r === "BATTER" || r === "WICKET_KEEPER";

/** ≥2 Batters/Keepers and ≥2 Bowlers/All-Rounders. */
export function compositionErrors(roles) {
  const batters = roles.filter(isBattingRole).length;
  const bowlers = roles.length - batters;
  const errors = [];
  if (batters < MIN_BATTERS) errors.push(`Pick at least ${MIN_BATTERS} Batters or Wicket-Keepers (you have ${batters}).`);
  if (bowlers < MIN_BOWLERS) errors.push(`Pick at least ${MIN_BOWLERS} Bowlers or All-Rounders (you have ${bowlers}).`);
  return errors;
}

/** Map the club squad sheet's free-text "Playing Role" to a fantasy role (same rules as OurSquad.jsx). */
export function normalizeSheetRole(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s.includes("wicket") || s === "wk" || s.includes("keeper")) return "WICKET_KEEPER";
  if (s.includes("all")) return "ALL_ROUNDER";
  if (s.includes("bowl")) return "BOWLER";
  if (s.includes("bat")) return "BATTER";
  return "ALL_ROUNDER";
}

const id = z.string().min(1).max(80);
const email = z
  .string()
  .trim()
  .max(254, { message: "That email is too long." })
  .pipe(z.email({ message: "Enter a valid email." }))
  .transform((e) => e.toLowerCase());

// Letters (any language), spaces, apostrophes, dots and hyphens: no markup, links or control characters.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

// The most-used passwords from public breach lists. A full breached-password check needs a network
// service; this blocks the guesses attackers try first, at no cost.
const COMMON_PASSWORDS = new Set(
  `123456 123456789 12345678 1234567890 password password1 password123 qwerty qwerty123 qwertyuiop 111111
  123123 1234567 000000 iloveyou abc123 abcd1234 1q2w3e4r 1qaz2wsx admin admin123 welcome welcome1 letmein
  monkey dragon football baseball sunshine princess master shadow superman trustno1 passw0rd p@ssw0rd
  cricket cricket123 canterbury canterbury1 canterbury123 ottawa ottawa123 changeme 987654321 11111111
  12341234 asdfghjk zxcvbnm1 google123 india123 pakistan123 srilanka123 bangladesh123 sachin10 virat18`
    .split(/\s+/)
    .filter(Boolean),
);

// ── Squad identity ──────────────────────────────────────────────────────────

/** "Jaideep \"JD\" Grover " → ["jaideep", "grover"]  (accents, nicknames in quotes/brackets, punctuation removed) */
export function personTokens(raw) {
  return String(raw ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(^|\s)["“'‘][^"“”'‘’]*["”'’](?=\s|$)/g, " ") // quoted nicknames: 'Jaideep "JD" Grover'
    .replace(/['’]/g, "") // O'Neill → oneill
    .replace(/\([^)]*\)/g, " ") // bracketed notes
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Does the name someone typed match the squad sheet? Same first and last name;
 * middle names/initials can be left out on either side. Case, accents and spacing don't matter.
 *   "Sanjeev Paul"  ↔ "Sanjeev K Paul"      ✓
 *   "vikram arora"  ↔ "VIKRAM ARORA"        ✓
 *   "Jaideep Grover" ↔ 'Jaideep "JD" Grover' ✓
 *   "Sanjeev Kumar" ↔ "Sanjeev K Paul"      ✗
 */
export function namesMatch(typed, squad) {
  const t = personTokens(typed);
  const s = personTokens(squad);
  if (!t.length || !s.length) return false;
  if (s.length === 1) return t[0] === s[0];
  if (t.length < 2) return false;
  return t[0] === s[0] && t[t.length - 1] === s[s.length - 1];
}

export const USERNAME_RULE = "3–20 letters, numbers, dots, dashes or underscores, starting with a letter or number.";
const RESERVED_USERNAMES = new Set(
  "admin administrator moderator mod mods canterbury canterburycc ccc club official staff support system root owner committee captain fantasy league null undefined".split(" "),
);

/**
 * Problems with a chosen username. It must not be reserved, and must not spell another
 * squad player's name (so nobody can pose as a teammate on the leaderboard).
 */
export function usernameProblems(username, { otherSquadNames = [] } = {}) {
  const u = String(username ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,19}$/.test(u)) return [`Username: ${USERNAME_RULE}`];
  const squashed = u.toLowerCase().replace(/[^a-z]/g, "");
  if (RESERVED_USERNAMES.has(u.toLowerCase()) || RESERVED_USERNAMES.has(squashed) || /admin|moderat|canterbury|official/.test(squashed)) {
    return ["That username is reserved. Pick another."];
  }
  for (const other of otherSquadNames) {
    const t = personTokens(other);
    if (t.length >= 2) {
      const full = t[0] + t[t.length - 1];
      if (full.length >= 6 && squashed.includes(full)) return ["That username looks like another player's name. Pick another."];
    }
  }
  return [];
}

export function passwordProblems(password, { email = "", name = "" } = {}) {
  const p = String(password ?? "");
  const lower = p.toLowerCase();
  const problems = [];
  if (COMMON_PASSWORDS.has(lower)) problems.push("That password is too common. Pick something harder to guess.");
  const local = String(email).split("@")[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) problems.push("Don't use your email address in your password.");
  const first = String(name).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first.length >= 4 && lower.includes(first)) problems.push("Don't use your name in your password.");
  if (/^(.)\1+$/.test(p)) problems.push("That password is too easy to guess.");
  return problems;
}

export const predictionSchema = z
  .object({
    matchId: id,
    selectedPlayerIds: z
      .array(id)
      .length(PICK_COUNT, { message: `Select exactly ${PICK_COUNT} players.` })
      .refine((ids) => new Set(ids).size === ids.length, { message: "Each player can only be picked once." }),
    captainId: z.string({ message: "Choose a captain." }).min(1, { message: "Choose a captain." }),
  })
  .refine((v) => !v.captainId || v.selectedPlayerIds.includes(v.captainId), {
    message: "Your captain must be one of your 5 players.",
    path: ["captainId"],
  });

const count = (max) => z.coerce.number().int().min(0, { message: "Stats cannot be negative." }).max(max);

export const matchResultSchema = z.object({
  matchId: id,
  winningTeam: z.enum(["CANTERBURY", "OPPONENT", "TIE", "NO_RESULT"], { message: "Select the match result." }),
  motmPlayerId: id.nullable(),
  stats: z
    .array(z.object({ playerId: id, runs: count(400), wickets: count(10), catches: count(10) }))
    .min(1)
    .max(XI_SIZE),
});

export const registerSchema = z
  .object({
    // Required for everyone except the club's moderator account (checked on the server).
    playerId: z.string().trim().max(80).optional().default(""),
    username: z.string().trim().max(20, { message: `Username: ${USERNAME_RULE}` }).optional().default(""),
    name: z
      .string()
      .trim()
      .min(2, { message: "Enter your full name." })
      .max(60, { message: "That name is too long." })
      .regex(PERSON_NAME, { message: "Use letters only in your name (spaces, ' . - are fine)." }),
    email,
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(128, { message: "Password must be at most 128 characters." }),
  })
  .superRefine((v, ctx) => {
    for (const message of passwordProblems(v.password, v)) ctx.addIssue({ code: "custom", path: ["password"], message });
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: "Enter your password." }).max(128, { message: "Incorrect email or password." }),
});

export const createMatchSchema = z.object({
  opponent: z.string().trim().min(2, { message: "Enter the opponent." }).max(80),
  venue: z.string().trim().min(2, { message: "Enter the venue." }).max(120),
  date: z.iso.datetime({ message: "Pick a valid start time.", offset: true }),
  matchType: z.enum(["T20", "T30", "ONE_DAY", "TWO_DAY"]),
});

export const playingXISchema = z.object({
  matchId: id,
  playerIds: z
    .array(id)
    .length(XI_SIZE, { message: `The Playing XI must have exactly ${XI_SIZE} players.` })
    .refine((ids) => new Set(ids).size === ids.length, { message: "Duplicate players in the XI." }),
});

export const addPlayerSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter the player's name." }).max(60),
  role: z.enum(PLAYER_ROLES),
});

export const allowedEmailsSchema = z.object({
  emails: z
    .string()
    .transform((raw) => [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))])
    .pipe(z.array(z.email({ message: "One of the emails is invalid." })).min(1, { message: "Enter at least one email." }).max(300)),
});

// ~3.3 MB of base64 in total keeps the request under Vercel's 4.5 MB body limit.
export const MAX_UPLOAD_BASE64 = 3_300_000;
export const scorecardUploadSchema = z
  .object({
    matchId: id,
    files: z
      .array(
        z.object({
          name: z.string().max(200).optional(),
          mediaType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"], {
            message: "Upload a PDF or an image (JPG, PNG, WebP).",
          }),
          data: z.string().min(1).regex(/^[A-Za-z0-9+/=]+$/, { message: "A file couldn't be read." }),
        }),
      )
      .max(4, { message: "Upload at most 4 files." })
      .default([]),
    text: z.string().max(30_000).default(""),
  })
  .refine((v) => v.files.length > 0 || v.text.trim().length > 20, { message: "Upload the scorecard PDF/screenshots or paste the scorecard text." })
  .refine((v) => v.files.reduce((n, f) => n + f.data.length, 0) <= MAX_UPLOAD_BASE64, {
    message: "The upload is too large. Use the PDF, or fewer/smaller screenshots.",
  });

/** First message per issue, de-duplicated — what the UI shows. */
export const issuesOf = (error) => [...new Set(error.issues.map((i) => i.message))];
