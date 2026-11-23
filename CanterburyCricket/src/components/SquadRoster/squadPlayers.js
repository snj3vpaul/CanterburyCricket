// Turns raw rows from the club's squad sign-up sheet (via /api/squad) into tidy player records.
// The sheet is filled in by players themselves, so names, roles and styles arrive in many spellings.

export const ROLE_GROUPS = [
  { role: "Batter", plural: "Batters" },
  { role: "Wicket-keeper", plural: "Wicket-keepers" },
  { role: "All-rounder", plural: "All-rounders" },
  { role: "Bowler", plural: "Bowlers" },
  { role: "", plural: "Squad" }, // role not given on the sheet
];

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

// "VIKRAM ARORA" -> "Vikram Arora"; names typed with any lowercase letters are left as the player wrote them.
export function tidyName(raw) {
  const name = clean(raw);
  if (!name || /[a-z]/.test(name)) return name;
  return name.toLowerCase().replace(/(^|[\s"'(-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

export function tidyRole(raw) {
  const s = clean(raw).toLowerCase();
  if (!s) return "";
  if (/wicket|keeper|\bwk\b/.test(s)) return "Wicket-keeper";
  if (/all|ronder/.test(s) || (/bowl/.test(s) && /bat/.test(s))) return "All-rounder";
  if (/bowl|spin|orthodox|fast|seam|pace|medium/.test(s)) return "Bowler";
  if (/bat|open/.test(s)) return "Batter";
  return "";
}

export function tidyBatting(raw) {
  const s = clean(raw).toUpperCase();
  if (s === "RHB") return "Right-hand bat";
  if (s === "LHB") return "Left-hand bat";
  return clean(raw);
}

// "Right-Arm Offspin" -> "Right-arm off spin"
export function tidyBowling(raw) {
  const s = clean(raw).toLowerCase().replace("offspin", "off spin").replace("legspin", "leg spin");
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

// Google Drive share links -> a direct image URL. `size` asks Google for a resized copy (much smaller download).
export function driveImage(raw, size) {
  const url = clean(raw).split(/[\n,]/).map(clean).find((s) => /^https?:\/\//i.test(s));
  if (!url) return "";
  const id = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)?.[1] || url.match(/[?&]id=([^&]+)/)?.[1];
  if (!id) return url;
  return `https://lh3.googleusercontent.com/d/${id}${size ? `=w${size}` : ""}`;
}

export function jerseyNumber(raw) {
  const n = parseInt(clean(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function initials(name) {
  const parts = name.replace(/["'].*?["']/g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "CC";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function toPlayer(row, i) {
  const name = tidyName(row["Full Name"]) || `Player ${i + 1}`;
  const photo = row["Photo for Squad Banner"];
  return {
    id: `${name}-${i}`,
    name,
    role: tidyRole(row["Playing Role"]),
    batting: tidyBatting(row["Playing Style"]),
    bowling: tidyBowling(row["Bowling Style"]),
    number: jerseyNumber(row["Jersey Number"]),
    // Exact number as written on the sheet ("00" and "07" are different shirts to "0" and "7").
    numberLabel: clean(row["Jersey Number"]).replace(/^0+(?=\d{2})/, ""),
    thumb: driveImage(photo, 160),
    portrait: driveImage(photo, 900),
    original: driveImage(photo),
  };
}

// Jersey order, players without a number last (alphabetical).
export function byJersey(a, b) {
  if (a.number != null && b.number != null) return a.number - b.number || a.name.localeCompare(b.name);
  if (a.number != null) return -1;
  if (b.number != null) return 1;
  return a.name.localeCompare(b.name);
}
