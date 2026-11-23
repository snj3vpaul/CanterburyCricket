import { useMemo, useRef, useState } from "react";
import styles from "./LegendCharts.module.css";

/*
 * Finals timeline: one row per division, one mark per documented final.
 * Shape carries the result (filled = champion, ring = runner-up), so a single
 * gold hue is enough. Selecting a final calls onSelect(item).
 */

const ROWS = ["CHG", "CTZ", "T20"];
const W = 1000;
const PAD_L = 64;
const PAD_R = 24;
const ROW_GAP = 46;
const TOP = 18;

export default function FinalsTimeline({ finals, from = 2004, to = 2026, onSelect }) {
  const [tip, setTip] = useState(null);
  const wrapRef = useRef(null);
  const H = TOP + ROWS.length * ROW_GAP + 30;
  const x = (year) => PAD_L + ((year - from) / (to - from)) * (W - PAD_L - PAD_R);
  const y = (div) => TOP + ROWS.indexOf(div) * ROW_GAP + ROW_GAP / 2;
  const ticks = useMemo(() => {
    const out = [];
    for (let yr = from; yr <= to; yr += 2) out.push(yr);
    if (out[out.length - 1] !== to) out.push(to);
    return out;
  }, [from, to]);

  const counts = useMemo(() => ({
    champion: finals.filter((f) => f.placement === "champion").length,
    runnerUp: finals.filter((f) => f.placement !== "champion").length,
  }), [finals]);

  const show = (item, el) => {
    const box = wrapRef.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!box) return;
    const half = 125; // keep the 250px tooltip inside the card
    const center = r.left + r.width / 2 - box.left;
    setTip({ item, left: Math.min(Math.max(center, half), box.width - half), top: r.top - box.top });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.chartTitle}>Finals on the timeline</h3>
          <p className={styles.chartSub}>{counts.champion} titles and {counts.runnerUp} runner-up finishes in the archive, {from}–{to}. Select one to read its story.</p>
        </div>
        <div className={styles.legend} aria-hidden="true">
          <span><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" className={styles.dotChampion} /></svg> Champion</span>
          <span><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="4.5" className={styles.dotRunner} /></svg> Runner-up</span>
        </div>
      </div>

      <div className={styles.timelineOuter} ref={wrapRef} onPointerLeave={() => setTip(null)}>
        <div className={styles.timelineWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.timeline} role="group" aria-label="Documented finals by year and division">
          {ROWS.map((div) => (
            <g key={div}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(div)} y2={y(div)} className={styles.grid} />
              <text x={PAD_L - 14} y={y(div)} className={styles.rowLabel} textAnchor="end" dominantBaseline="central">{div}</text>
            </g>
          ))}
          {ticks.map((yr) => (
            <text key={yr} x={x(yr)} y={H - 8} className={styles.tick} textAnchor="middle">{yr}</text>
          ))}
          {finals.map((f) => {
            const champion = f.placement === "champion";
            const cx = x(f.year);
            const cy = y(f.division);
            const label = `${f.year} ${f.division} final: ${champion ? "Champions" : "Runner-up"}. ${f.subtitle ?? ""}`;
            return (
              <g
                key={f.id}
                className={styles.mark}
                role="button"
                tabIndex={0}
                aria-label={label}
                onPointerEnter={(e) => show(f, e.currentTarget)}
                onFocus={(e) => show(f, e.currentTarget)}
                onBlur={() => setTip(null)}
                onClick={() => onSelect?.(f)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(f); } }}
              >
                <circle cx={cx} cy={cy} r="16" className={styles.hit} />
                <circle cx={cx} cy={cy} r={champion ? 8 : 7} className={champion ? styles.dotChampion : styles.dotRunner} />
              </g>
            );
          })}
        </svg>
        </div>
        {tip && (
          <div className={`${styles.tooltip} ${styles.tooltipCenter}`} style={{ left: tip.left, top: tip.top }} role="presentation">
            <strong>{tip.item.placement === "champion" ? "Champions" : "Runner-up"}</strong>
            <span>{tip.item.year} · {tip.item.division}</span>
            {tip.item.subtitle && <span className={styles.tipMuted}>{tip.item.subtitle}</span>}
          </div>
        )}
      </div>

      <details className={styles.table}>
        <summary>View as table</summary>
        <table>
          <caption className={styles.srOnly}>Documented finals</caption>
          <thead><tr><th scope="col">Year</th><th scope="col">Division</th><th scope="col">Result</th></tr></thead>
          <tbody>
            {[...finals].sort((a, b) => b.year - a.year).map((f) => (
              <tr key={f.id}><th scope="row">{f.year}</th><td>{f.division}</td><td>{f.placement === "champion" ? "Champions" : "Runner-up"}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
