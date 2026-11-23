import seasonsData from "../../data/playerSeasons.json";
import { formFor } from "./playerFormMatch";

/*
 * Three-season form line for a Squad card (CricHeroes, all divisions combined).
 * Sparkline in the muted ink, the latest season as a gold dot, value beside it.
 */

const YEARS = seasonsData.seasons;

const fmt = (n) => Number(n).toLocaleString("en-CA");

function Spark({ values, label }) {
  const W = 84;
  const H = 24;
  const pad = 4;
  const max = Math.max(1, ...values.filter((v) => v != null));
  const x = (i) => pad + (i * (W - pad * 2)) / (values.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const segments = [];
  values.forEach((v, i) => {
    if (v == null) return;
    const prev = values[i - 1];
    if (i > 0 && prev != null) segments.push(`M${x(i - 1)},${y(prev)}L${x(i)},${y(v)}`);
  });
  const lastIndex = values.reduce((acc, v, i) => (v != null ? i : acc), -1);
  const summary = values.map((v, i) => `${YEARS[i]} ${v == null ? "did not play" : fmt(v)}`).join(", ");
  return (
    <svg className="ro-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} by season: ${summary}`}>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="ro-sparkBase" />
      {segments.map((d) => <path key={d} d={d} className="ro-sparkLine" />)}
      {values.map((v, i) => v != null && (
        <circle key={YEARS[i]} cx={x(i)} cy={y(v)} r={i === lastIndex ? 3.5 : 2.5} className={i === lastIndex ? "ro-sparkNow" : "ro-sparkDot"}>
          <title>{`${YEARS[i]}: ${fmt(v)} ${label.toLowerCase()}`}</title>
        </circle>
      ))}
    </svg>
  );
}

const METRICS_BY_ROLE = {
  Batter: ["runs"],
  "Wicket-keeper": ["runs"],
  Bowler: ["wickets"],
  "All-rounder": ["runs", "wickets"],
  Squad: ["runs", "wickets"],
};

export default function PlayerForm({ name, role }) {
  const rec = formFor(name);
  if (!rec) return null;
  const metrics = (METRICS_BY_ROLE[role] ?? ["runs", "wickets"])
    .filter((k) => rec[k].some((v) => v > 0));
  if (!metrics.length) return null;
  return (
    <div className="ro-form">
      {metrics.map((k) => {
        const values = rec[k];
        const lastIndex = values.reduce((acc, v, i) => (v != null ? i : acc), -1);
        const label = k === "runs" ? "Runs" : "Wickets";
        return (
          <div className="ro-formRow" key={k}>
            <span className="ro-formLabel">{label}</span>
            <Spark values={values} label={label} />
            <span className="ro-formValue">
              <strong>{fmt(values[lastIndex])}</strong>
              <small>{YEARS[lastIndex]}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}
