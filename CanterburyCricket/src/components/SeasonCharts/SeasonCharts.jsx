import { useEffect, useRef, useState } from "react";
import styles from "./SeasonCharts.module.css";

/*
 * Season charts, scoped by the Player statistics season/division filters.
 *  1. Batting: average vs strike rate.  Bowling: economy vs balls per wicket.
 *  2. MVP points split into batting / bowling / fielding (recorded from 2026).
 * Colours (validated for the dark surface, adjacent CVD-safe in this order):
 *   batting #b88700, bowling #3d8fe6, fielding #2aa876. Scatter is one series (gold).
 */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n, d = 0) => num(n).toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d });

function toPlayer(p) {
  const balls = num(p.balls) || Math.round(num(String(p.overs).split(".")[0]) * 6 + num(String(p.overs).split(".")[1] ?? 0));
  const wickets = num(p.total_wickets);
  return {
    name: p.name || "Unknown",
    runs: num(p.total_runs_bat ?? p.total_runs),
    innings: num(p.innings_bat ?? p.innings_x ?? p.innings),
    average: num(p.average_bat ?? p.average),
    strikeRate: num(p.strike_rate_bat ?? p.strike_rate),
    wickets,
    economy: num(p.economy),
    balls,
    ballsPerWicket: wickets ? balls / wickets : 0,
    mvp: p.mvp_total == null ? null : {
      batting: num(p.mvp_batting), bowling: num(p.mvp_bowling), fielding: num(p.mvp_fielding), total: num(p.mvp_total),
    },
  };
}

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function useWidth(ref) {
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("ResizeObserver" in window)) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const MODES = {
  batting: {
    title: "Who scores, and how fast",
    sub: (n) => `Batting average against strike rate · ${n} players with 3+ innings`,
    keep: (p) => p.innings >= 3 && p.runs > 0,
    x: { key: "average", label: "Batting average →" },
    y: { key: "strikeRate", label: "Strike rate →" },
    rankBy: "runs",
    lead: (p) => `${fmt(p.runs)} runs`,
    detail: (p) => `Avg ${fmt(p.average, 2)} · SR ${fmt(p.strikeRate, 1)} · ${p.innings} inns`,
    quadrant: "Top right: scores big and fast",
  },
  bowling: {
    title: "Who takes wickets cheaply",
    sub: (n) => `Economy against balls per wicket · ${n} bowlers with 2+ wickets`,
    keep: (p) => p.wickets >= 2 && p.balls > 0,
    x: { key: "economy", label: "← Economy (runs per over)" },
    y: { key: "ballsPerWicket", label: "← Balls per wicket" },
    rankBy: "wickets",
    lead: (p) => `${fmt(p.wickets)} wickets`,
    detail: (p) => `Econ ${fmt(p.economy, 2)} · ${fmt(p.ballsPerWicket, 1)} balls per wicket`,
    quadrant: "Bottom left: cheap and frequent wickets",
  },
};

