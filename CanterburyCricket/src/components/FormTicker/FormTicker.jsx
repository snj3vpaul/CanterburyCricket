import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import GUIDE from "../../data/formGuide.json";
import { portraitFor } from "../../data/playerPortraits";
import "./FormTicker.css";

// Season "form guide": stock-ticker pills for the leading run scorers and wicket takers.
// Like a share price, each player's figure is their running total for Canterbury since the first
// season on record, and the green change is what they added that season. A pill expands into a
// card that scrubs through the seasons (2024 -> now), then rests on this season.
// Data: src/data/formGuide.json, generated from the CricHeroes exports by scripts/build-form-guide.mjs.

const UNIT = { runs: ["run", "runs"], wickets: ["wicket", "wickets"] };
const unit = (metric, n) => UNIT[metric][n === 1 ? 0 : 1];
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Running total per season: [{ season, value (this season), matches, total (all seasons so far) }]
function career(series) {
  let total = 0;
  return series.map((s) => ({ ...s, total: (total += s.value) }));
}

// What the player added in season i, and how much that grew their running total
function gain(points, i) {
  const before = i > 0 ? points[i - 1].total : 0;
  return { added: points[i].value, pct: before ? (points[i].value / before) * 100 : null, season: points[i].season };
}

function Delta({ g, metric, compact = false }) {
  const pct = g.pct === null ? "" : ` (+${g.pct.toFixed(1)}%)`;
  return (
    <span className="ft-delta is-up">
      <span aria-hidden="true">▲</span> +{g.added.toLocaleString()}
      {compact ? null : <> {unit(metric, g.added)} in {g.season}{pct}</>}
    </span>
  );
}

function Avatar({ name }) {
  const src = portraitFor(name);
  return <span className="ft-avatar" aria-hidden="true">{src ? <img src={src} alt="" width="40" height="60" /> : initials(name)}</span>;
}

// ---------- chart: one point per season, dashed line = last season (the "previous close") ----------
const W = 320, H = 130, PAD = 14;
function Chart({ entry, points: series, index, onScrub }) {
  const max = Math.max(...series.map((s) => s.total), 1);
  const x = (i) => series.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (series.length - 1);
  const y = (v) => H - 18 - (v / max) * (H - 44);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1)} ${H} L${x(0)} ${H} Z`;
  const prev = series.length > 1 ? series[series.length - 2].total : null; // where they stood a season ago
  const gradId = useId();

  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    series.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    onScrub(best);
  };

  return (
    <svg
      className="ft-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${entry.name}, ${entry.metric} for Canterbury since ${series[0].season}: ${series.map((s) => `${s.total} by end of ${s.season}`).join(", ")}`}
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={() => onScrub(series.length - 1)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ft-trend)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--ft-trend)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {prev !== null ? <line className="ft-prev" x1="0" x2={W} y1={y(prev)} y2={y(prev)} /> : null}
      <path d={area} fill={`url(#${gradId})`} />
      <path className="ft-line" d={line} pathLength="1" />
      {series.map((s, i) => (
        <g key={s.season}>
          <circle className={`ft-dot ${i === index ? "is-on" : ""}`} cx={x(i)} cy={y(s.total)} r={i === index ? 4.5 : 3} />
          <text className="ft-year" x={x(i)} y={H - 3} textAnchor="middle">{s.season}</text>
        </g>
      ))}
      <line className="ft-cursor" x1={x(index)} x2={x(index)} y1="8" y2={H - 16} />
    </svg>
  );
}

// ---------- the expanded card ----------
function shrinkThenClose(from, setPhase, onClose) {
  if (reducedMotion() || !from) return onClose();
  setPhase("closing");
  setTimeout(onClose, 260);
}

