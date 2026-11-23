// Turns rows from the club squad sheet (/api/squad) into clean player records.
// The sheet is filled in by players themselves, so names, roles and numbers arrive in many spellings.

export const ROLE_GROUPS = [
  { key: "Batter", plural: "Batters" },
  { key: "Wicket-keeper", plural: "Wicket-keepers" },
  { key: "All-rounder", plural: "All-rounders" },
  { key: "Bowler", plural: "Bowlers" },
  { key: "Squad", plural: "Squad players" }, // players who haven't given a role yet
];

export function normalizeRole(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (!s.trim()) return "Squad";
  if (/wicket|keeper|\bwk\b/.test(s)) return "Wicket-keeper";
  if (/all|r[o]?u?nder/.test(s)) return "All-rounder";
  const bowls = /bowl|spin|orthodox|seam|pace|fast|medium/.test(s);
  const bats = /bat|open(ing|er)\b|order/.test(s);
  if (bowls && bats) return "All-rounder";
  if (bowls) return "Bowler";
  if (bats) return "Batter";
  return "Squad";
}

// "VIKRAM ARORA" -> "Vikram Arora"; leaves mixed-case names and quoted nicknames alone.
export function tidyName(raw) {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!name || name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s'"-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

export function splitName(name) {
  const parts = name.split(" ");
  const last = parts.length > 1 ? parts.pop() : parts[0];
  return { first: parts.length ? parts.join(" ") : "", last };
}

// Google Drive share link -> direct image, resized by Google to `width` px so phones don't download full camera files.
export function driveImage(input, width = 640) {
  const url = String(input ?? "").split(/[\n,]/).map((s) => s.trim()).find((s) => /^https?:\/\//i.test(s));
  if (!url) return "";
  const id = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)?.[1] || url.match(/[?&]id=([^&]+)/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${width}` : url;
}

const HAND = { RHB: "Right-hand bat", LHB: "Left-hand bat" };
const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function toPlayer(row, i) {
  const name = tidyName(row["Full Name"]) || `Player ${i + 1}`;
  const jersey = String(row["Jersey Number"] ?? "").trim();
  const batting = String(row["Playing Style"] ?? "").trim();
  const bowling = String(row["Bowling Style"] ?? "").trim();
  const number = parseInt(jersey, 10);
  return {
    id: `${name}-${i}`,
    name,
    ...splitName(name),
    initials: name.split(" ").filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    role: normalizeRole(row["Playing Role"]),
    jersey,
    sortNumber: Number.isFinite(number) ? number : 999,
    batting: HAND[batting.toUpperCase()] ?? batting,
    bowling: bowling ? sentence(bowling) : "",
    photo: driveImage(row["Photo for Squad Banner"]),
  };
}

export const byNumberThenName = (a, b) => a.sortNumber - b.sortNumber || a.name.localeCompare(b.name);