function Scatter({ players, mode }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [tip, setTip] = useState(null);
  const cfg = MODES[mode];
  const pts = players.filter(cfg.keep);
  const compact = width < 520;
  const H = compact ? 320 : 380;
  const M = { l: 48, r: 18, t: 16, b: 46 };
  const xs = pts.map((p) => p[cfg.x.key]);
  const ys = pts.map((p) => p[cfg.y.key]);
  const xt = niceTicks(Math.min(0, ...xs), Math.max(1, ...xs), compact ? 4 : 6);
  const yt = niceTicks(Math.min(...ys, 0), Math.max(1, ...ys), 5);
  const x = (v) => M.l + ((v - xt[0]) / (xt.at(-1) - xt[0])) * (width - M.l - M.r);
  const y = (v) => H - M.b - ((v - yt[0]) / (yt.at(-1) - yt[0])) * (H - M.t - M.b);
  const mx = pts.length ? median(xs) : 0;
  const my = pts.length ? median(ys) : 0;
  const labelled = new Set([...pts].sort((a, b) => b[cfg.rankBy] - a[cfg.rankBy]).slice(0, compact ? 2 : 3).map((p) => p.name));

  const show = (p, el) => {
    const box = wrapRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - box.left;
    setTip({ p, left: Math.min(Math.max(cx, 110), box.width - 110), top: r.top - box.top });
  };

  if (pts.length < 3) {
    return <p className={styles.empty}>Not enough {mode} records in this season and division to plot.</p>;
  }

  return (
    <div className={styles.plotWrap} ref={wrapRef} onPointerLeave={() => setTip(null)}>
      <svg width={width} height={H} className={styles.svg} role="group" aria-label={`${cfg.title}: ${cfg.sub(pts.length)}`}>
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={M.l - 8} y={y(t)} className={styles.tick} textAnchor="end" dominantBaseline="central">{fmt(t)}</text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={`x${t}`} x={x(t)} y={H - M.b + 18} className={styles.tick} textAnchor="middle">{fmt(t)}</text>
        ))}
        <line x1={x(mx)} x2={x(mx)} y1={M.t} y2={H - M.b} className={styles.median} />
        <line x1={M.l} x2={width - M.r} y1={y(my)} y2={y(my)} className={styles.median} />
        <text x={x(mx) + 6} y={M.t + 10} className={styles.medianLabel}>median</text>
        <text x={width - M.r} y={H - 6} className={styles.axisLabel} textAnchor="end">{cfg.x.label}</text>
        <text x={12} y={M.t} className={styles.axisLabel} transform={`rotate(-90 12 ${M.t})`} textAnchor="end">{cfg.y.label}</text>

        {pts.map((p) => {
          const cx = x(p[cfg.x.key]);
          const cy = y(p[cfg.y.key]);
          const lab = labelled.has(p.name);
          const rightSide = cx < width - 130;
          return (
            <g
              key={p.name}
              className={styles.point}
              tabIndex={0}
              role="img"
              aria-label={`${p.name}: ${cfg.lead(p)}, ${cfg.detail(p)}`}
              onPointerEnter={(e) => show(p, e.currentTarget)}
              onFocus={(e) => show(p, e.currentTarget)}
              onBlur={() => setTip(null)}
            >
              <circle cx={cx} cy={cy} r="13" className={styles.hit} />
              <circle cx={cx} cy={cy} r={lab ? 6.5 : 5} className={lab ? styles.dotLead : styles.dot} />
              {lab && (
                <text x={rightSide ? cx + 11 : cx - 11} y={cy} textAnchor={rightSide ? "start" : "end"} dominantBaseline="central" className={styles.pointLabel}>
                  {p.name.split(" ")[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className={styles.quadrant}>{cfg.quadrant}. Larger dots: top {compact ? 2 : 3} by {cfg.rankBy}.</p>
      {tip && (
        <div className={styles.tooltip} style={{ left: tip.left, top: tip.top }} role="presentation">
          <strong>{cfg.lead(tip.p)}</strong>
          <span>{tip.p.name}</span>
          <span className={styles.muted}>{cfg.detail(tip.p)}</span>
        </div>
      )}
    </div>
  );
}

const PARTS = [
  { key: "batting", label: "Batting" },
  { key: "bowling", label: "Bowling" },
  { key: "fielding", label: "Fielding" },
];

function MvpBars({ players }) {
  const [tip, setTip] = useState(null);
  const wrapRef = useRef(null);
  const rows = players.filter((p) => p.mvp && p.mvp.total > 0).sort((a, b) => b.mvp.total - a.mvp.total).slice(0, 10);
  if (!rows.length) return null;
  const max = rows[0].mvp.total;

  const show = (p, part, el) => {
    const box = wrapRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - box.left;
    setTip({ p, part, left: Math.min(Math.max(cx, 100), box.width - 100), top: r.top - box.top });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.title}>Where the MVP points come from</h3>
          <p className={styles.sub}>Top 10 by CricHeroes MVP points, split by batting, bowling and fielding</p>
        </div>
        <div className={styles.legend}>
          {PARTS.map((part) => <span key={part.key}><i className={`${styles.sw} ${styles[`sw_${part.key}`]}`} />{part.label}</span>)}
        </div>
      </div>
      <div className={styles.mvp} ref={wrapRef} onPointerLeave={() => setTip(null)}>
        {rows.map((p) => (
          <div className={styles.mvpRow} key={p.name}>
            <span className={styles.mvpName}>{p.name}</span>
            <div className={styles.mvpTrack}>
              <div className={styles.mvpBar} style={{ width: `calc((100% - 52px) * ${p.mvp.total / max})` }}>
                {PARTS.map((part) => p.mvp[part.key] > 0 && (
                  <span
                    key={part.key}
                    className={`${styles.seg} ${styles[`seg_${part.key}`]}`}
                    style={{ flexGrow: p.mvp[part.key] }}
                    tabIndex={0}
                    role="img"
                    aria-label={`${p.name}: ${fmt(p.mvp[part.key], 1)} ${part.label.toLowerCase()} points`}
                    onPointerEnter={(e) => show(p, part, e.currentTarget)}
                    onFocus={(e) => show(p, part, e.currentTarget)}
                    onBlur={() => setTip(null)}
                  />
                ))}
              </div>
              <span className={styles.mvpTotal}>{fmt(p.mvp.total, 1)}</span>
            </div>
          </div>
        ))}
        {tip && (
          <div className={styles.tooltip} style={{ left: tip.left, top: tip.top }} role="presentation">
            <strong>{fmt(tip.p.mvp[tip.part.key], 1)} {tip.part.label.toLowerCase()} pts</strong>
            <span>{tip.p.name}</span>
            <span className={styles.muted}>{Math.round((tip.p.mvp[tip.part.key] / tip.p.mvp.total) * 100)}% of {fmt(tip.p.mvp.total, 1)} total</span>
          </div>
        )}
      </div>
      <details className={styles.table}>
        <summary>View as table</summary>
        <table>
          <thead><tr><th scope="col">Player</th><th scope="col">Batting</th><th scope="col">Bowling</th><th scope="col">Fielding</th><th scope="col">Total</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.name}><th scope="row">{p.name}</th><td>{fmt(p.mvp.batting, 1)}</td><td>{fmt(p.mvp.bowling, 1)}</td><td>{fmt(p.mvp.fielding, 1)}</td><td>{fmt(p.mvp.total, 1)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default function SeasonCharts({ data, season, division }) {
  const [mode, setMode] = useState("batting");
  const players = (Array.isArray(data) ? data : []).map(toPlayer);
  const hasMvp = players.some((p) => p.mvp && p.mvp.total > 0);

  return (
    <div className={`${styles.charts} ${hasMvp ? "" : styles.single}`}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h3 className={styles.title}>{MODES[mode].title}</h3>
            <p className={styles.sub}>{season} · {division} · {MODES[mode].sub(players.filter(MODES[mode].keep).length)}</p>
          </div>
          <div className={styles.segment} role="group" aria-label="Chart">
            <button type="button" aria-pressed={mode === "batting"} onClick={() => setMode("batting")}>Batting</button>
            <button type="button" aria-pressed={mode === "bowling"} onClick={() => setMode("bowling")}>Bowling</button>
          </div>
        </div>
        <Scatter players={players} mode={mode} key={`${season}-${division}-${mode}`} />
      </div>
      {hasMvp ? <MvpBars players={players} /> : (
        <p className={styles.note}>MVP point breakdowns are recorded from the 2026 season. Choose 2026 to see who earns their points where.</p>
      )}
    </div>
  );
}