function Card({ entry, from, onClose }) {
  const points = career(entry.series);
  const last = points.length - 1;
  const [index, setIndex] = useState(reducedMotion() ? last : 0);
  const [phase, setPhase] = useState(reducedMotion() || !from ? "open" : "from"); // from -> open -> closing
  const cardRef = useRef(null);
  const closeRef = useRef(null);

  // Grow out of the pill: start at the pill's size and position, then settle in place.
  useLayoutEffect(() => {
    if (phase !== "from" || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--ft-from", `translate(${from.left - card.left}px, ${from.top - card.top}px) scale(${from.width / card.width}, ${from.height / card.height})`);
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("open")));
  }, [phase, from]);

  // Scrub through the seasons once, like replaying the trading day, then rest on this season.
  useEffect(() => {
    if (reducedMotion() || last === 0) return;
    const timers = entry.series.map((_, i) => setTimeout(() => setIndex(i), 350 + i * 520));
    return () => timers.forEach(clearTimeout);
  }, [entry, last]);

  const close = () => shrinkThenClose(from, setPhase, onClose);

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") shrinkThenClose(from, setPhase, onClose); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [from, onClose]);

  const s = points[index];
  const perMatch = s.matches ? (s.value / s.matches).toFixed(entry.metric === "runs" ? 1 : 2) : "–";

  return (
    <>
      <div className={`ft-scrim ${phase === "open" ? "is-on" : ""}`} onClick={close} />
      <div
        ref={cardRef}
        className={`ft-card is-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.name}: ${entry.metric} by season`}
      >
        <header className="ft-cardHead">
          <Avatar name={entry.name} />
          <div>
            <p className="ft-cardName">{entry.name}</p>
            <p className="ft-cardSub">{entry.metric === "runs" ? "Runs" : "Wickets"} · {entry.divisions.join(" · ")}</p>
          </div>
          <button ref={closeRef} type="button" className="ft-close" onClick={close} aria-label="Close">✕</button>
        </header>

        <div className="ft-value" aria-live="polite">
          <strong>{s.total.toLocaleString()}</strong> <span>{unit(entry.metric, s.total)} for Canterbury</span>
        </div>
        <Delta g={gain(points, index)} metric={entry.metric} />
        <p className="ft-when">Since {points[0].season} · {s.season}: {s.matches} matches across all divisions</p>

        <Chart entry={entry} points={points} index={index} onScrub={setIndex} />

        <footer className="ft-cardFoot">
          <span>Per match in {s.season} <strong>{perMatch}</strong></span>
          <a href="#season-statistics" onClick={close}>Full stats ↓</a>
        </footer>
      </div>
    </>
  );
}

// ---------- the ticker strip ----------
export default function FormTicker() {
  const [open, setOpen] = useState(null); // { i, from }
  const pills = useRef([]);
  const { entries, season } = GUIDE;

  const close = () => {
    const i = open?.i;
    setOpen(null);
    pills.current[i]?.focus({ preventScroll: true });
  };

  return (
    <section className="ft" aria-labelledby="form-guide-heading">
      <div className="ft-head">
        <h2 id="form-guide-heading">Form guide</h2>
        <span>Totals for Canterbury since {GUIDE.since} · ▲ added in {season}</span>
      </div>
      <ul className="ft-strip">
        {entries.map((e, i) => {
          const points = career(e.series);
          const s = points.at(-1);
          return (
            <li key={`${e.metric}-${e.name}`}>
              <button
                ref={(el) => { pills.current[i] = el; }}
                type="button"
                className={`ft-pill ${open?.i === i ? "is-hidden" : ""}`}
                aria-haspopup="dialog"
                onClick={(ev) => setOpen({ i, from: ev.currentTarget.getBoundingClientRect() })}
              >
                <Avatar name={e.name} />
                <span className="ft-pillName">{e.name}</span>
                <span className="ft-pillValue">{s.total.toLocaleString()} <small>{e.metric === "runs" ? "R" : "W"}</small></span>
                <Delta g={gain(points, points.length - 1)} metric={e.metric} compact />
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <Card entry={entries[open.i]} from={open.from} onClose={close} /> : null}
    </section>
  );
}
