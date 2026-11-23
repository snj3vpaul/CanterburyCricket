import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./LegendCharts.module.css";

/*
 * Legends by the numbers: count-up career totals + a ranked bar chart with a
 * metric switch, totals/per-match switch and an optional "recent stars" series.
 * Colours (validated for dark surface, CVD-safe): legends #b88700, recent stars #3d8fe6.
 */

const METRICS = [
  { key: "runs", label: "Runs", perMatch: true },
  { key: "wickets", label: "Wickets", perMatch: true },
  { key: "matches", label: "Matches", perMatch: false },
  { key: "hundreds", label: "Hundreds", perMatch: true },
  { key: "fifties", label: "Fifties", perMatch: true },
  { key: "battingAverage", label: "Batting average", perMatch: false, decimals: 2 },
];

const ROW_H = 58;

const fmt = (n, decimals = 0) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function statOf(person, key) {
  const s = person.stats ?? {};
  if (key === "battingAverage") return s.battingAverage ?? s.average;
  return s[key];
}

/** Count up once when scrolled into view; static for reduced motion. */
function CountUp({ value, duration = 1400 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref}>{fmt(shown)}</span>;
}

export default function LegendsByNumbers({ legends, recent = [] }) {
  const [metricKey, setMetricKey] = useState("runs");
  const [perMatch, setPerMatch] = useState(false);
  const [withRecent, setWithRecent] = useState(false);
  const [tip, setTip] = useState(null);
  const plotRef = useRef(null);

  const metric = METRICS.find((m) => m.key === metricKey);
  const rate = perMatch && metric.perMatch;
  const decimals = rate ? 2 : metric.decimals ?? 0;

  const totals = useMemo(() => {
    const sum = (k) => legends.reduce((t, p) => t + (Number(statOf(p, k)) || 0), 0);
    return [
      { label: "Matches", value: sum("matches") },
      { label: "Runs", value: sum("runs") },
      { label: "Wickets", value: sum("wickets") },
      { label: "Hundreds", value: sum("hundreds") },
    ];
  }, [legends]);

  // Every player keeps a stable row key; players without this stat are listed as "not recorded".
  const { rows, missing } = (() => {
    const people = [
      ...legends.map((p) => ({ ...p, group: "legend" })),
      ...(withRecent ? recent.map((p) => ({ ...p, group: "recent" })) : []),
    ];
    const out = [];
    const none = [];
    for (const p of people) {
      const raw = Number(statOf(p, metric.key));
      const matches = Number(statOf(p, "matches"));
      if (!Number.isFinite(raw) || (rate && !matches)) { none.push(p.name); continue; }
      out.push({ id: p.id, name: p.name, role: p.role, group: p.group, matches, raw, value: rate ? raw / matches : raw });
    }
    out.sort((a, b) => b.value - a.value);
    return { rows: out, missing: none };
  })();

  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  const label = rate ? `${metric.label} per match` : metric.label;

  const showTip = (row, el) => {
    const box = plotRef.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!box) return;
    setTip({
      row,
      x: Math.min(r.right - box.left, box.width - 12),
      y: r.top - box.top,
    });
  };

  return (
    <div className={styles.block}>
      <div className={styles.tiles}>
        <p className={styles.tilesLabel}>Three legends, one club. Combined careers:</p>
        {totals.map((t) => (
          <div className={styles.tile} key={t.label}>
            <strong className={styles.tileValue}><CountUp value={t.value} /></strong>
            <span className={styles.tileLabel}>{t.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h3 className={styles.chartTitle}>Legends by the numbers</h3>
            <p className={styles.chartSub}>{label}{withRecent ? ", legends and recent stars" : ", career totals"}</p>
          </div>
          <div className={styles.controls}>
            <div className={styles.segment} role="group" aria-label="Totals or per match">
              <button type="button" aria-pressed={!perMatch} onClick={() => setPerMatch(false)}>Totals</button>
              <button type="button" aria-pressed={perMatch} onClick={() => setPerMatch(true)} disabled={!metric.perMatch}
                title={metric.perMatch ? undefined : `${metric.label} is already a rate`}>Per match</button>
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={withRecent} onChange={(e) => setWithRecent(e.target.checked)} />
              <span>Add recent stars</span>
            </label>
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Statistic">
          {METRICS.map((m) => (
            <button key={m.key} type="button" role="tab" aria-selected={m.key === metricKey}
              className={styles.tab} onClick={() => setMetricKey(m.key)}>{m.label}</button>
          ))}
        </div>

        {withRecent && (
          <div className={styles.legend} aria-hidden="true">
            <span><i className={styles.swatchLegend} /> League legends</span>
            <span><i className={styles.swatchRecent} /> Recent stars</span>
          </div>
        )}

        <div className={styles.plot} ref={plotRef} style={{ height: rows.length * ROW_H }} onPointerLeave={() => setTip(null)}>
          {rows.map((row, i) => (
            <div
              key={row.id}
              className={styles.row}
              style={{ transform: `translateY(${i * ROW_H}px)` }}
              tabIndex={0}
              aria-label={`${row.name}: ${fmt(row.value, decimals)} ${label.toLowerCase()}`}
              onPointerEnter={(e) => showTip(row, e.currentTarget.querySelector(`.${styles.bar}`))}
              onFocus={(e) => showTip(row, e.currentTarget.querySelector(`.${styles.bar}`))}
              onBlur={() => setTip(null)}
            >
              <div className={styles.rowName}>
                <span>{row.name}</span>
                <small>{row.group === "legend" ? "League legend" : "Recent star"} · {row.role}</small>
              </div>
              <div className={styles.track}>
                <div
                  className={`${styles.bar} ${row.group === "recent" ? styles.barRecent : ""}`}
                  style={{ width: `calc((100% - 76px) * ${Math.max(0.015, row.value / max)})` }}
                />
                <span className={styles.value}>{fmt(row.value, decimals)}</span>
              </div>
            </div>
          ))}
          {tip && (
            <div className={styles.tooltip} style={{ left: tip.x, top: tip.y }} role="presentation">
              <strong>{fmt(tip.row.value, decimals)}</strong>
              <span><i className={tip.row.group === "recent" ? styles.keyRecent : styles.keyLegend} />{tip.row.name}</span>
              <span className={styles.tipMuted}>
                {rate ? `${fmt(tip.row.raw)} ${metric.label.toLowerCase()} in ` : ""}
                {fmt(tip.row.matches)} matches
              </span>
            </div>
          )}
        </div>

        {missing.length > 0 && (
          <p className={styles.note}>Not recorded for {missing.join(", ")}.</p>
        )}

        <details className={styles.table}>
          <summary>View as table</summary>
          <table>
            <caption className={styles.srOnly}>{label}</caption>
            <thead><tr><th scope="col">Player</th><th scope="col">Group</th><th scope="col">{label}</th><th scope="col">Matches</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><th scope="row">{r.name}</th><td>{r.group === "legend" ? "League legend" : "Recent star"}</td><td>{fmt(r.value, decimals)}</td><td>{fmt(r.matches)}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
