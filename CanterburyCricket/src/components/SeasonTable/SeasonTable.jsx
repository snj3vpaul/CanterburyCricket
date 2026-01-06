import React, { useState, useMemo } from "react";
import stats from "../../assets/T20_division_stats.json"; // Your JSON file
import "./SeasonTable.module.css";

export default function SeasonTable() {
  const [activeTab, setActiveTab] = useState("batting"); // "batting", "bowling", "fielding"

  // Map flat JSON to grouped objects
  const groupedStats = useMemo(
    () =>
      stats.map((player) => ({
        name: player.name,
        batting: {
          runs: player.total_runs_bat ?? 0,
          highestRun: player.highest_run_bat ?? 0,
          average: player.average_bat ?? 0,
          strikeRate: player.strike_rate_bat ?? 0,
        },
        bowling: {
          wickets: player.total_wickets ?? 0,
          bestBowling: player.highest_wicket ?? "-",
          economy: player.economy ?? "-",
          avg: player.avg ?? "-",
        },
        fielding: {
          catches: player.total_catches ?? 0,
          stumpings: player.stumpings ?? 0,
          runOuts: player.run_outs ?? 0,
          totalDismissals:
            (player.total_catches ?? 0) +
            (player.stumpings ?? 0) +
            (player.run_outs ?? 0),
        },
      })),
    []
  );

  // Determine top value for highlighting
  const topValue = useMemo(() => {
    if (activeTab === "batting")
      return Math.max(...groupedStats.map((p) => p.batting.runs));
    if (activeTab === "bowling")
      return Math.max(...groupedStats.map((p) => p.bowling.wickets));
    if (activeTab === "fielding")
      return Math.max(
        ...groupedStats.map((p) => p.fielding.totalDismissals)
      );
  }, [activeTab, groupedStats]);

  const renderRows = () =>
    groupedStats.map((player, idx) => {
      const data = player[activeTab];
      let highlight = false;

      if (activeTab === "batting") highlight = data.runs === topValue;
      if (activeTab === "bowling") highlight = data.wickets === topValue;
      if (activeTab === "fielding") highlight = data.totalDismissals === topValue;

      return (
        <tr key={idx} className={highlight ? "highlight" : ""}>
          <td>{player.name}</td>
          {activeTab === "batting" && (
            <>
              <td>{data.runs}</td>
              <td>{data.highestRun}</td>
              <td>{data.average}</td>
              <td>{data.strikeRate}</td>
            </>
          )}
          {activeTab === "bowling" && (
            <>
              <td>{data.wickets}</td>
              <td>{data.bestBowling}</td>
              <td>{data.economy}</td>
              <td>{data.avg}</td>
            </>
          )}
          {activeTab === "fielding" && (
            <>
              <td>{data.catches}</td>
              <td>{data.stumpings}</td>
              <td>{data.runOuts}</td>
              <td>{data.totalDismissals}</td>
            </>
          )}
        </tr>
      );
    });

  return (
    <div className="season-table-container">
      <div className="tabs">
        <button
          className={activeTab === "batting" ? "active" : ""}
          onClick={() => setActiveTab("batting")}
        >
          Batting
        </button>
        <button
          className={activeTab === "bowling" ? "active" : ""}
          onClick={() => setActiveTab("bowling")}
        >
          Bowling
        </button>
        <button
          className={activeTab === "fielding" ? "active" : ""}
          onClick={() => setActiveTab("fielding")}
        >
          Fielding
        </button>
      </div>

      <table className="season-table">
        <thead>
          <tr>
            <th>Player</th>
            {activeTab === "batting" && (
              <>
                <th>Runs</th>
                <th>Highest</th>
                <th>Average</th>
                <th>SR</th>
              </>
            )}
            {activeTab === "bowling" && (
              <>
                <th>Wickets</th>
                <th>Best</th>
                <th>Economy</th>
                <th>Avg</th>
              </>
            )}
            {activeTab === "fielding" && (
              <>
                <th>Catches</th>
                <th>Stumpings</th>
                <th>Run Outs</th>
                <th>Total</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
}
