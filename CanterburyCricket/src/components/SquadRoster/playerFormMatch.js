import seasonsData from "../../data/playerSeasons.json";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
const RECORDS = Object.values(seasonsData.players).map((r) => ({ ...r, tokens: norm(r.name).split(" ") }));
const BY_NAME = new Map(RECORDS.map((r) => [norm(r.name), r]));

/** Sheet names are typed by players: match exact, then first + last name, then one name containing the other. */
export function formFor(name) {
  const key = norm(name);
  if (!key) return null;
  if (BY_NAME.has(key)) return BY_NAME.get(key);
  const t = key.split(" ");
  const unique = (list) => (list.length === 1 ? list[0] : null);
  if (t.length > 1) {
    const firstLast = unique(RECORDS.filter((r) => r.tokens[0] === t[0] && r.tokens.at(-1) === t.at(-1)));
    if (firstLast) return firstLast;
  }
  if (t.length < 2) return null;
  // "Sanjeev Paul" -> "Sanjeev K Paul", and "Upkaran Singh Sandhu" -> "Upkaran Singh"
  return unique(RECORDS.filter((r) => t.every((w) => r.tokens.includes(w))))
    ?? unique(RECORDS.filter((r) => r.tokens.length >= 2 && r.tokens.every((w) => t.includes(w))));
}
