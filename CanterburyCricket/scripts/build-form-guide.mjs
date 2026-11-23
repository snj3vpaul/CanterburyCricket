// Builds src/data/formGuide.json for the Season page's form ticker.
// Reads the CricHeroes season exports in src/data/stats/<division>-<year>.json, adds each player's
// runs, wickets and matches across all three divisions per season, and keeps the 2026 leaders.
// Runs automatically before `npm run build`; run it by hand after replacing any stats file.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const STATS = path.join(ROOT, "src/data/stats");
const OUT = path.join(ROOT, "src/data/formGuide.json");
const SEASONS = [2024, 2025, 2026];
const CURRENT = SEASONS.at(-1);
const TOP_BATTERS = 5;
const TOP_BOWLERS = 4;

// The same player sometimes appears under two spellings across exports.
const ALIASES = { "Jaideep Singh Grover": "Jaideep Grover" };

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const tidy = (name) => String(name ?? "").replace(/\s+/g, " ").trim()
  .toLowerCase().replace(/(^|[\s'"-])([a-z])/g, (_, p, c) => p + c.toUpperCase());

const players = new Map();
for (const file of fs.readdirSync(STATS).filter((f) => /^[A-Z0-9]+-\d{4}\.json$/.test(f)).sort()) {
  const [division, yearText] = file.replace(".json", "").split("-");
  const year = Number(yearText);
  if (!SEASONS.includes(year)) continue;
  for (const row of JSON.parse(fs.readFileSync(path.join(STATS, file), "utf8"))) {
    const name = ALIASES[tidy(row.name)] ?? tidy(row.name);
    if (!name) continue;
    const p = players.get(name) ?? { name, seasons: {}, divisions: {} };
    const s = (p.seasons[year] ??= { runs: 0, wickets: 0, matches: 0 });
    // 2024 exports call batting runs `total_runs`; later ones use `total_runs_bat` (`runs` = runs conceded)
    s.runs += num(row.total_runs_bat ?? row.total_runs);
    s.wickets += num(row.total_wickets);
    const matches = Math.max(num(row.total_match), num(row.total_match_bat), num(row.total_match_field), num(row.total_match_x));
    s.matches += matches;
    if (matches > 0) (p.divisions[year] ??= []).push(division);
    players.set(name, p);
  }
}

function entry(p, metric) {
  const series = SEASONS.filter((y) => p.seasons[y]?.matches > 0)
    .map((y) => ({ season: y, value: p.seasons[y][metric], matches: p.seasons[y].matches }));
  return { name: p.name, metric, divisions: p.divisions[CURRENT].sort(), series };
}

const current = [...players.values()].filter((p) => p.seasons[CURRENT]?.matches > 0);
const top = (metric, n) => current
  .filter((p) => p.seasons[CURRENT][metric] > 0)
  .sort((a, b) => b.seasons[CURRENT][metric] - a.seasons[CURRENT][metric] || a.name.localeCompare(b.name))
  .slice(0, n)
  .map((p) => entry(p, metric));

const guide = { season: CURRENT, compareTo: CURRENT - 1, entries: [...top("runs", TOP_BATTERS), ...top("wickets", TOP_BOWLERS)] };
fs.writeFileSync(OUT, JSON.stringify(guide, null, 1) + "\n");
console.log(`formGuide.json: ${guide.entries.length} entries for ${CURRENT}`);
