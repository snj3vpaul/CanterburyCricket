import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import t20Stats from "../../assets/T20_division_stats.json";
import ctzStats from "../../assets/CTZ_division_stats.json";
import chgStats from "../../assets/CHG_division_stats.json";

import styles from "./SeasonTable.module.css";

const PAGE_SIZE = 10;

export default function SeasonTable() {
  // Division toggle
  const [division, setDivision] = useState("T20"); // "T20" | "CTZ" | "CHG"

  // Category tabs
  const [activeTab, setActiveTab] = useState("batting"); // "batting" | "bowling" | "fielding"

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);

  // Sorting
  const [sortKey, setSortKey] = useState("runs"); // changes by tab
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  // Pick dataset
  const rawStats = useMemo(() => {
    if (division === "T20") return t20Stats;
    if (division === "CTZ") return ctzStats;
    if (division === "CHG") return chgStats;
    return [];
  }, [division]);

  const hasData = Array.isArray(rawStats) && rawStats.length > 0;

  // Normalize players (safe defaults)
  const players = useMemo(() => {
    const arr = Array.isArray(rawStats) ? rawStats : [];
    return arr.map((p) => ({
      name: p?.name ?? "Unknown",
      team: p?.team_name ?? "",
      batting: {
        runs: toNum(p?.total_runs_bat),
        highestRun: toNum(p?.highest_run_bat),
        average: toNum(p?.average_bat),
        strikeRate: toNum(p?.strike_rate_bat),
        innings: toNum(p?.innings_bat),
        fours: toNum(p?.bat_4s),
        sixes: toNum(p?.bat_6s),
      },
      bowling: {
        wickets: toNum(p?.total_wickets),
        best: valOrDash(p?.highest_wicket),
        economy: toNum(p?.economy),
        avg: toNum(p?.avg),
        sr: toNum(p?.SR),
        overs: valOrDash(p?.overs),
        maidens: toNum(p?.maidens),
      },
      fielding: {
        catches: toNum(p?.total_catches ?? p?.catches),
        stumpings: toNum(p?.stumpings),
        runOuts: toNum(p?.run_outs),
        dismissals: toNum(p?.total_dismissal),
        matches: toNum(p?.total_match_field),
      },
    }));
  }, [rawStats]);

  // Top performers
  const top = useMemo(() => {
    if (!players.length) return { batter: null, bowler: null, fielder: null };

    const batter = [...players].sort((a, b) => b.batting.runs - a.batting.runs)[0];
    const bowler = [...players].sort((a, b) => b.bowling.wickets - a.bowling.wickets)[0];
    const fielder = [...players].sort((a, b) => b.fielding.catches - a.fielding.catches)[0];

    return {
      batter: batter?.batting?.runs > 0 ? batter : null,
      bowler: bowler?.bowling?.wickets > 0 ? bowler : null,
      fielder: fielder?.fielding?.catches > 0 ? fielder : null,
    };
  }, [players]);

  // Default sort per tab
  useEffect(() => {
    if (activeTab === "batting") setSortKey("runs");
    if (activeTab === "bowling") setSortKey("wickets");
    if (activeTab === "fielding") setSortKey("catches");
    setSortDir("desc");
  }, [activeTab]);

  // Sorting getter
  const getSortValue = (p, key) => {
    if (key === "name") return (p.name || "").toLowerCase();

    if (activeTab === "batting") {
      if (key === "runs") return p.batting.runs;
      if (key === "highestRun") return p.batting.highestRun;
      if (key === "average") return p.batting.average;
      if (key === "strikeRate") return p.batting.strikeRate;
      return p.batting.runs;
    }

    if (activeTab === "bowling") {
      if (key === "wickets") return p.bowling.wickets;
      if (key === "best") return parseBest(p.bowling.best);
      if (key === "economy") return p.bowling.economy;
      if (key === "avg") return p.bowling.avg;
      if (key === "overs") return parseOvers(p.bowling.overs);
      return p.bowling.wickets;
    }

    // fielding
    if (key === "catches") return p.fielding.catches;
    if (key === "stumpings") return p.fielding.stumpings;
    if (key === "runOuts") return p.fielding.runOuts;
    return p.fielding.catches;
  };

  const sorted = useMemo(() => {
    const copy = [...players];

    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);

      // string sort for name
      if (typeof av === "string" || typeof bv === "string") {
        const res = String(av).localeCompare(String(bv));
        return sortDir === "desc" ? -res : res;
      }

      const diff = (bv ?? 0) - (av ?? 0);
      return sortDir === "desc" ? diff : -diff;
    });

    return copy;
  }, [players, activeTab, sortKey, sortDir]);

  // Pagination
  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const start = (pageNumber - 1) * PAGE_SIZE;
  const pageSlice = sorted.slice(start, start + PAGE_SIZE);

  useEffect(() => setPageNumber(1), [division, activeTab, sortKey, sortDir]);

  const goToPage = (n) => setPageNumber(Math.min(Math.max(1, n), totalPages));

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const arrow = (key) => (sortKey === key ? (sortDir === "desc" ? "▼" : "▲") : "");

  return (
    <section className={styles.wrapper}>
      {/* HEADER: title/subtitle left, division toggle right */}
      <header className={styles.header}>
        

        <div className={styles.segmentedWrap}>
          <div className={styles.segmented} data-active={division}>
            <span className={styles.activePill} aria-hidden="true" />
            {["T20", "CTZ", "CHG"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDivision(d)}
                className={`${styles.segBtn} ${division === d ? styles.segActive : ""}`}
              >
                <span className={styles.segText}>{d} Division</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* TOP PERFORMERS (3 cards) */}
      {hasData && (
        <div className={styles.topSection}>
          <div className={styles.leadersGrid}>
            <LeaderCard
              title="Top Batter"
              badge={division}
              player={top.batter}
              primaryLabel="Runs"
              primaryValue={top.batter ? top.batter.batting.runs : "—"}
              lines={
                top.batter
                  ? [
                      `Avg: ${fmt(top.batter.batting.average)} • SR: ${fmt(top.batter.batting.strikeRate)}`,
                      `HS: ${top.batter.batting.highestRun} • Inns: ${top.batter.batting.innings}`,
                      `4s: ${top.batter.batting.fours} • 6s: ${top.batter.batting.sixes}`,
                    ]
                  : ["No batting data yet"]
              }
            />

            <LeaderCard
              title="Top Bowler"
              badge={division}
              player={top.bowler}
              primaryLabel="Wickets"
              primaryValue={top.bowler ? top.bowler.bowling.wickets : "—"}
              lines={
                top.bowler
                  ? [
                      `Econ: ${fmt(top.bowler.bowling.economy)} • Avg: ${fmt(top.bowler.bowling.avg)}`,
                      `Best: ${top.bowler.bowling.best} • SR: ${fmt(top.bowler.bowling.sr)}`,
                      `Overs: ${top.bowler.bowling.overs} • Maidens: ${top.bowler.bowling.maidens}`,
                    ]
                  : ["No bowling data yet"]
              }
            />

            <LeaderCard
              title="Top Fielder"
              badge={division}
              player={top.fielder}
              primaryLabel="Catches"
              primaryValue={top.fielder ? top.fielder.fielding.catches : "—"}
              lines={
                top.fielder
                  ? [
                      `Run Outs: ${top.fielder.fielding.runOuts} • Stumpings: ${top.fielder.fielding.stumpings}`,
                      `Dismissals: ${top.fielder.fielding.dismissals} • Matches: ${top.fielder.fielding.matches}`,
                    ]
                  : ["No fielding data yet"]
              }
            />
          </div>

          {/* SINGLE Tabs row BELOW top performers */}
          <div className={styles.tabsRow}>
            <div className={styles.tabsWide}>
              <button
                type="button"
                onClick={() => setActiveTab("batting")}
                className={`${styles.tabBtnWide} ${
                  activeTab === "batting" ? styles.tabActiveWide : ""
                }`}
              >
                Batting
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bowling")}
                className={`${styles.tabBtnWide} ${
                  activeTab === "bowling" ? styles.tabActiveWide : ""
                }`}
              >
                Bowling
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fielding")}
                className={`${styles.tabBtnWide} ${
                  activeTab === "fielding" ? styles.tabActiveWide : ""
                }`}
              >
                Fielding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {!hasData ? (
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderHeader}>
            <span className={styles.pulseDot} />
            <h3 className={styles.placeholderTitle}>{division} Division Stats</h3>
          </div>
          <p className={styles.placeholderText}>No data found for this division.</p>
          <div className={styles.progressBar} aria-hidden="true">
            <div className={styles.progressFill} />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapFull} key={`${division}-${activeTab}-${sortKey}-${sortDir}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortable} onClick={() => onSort("name")}>
                    Player {arrow("name")}
                  </th>

                  {activeTab === "batting" && (
                    <>
                      <th className={styles.sortable} onClick={() => onSort("runs")}>
                        Runs {arrow("runs")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("highestRun")}>
                        HS {arrow("highestRun")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("average")}>
                        Avg {arrow("average")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("strikeRate")}>
                        SR {arrow("strikeRate")}
                      </th>
                    </>
                  )}

                  {activeTab === "bowling" && (
                    <>
                      <th className={styles.sortable} onClick={() => onSort("wickets")}>
                        Wkts {arrow("wickets")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("best")}>
                        Best {arrow("best")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("economy")}>
                        Econ {arrow("economy")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("avg")}>
                        Avg {arrow("avg")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("overs")}>
                        Overs {arrow("overs")}
                      </th>
                    </>
                  )}

                  {activeTab === "fielding" && (
                    <>
                      <th className={styles.sortable} onClick={() => onSort("catches")}>
                        Catches {arrow("catches")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("stumpings")}>
                        Stumpings {arrow("stumpings")}
                      </th>
                      <th className={styles.sortable} onClick={() => onSort("runOuts")}>
                        Run Outs {arrow("runOuts")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {pageSlice.map((p, idx) => (
                  <tr key={`${p.name}-${idx}`}>
                    <td className={styles.playerCell}>
                      <div className={styles.playerName}>{p.name}</div>
                      {!!p.team && <div className={styles.playerTeam}>{p.team}</div>}
                    </td>

                    {activeTab === "batting" && (
                      <>
                        <td>{p.batting.runs}</td>
                        <td>{p.batting.highestRun}</td>
                        <td>{fmt(p.batting.average)}</td>
                        <td>{fmt(p.batting.strikeRate)}</td>
                      </>
                    )}

                    {activeTab === "bowling" && (
                      <>
                        <td>{p.bowling.wickets}</td>
                        <td>{p.bowling.best}</td>
                        <td>{fmt(p.bowling.economy)}</td>
                        <td>{fmt(p.bowling.avg)}</td>
                        <td>{p.bowling.overs}</td>
                      </>
                    )}

                    {activeTab === "fielding" && (
                      <>
                        <td>{p.fielding.catches}</td>
                        <td>{p.fielding.stumpings}</td>
                        <td>{p.fielding.runOuts}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber === 1}
            >
              Prev
            </button>

            <div className={styles.pageInfo}>
              Page <strong>{pageNumber}</strong> / {totalPages}
            </div>

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* Leader Card */
function LeaderCard({ title, badge, player, primaryLabel, primaryValue, lines }) {
  return (
    <motion.div
      className={styles.leaderCard}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <div className={styles.leaderTop}>
        <div className={styles.leaderTitleRow}>
          <h3 className={styles.leaderTitle}>{title}</h3>
          <span className={styles.leaderBadge}>{badge}</span>
        </div>

        <div className={styles.leaderPrimary}>
          <div className={styles.leaderPrimaryValue}>{primaryValue}</div>
          <div className={styles.leaderPrimaryLabel}>{primaryLabel}</div>
        </div>
      </div>

      <div className={styles.leaderBody}>
        <div className={styles.leaderName}>{player?.name ?? "—"}</div>
        {player?.team ? <div className={styles.leaderTeam}>{player.team}</div> : null}

        <ul className={styles.leaderLines}>
          {lines.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* Helpers */
function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim();
  if (!s || s === "-" || s.toLowerCase() === "null") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function valOrDash(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s && s !== "null" ? s : "-";
}

function fmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return Math.round(num * 100) / 100;
}

function parseOvers(v) {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseBest(v) {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
