import { describeItem } from "../shared/scoring";
import { formatDay } from "../api";

/** Competition ranking: 1, 2=, 2=, 4 */
function rank(rows) {
  const sorted = [...rows].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  return sorted.map((row) => ({
    ...row,
    rank: sorted.findIndex((r) => r.totalPoints === row.totalPoints) + 1,
    shared: sorted.filter((r) => r.totalPoints === row.totalPoints).length > 1,
  }));
}

/** Members ranked by points; tap a row for the per-match, per-player breakdown. */
export default function LeaderboardTable({ rows, currentUserId, limit }) {
  const ranked = rank(rows).slice(0, limit ?? rows.length);
  if (!ranked.length) return <p className="fx-card fx-muted fx-pad">No members on the table yet.</p>;

  return (
    <div className="fx-card fx-board">
      <div className="fx-board-head">
        <span>#</span>
        <span>Member</span>
        <span>Pts</span>
      </div>
      <ol>
        {ranked.map((row) => (
          <li key={row.userId}>
            <details>
              <summary className={`fx-board-row ${row.userId === currentUserId ? "is-me" : ""}`}>
                <span className={`fx-rank ${row.rank === 1 ? "is-first" : row.rank <= 3 ? "is-podium" : ""}`}>
                  {row.rank}{row.shared ? "=" : ""}
                </span>
                <span className="fx-board-name">
                  <strong>{row.name}</strong> {row.userId === currentUserId && <em>(you)</em>}
                  <small>{row.matches.length} match{row.matches.length === 1 ? "" : "es"} · tap for breakdown</small>
                </span>
                <span className="fx-board-pts">{row.totalPoints}</span>
              </summary>

              <div className="fx-breakdown">
                {!row.matches.length && <p className="fx-muted fx-small">No scored predictions yet.</p>}
                {row.matches.map((m) => (
                  <div key={m.matchId} className="fx-breakdown-match">
                    <div className="fx-breakdown-title">
                      <span>vs {m.opponent} · {formatDay(m.date)}</span>
                      <strong>{m.points} pts</strong>
                    </div>
                    <ul>
                      {m.breakdown?.picks.map((pick) => (
                        <li key={pick.playerId}>
                          <div className="fx-breakdown-player">
                            <span>
                              {pick.playerName}
                              {pick.isCaptain && <span className="fx-cap-badge">C ×2</span>}
                            </span>
                            <strong>{pick.total}</strong>
                          </div>
                          {pick.items.length ? (
                            <ul className="fx-breakdown-items">
                              {pick.items.map((item) => <li key={item.label}>{describeItem(item, pick.multiplier)}</li>)}
                            </ul>
                          ) : (
                            <p className="fx-muted fx-small">No points</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
