import { useEffect, useMemo, useState } from "react";
import styles from "./SeasonTable.module.css";

const PAGE_SIZE = 10;
const SEASONS = ["2026", "2025", "2024"];
const DIVISIONS = ["T20", "CTZ", "CHG"];
const CATEGORIES = ["batting", "bowling", "fielding"];
const DEFAULT_SORT = { batting: "runs", bowling: "wickets", fielding: "catches" };

// Dataset files are loaded only when a visitor selects a season and division.
const DATASET_MODULES = import.meta.glob("../../assets/*division_stats*.json", { import: "default" });
const datasetCache = new Map();

const COLUMNS = {
  batting: [
    { key: "runs", label: "Runs" },
    { key: "highestRun", label: "HS", full: "Highest score" },
    { key: "average", label: "Avg", full: "Batting average" },
    { key: "strikeRate", label: "SR", full: "Strike rate" },
  ],
  bowling: [
    { key: "wickets", label: "Wkts", full: "Wickets" },
    { key: "best", label: "Best", full: "Best bowling" },
    { key: "economy", label: "Econ", full: "Economy" },
    { key: "avg", label: "Avg", full: "Bowling average" },
    { key: "overs", label: "Overs" },
  ],
  fielding: [
    { key: "catches", label: "Catches" },
    { key: "stumpings", label: "Stumpings" },
    { key: "runOuts", label: "Run outs" },
  ],
};

function datasetPath(year, division) {
  return `../../assets/${division}_division_stats${year === "2025" ? "" : `_${year}`}.json`;
}

function toNum(value) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function valOrDash(value) {
  if (value == null || String(value).trim() === "") return "—";
  const cleaned = String(value).trim();
  return cleaned.toLowerCase() === "nan" || cleaned.toLowerCase() === "null" ? "—" : cleaned;
}

function fmt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : "—";
}

function normalize(player) {
  return {
    name: player?.name || "Unknown",
    team: player?.team_name || "",
    batting: {
      runs: toNum(player?.total_runs_bat ?? player?.total_runs),
      highestRun: toNum(player?.highest_run_bat ?? player?.highest_run),
      average: toNum(player?.average_bat ?? player?.average),
      strikeRate: toNum(player?.strike_rate_bat ?? player?.strike_rate),
      innings: toNum(player?.innings_bat ?? player?.innings),
      fours: toNum(player?.bat_4s ?? player?.["4s"]),
      sixes: toNum(player?.bat_6s ?? player?.["6s"]),
    },
    bowling: {
      wickets: toNum(player?.total_wickets),
      best: valOrDash(player?.highest_wicket),
      economy: toNum(player?.economy),
      avg: toNum(player?.avg),
      sr: toNum(player?.SR ?? player?.sr),
      overs: valOrDash(player?.overs),
      maidens: toNum(player?.maidens),
    },
    fielding: {
      catches: toNum(player?.total_catches ?? player?.catches),
      stumpings: toNum(player?.stumpings),
      runOuts: toNum(player?.run_outs),
      dismissals: toNum(player?.total_dismissal),
      matches: toNum(player?.total_match_field),
    },
  };
}

