import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import GUIDE from "../../data/formGuide.json";
import { portraitFor } from "../../data/playerPortraits";
import "./FormTicker.css";

// Season "form guide": stock-ticker pills for the leading run scorers and wicket takers.
// A pill expands into a card that scrubs through the player's seasons (2024 -> now),
// updating the total and the change against the season before, then rests on this season.
// Data: src/data/formGuide.json, generated from the CricHeroes exports by scripts/build-form-guide.mjs.

const UNIT = { runs: ["run", "runs"], wickets: ["wicket", "wickets"] };
const unit = (metric, n) => UNIT[metric][n === 1 ? 0 : 1];
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function change(series, i) {
  if (i <= 0 || !series[i - 1]) return null;
  const prev = series[i - 1].value, now = series[i].value;
  return { diff: now - prev, pct: prev ? ((now - prev) / prev) * 100 : null, prevSeason: series[i - 1].season };
}

function Delta({ c, compact = false }) {
  if (!c) return <span className="ft-delta is-new">{compact ? "NEW" : "First season with these stats"}</span>;
  const up = c.diff >= 0;
  const pct = c.pct === null ? "" : `${up ? "+" : "−"}${Math.abs(c.pct).toFixed(compact ? 0 : 1)}%`;
  return (
    <span className={`ft-delta ${up ? "is-up" : "is-down"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>{" "}
      {compact ? pct : <>{up ? "+" : "−"}{Math.abs(c.diff)} ({pct}) vs {c.prevSeason}</>}
    </span>
  );
}

function Avatar({ name }) {
  const src = portraitFor(name);
  return <span className="ft-avatar" aria-hidden="true">{src ? <img src={src} alt="" width="40" height="60" /> : initials(name)}</span>;
}

// ---------- chart: one point per season, dashed line = last season (the "previous close") ----------
const W = 320, H = 130, PAD = 14;
function Chart({ entry, index, onScrub }) {
  const { series } = entry;
  const max = Math.max(...series.map((s) => s.value), 1);
  const x = (i) => series.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (series.length - 1);
  const y = (v) => H - 18 - (v / max) * (H - 44);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1)} ${H} L${x(0)} ${H} Z`;
  const prev = series.length > 1 ? series[series.length - 2].value : null;
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
      aria-label={`${entry.name}, ${entry.metric} by season: ${series.map((s) => `${s.season} ${s.value}`).join(", ")}`}
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
          <circle className={`ft-dot ${i === index ? "is-on" : ""}`} cx={x(i)} cy={y(s.value)} r={i === index ? 4.5 : 3} />
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
  const last = entry.series.length - 1;
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

  const s = entry.series[index];
  const c = change(entry.series, index);
  const trendUp = (change(entry.series, last)?.diff ?? 0) >= 0;
  const perMatch = s.matches ? (s.value / s.matches).toFixed(entry.metric === "runs" ? 1 : 2) : "–";

  return (
    <>
      <div className={`ft-scrim ${phase === "open" ? "is-on" : ""}`} onClick={close} />
      <div
        ref={cardRef}
        className={`ft-card is-${phase} ${trendUp ? "trend-up" : "trend-down"}`}
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
          <strong>{s.value.toLocaleString()}</strong> <span>{unit(entry.metric, s.value)}</span>
        </div>
        <Delta c={c} />
        <p className="ft-when">{s.season} season · {s.matches} matches · all divisions</p>

        <Chart entry={entry} index={index} onScrub={setIndex} />

        <footer className="ft-cardFoot">
          <span>Per match <strong>{perMatch}</strong></span>
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
  const { entries, season, compareTo } = GUIDE;

  const close = () => {
    const i = open?.i;
    setOpen(null);
    pills.current[i]?.focus({ preventScroll: true });
  };

  return (
    <section className="ft" aria-labelledby="form-guide-heading">
      <div className="ft-head">
        <h2 id="form-guide-heading">Form guide</h2>
        <span>{season} leaders · change vs {compareTo}</span>
      </div>
      <ul className="ft-strip">
        {entries.map((e, i) => {
          const s = e.series.at(-1);
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
                <span className="ft-pillValue">{s.value} <small>{e.metric === "runs" ? "R" : "W"}</small></span>
                <Delta c={change(e.series, e.series.length - 1)} compact />
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <Card entry={entries[open.i]} from={open.from} onClose={close} /> : null}
    </section>
  );
}