function sortValue(player, category, key) {
  if (key === "name") return player.name.toLowerCase();
  const value = player[category]?.[key];
  if (key === "best" || key === "overs") {
    const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value ?? 0;
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
}

function LeaderCard({ index, label, person, stat, statLabel, detail }) {
  return (
    <article className={styles.leaderCard}>
      <div className={styles.leaderTop}><span className={styles.leaderIndex}>0{index} / {label}</span><span className={styles.leaderStar} aria-hidden="true">✦</span></div>
      <div className={styles.leaderMain}>
        <div className={styles.leaderIdentity}>
          <span className={styles.leaderAvatar} aria-hidden="true">{person ? initials(person.name) : "—"}</span>
          <div className={styles.leaderText}><h3 className={styles.leaderName}>{person?.name || "Not available"}</h3><p className={styles.leaderTeam}>{person?.team || "No statistics yet"}</p></div>
        </div>
        <div className={styles.leaderScore}><strong>{person ? stat : "—"}</strong><span>{statLabel}</span></div>
      </div>
      <p className={styles.leaderDetail}>{person ? detail : "Awaiting division data"}</p>
    </article>
  );
}

export default function SeasonTable() {
  const [seasonYear, setSeasonYear] = useState("2026");
  const [division, setDivision] = useState("T20");
  const [activeTab, setActiveTab] = useState("batting");
  const [sortKey, setSortKey] = useState("runs");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [datasetState, setDatasetState] = useState({ key: "", data: [], error: null });
  const datasetKey = `${seasonYear}-${division}`;

  useEffect(() => {
    const key = `${seasonYear}-${division}`;
    const path = datasetPath(seasonYear, division);
    let cancelled = false;
    const cached = datasetCache.get(path);
    const loader = cached ? Promise.resolve(cached) : DATASET_MODULES[path]?.();
    if (!loader) {
      Promise.resolve().then(() => {
        if (!cancelled) setDatasetState({ key, data: [], error: "Statistics are not available for this selection." });
      });
    } else {
      loader.then((data) => {
        if (cancelled) return;
        datasetCache.set(path, data);
        setDatasetState({ key, data, error: null });
      }).catch(() => {
        if (!cancelled) setDatasetState({ key, data: [], error: "Could not load player statistics. Please try again." });
      });
    }
    return () => { cancelled = true; };
  }, [seasonYear, division]);

  const isLoading = datasetState.key !== datasetKey;
  const rawStats = isLoading ? [] : datasetState.data;
  const players = useMemo(() => (Array.isArray(rawStats) ? rawStats.map(normalize) : []), [rawStats]);
  const columns = COLUMNS[activeTab];

  const top = useMemo(() => {
    if (!players.length) return { batter: null, bowler: null, fielder: null };
    const batter = [...players].sort((a, b) => b.batting.runs - a.batting.runs)[0];
    const bowler = [...players].sort((a, b) => b.bowling.wickets - a.bowling.wickets)[0];
    const fielder = [...players].sort((a, b) => b.fielding.catches - a.fielding.catches)[0];
    return {
      batter: batter.batting.runs > 0 ? batter : null,
      bowler: bowler.bowling.wickets > 0 ? bowler : null,
      fielder: fielder.fielding.catches > 0 ? fielder : null,
    };
  }, [players]);

  const sorted = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const result = players.filter((player) => !q || player.name.toLocaleLowerCase().includes(q) || player.team.toLocaleLowerCase().includes(q));
    result.sort((a, b) => {
      const av = sortValue(a, activeTab, sortKey);
      const bv = sortValue(b, activeTab, sortKey);
      if (typeof av === "string" || typeof bv === "string") {
        const diff = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? diff : -diff;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return result;
  }, [players, activeTab, sortKey, sortDir, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(pageNumber, totalPages);
  const pageSlice = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeYear(year) { setSeasonYear(year); setPageNumber(1); }
  function changeDivision(nextDivision) { setDivision(nextDivision); setPageNumber(1); }
  function changeCategory(category) {
    setActiveTab(category);
    setSortKey(DEFAULT_SORT[category]);
    setSortDir("desc");
    setPageNumber(1);
  }
  function changeSearch(query) { setSearch(query); setPageNumber(1); }
  function changeSort(key) {
    if (sortKey === key) setSortDir((current) => current === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
    setPageNumber(1);
  }

  const showData = !isLoading && players.length > 0;
  return (
    <section className={styles.wrapper} aria-labelledby="season-stats-heading">
      <div className={styles.sectionHead}>
        <div className={styles.sectionHeadCopy}>
          <p className={styles.eyebrow}>03 / THE NUMBERS</p>
          <h2 id="season-stats-heading" className={styles.sectionTitle}>Player statistics<span>.</span></h2>
        </div>
        <p className={styles.sectionDescription}>Explore the performances behind every season. Choose a year and division to discover the leaders and full player records.</p>
      </div>

      <div className={styles.explorer}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>SEASON</p>
            <div className={styles.filterChoices} role="group" aria-label="Select season">
              {SEASONS.map((year) => (
                <button key={year} type="button" aria-pressed={seasonYear === year} onClick={() => changeYear(year)} className={`${styles.filterButton} ${seasonYear === year ? styles.filterActive : ""}`}>{year}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>DIVISION</p>
            <div className={styles.filterChoices} role="group" aria-label="Select division">
              {DIVISIONS.map((item) => (
                <button key={item} type="button" aria-pressed={division === item} onClick={() => changeDivision(item)} className={`${styles.filterButton} ${division === item ? styles.filterActive : ""}`}>{item}</button>
              ))}
            </div>
          </div>
          <span className={styles.currentSelection}>{seasonYear} <span aria-hidden="true">/</span> {division}</span>
        </div>

        {showData && (
          <div className={styles.leadersGrid} aria-label={`Top performers — ${seasonYear} ${division}`}>
            <LeaderCard index={1} label="Leading batter" person={top.batter} stat={top.batter?.batting.runs} statLabel="runs" detail={top.batter ? `Avg ${fmt(top.batter.batting.average)} · Strike rate ${fmt(top.batter.batting.strikeRate)}` : ""} />
            <LeaderCard index={2} label="Leading bowler" person={top.bowler} stat={top.bowler?.bowling.wickets} statLabel="wickets" detail={top.bowler ? `Economy ${fmt(top.bowler.bowling.economy)} · Best ${top.bowler.bowling.best}` : ""} />
            <LeaderCard index={3} label="Leading fielder" person={top.fielder} stat={top.fielder?.fielding.catches} statLabel="catches" detail={top.fielder ? `${top.fielder.fielding.runOuts} run outs · ${top.fielder.fielding.stumpings} stumpings` : ""} />
          </div>
        )}

        <div className={styles.recordsPanel}>
          <div className={styles.recordsHeader}>
            <div className={styles.recordsHeading}>
              <h3>Season records</h3>
              <p>{seasonYear} · {division} Division</p>
            </div>
            {showData && <span className={styles.playerCount}>{players.length} players</span>}
          </div>

          <div className={styles.recordsToolbar}>
            <div className={styles.categoryTabs} role="group" aria-label="Statistic category">
              {CATEGORIES.map((category) => (
                <button key={category} type="button" aria-pressed={activeTab === category} className={`${styles.categoryButton} ${activeTab === category ? styles.categoryActive : ""}`} onClick={() => changeCategory(category)}>
                  {category[0].toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            <label className={styles.searchBox}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4.5 4.5"/></svg>
              <span className={styles.srOnly}>Search players</span>
              <input type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search player" autoComplete="off" />
            </label>
          </div>

          {showData ? (
            <>
              <p className={styles.mobileScrollHint}>Swipe horizontally to see more stats <span aria-hidden="true">→</span></p>
              <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={`${seasonYear} ${division} ${activeTab} statistics; scroll horizontally if needed`}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.rankHeader}>#</th>
                      <th scope="col" aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                        <button type="button" className={styles.sortButton} onClick={() => changeSort("name")}>Player <span aria-hidden="true" className={styles.sortIcon}>{sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span></button>
                      </th>
                      {columns.map((column) => (
                        <th scope="col" key={column.key} title={column.full || column.label} aria-sort={sortKey === column.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                          <button type="button" className={styles.sortButton} onClick={() => changeSort(column.key)}>{column.label}<span aria-hidden="true" className={styles.sortIcon}>{sortKey === column.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span></button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.map((player, index) => (
                      <tr key={`${player.team}-${player.name}-${index}`}>
                        <td className={styles.rankCell}>{(currentPage - 1) * PAGE_SIZE + index + 1 < 10 ? `0${(currentPage - 1) * PAGE_SIZE + index + 1}` : (currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td className={styles.playerCell}><div className={styles.playerName}>{player.name}</div>{player.team && <div className={styles.playerTeam}>{player.team}</div>}</td>
                        {columns.map((column) => (
                          <td className={`${styles.statCell} ${sortKey === column.key ? styles.highlightStat : ""}`} key={column.key}>
                            {typeof player[activeTab][column.key] === "number" ? fmt(player[activeTab][column.key]) : player[activeTab][column.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {pageSlice.length === 0 && <tr><td colSpan={columns.length + 2} className={styles.emptySearch}>No players match “{search}”. Try another name.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <p>{sorted.length === 0 ? "0 results" : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(sorted.length, currentPage * PAGE_SIZE)} of ${sorted.length} players`}</p>
                <div className={styles.pageControls}>
                  <button type="button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={currentPage <= 1} aria-label="Previous page">←</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button type="button" onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages} aria-label="Next page">→</button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.statusCard} role="status">
              <span className={styles.statusIndicator} aria-hidden="true" />
              <div><strong>{isLoading ? "Loading season records" : "No statistics available"}</strong><p>{isLoading ? "Fetching the selected division's data…" : (datasetState.error || "No player statistics have been recorded for this selection.")}</p></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
