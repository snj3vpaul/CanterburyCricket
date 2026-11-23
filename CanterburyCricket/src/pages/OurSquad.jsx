import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SquadSpotlight from "../components/SquadSpotlight/SquadSpotlight";
import SquadRoster from "../components/SquadRoster/SquadRoster";
import { ROLE_GROUPS, byNumberThenName, toPlayer } from "../components/SquadRoster/squadData";
import "./OurSquad.css";

// Pin a player to the featured slot (exact Full Name from the squad sheet), or leave "" to rotate daily.
const SPOTLIGHT_PIN = "";

export default function OurSquad() {
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [filter, setFilter] = useState("All");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/squad")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json?.ok) throw new Error("unavailable");
        setPlayers((json.data || []).map(toPlayer).sort(byNumberThenName));
        setStatus("ready");
      })
      // The build-time prerender has no squad API; keep the loading placeholders in that snapshot.
      .catch(() => { if (!cancelled && !navigator.webdriver) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  const groups = useMemo(
    () => ROLE_GROUPS
      .map((g) => ({ ...g, players: players.filter((p) => p.role === g.key) }))
      .filter((g) => g.players.length),
    [players]
  );
  const shown = filter === "All" ? groups : groups.filter((g) => g.key === filter);

  return (
    <main className="sq">
      <header className="sq-head">
        <p className="sq-eyebrow">Canterbury Cricket Club · {new Date().getFullYear()} squad</p>
        <h1 className="sq-title">The Squad</h1>
        <p className="sq-lede">
          The players who wear the crest in the Ottawa Valley Cricket Council: batters, keepers, all-rounders and bowlers.
        </p>
      </header>

      {status === "ready" && players.length > 0 ? (
        <>
          <SquadSpotlight players={players} pinnedName={SPOTLIGHT_PIN} />

          <nav className="sq-filter" aria-label="Filter the squad by role">
            {[{ key: "All", plural: "All players", players }, ...groups].map((g) => (
              <button
                key={g.key}
                type="button"
                aria-pressed={filter === g.key}
                className={filter === g.key ? "is-active" : ""}
                onClick={() => setFilter(g.key)}
              >
                {g.plural}<span>{g.players.length}</span>
              </button>
            ))}
          </nav>

          <SquadRoster groups={shown} />
        </>
      ) : null}

      {status === "loading" ? (
        <div className="sq-skeleton" aria-label="Loading the squad">
          {Array.from({ length: 8 }, (_, i) => <div key={i}><span /><i /><i /></div>)}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="sq-error" role="alert">
          <p>The squad list couldn’t be loaded just now.</p>
          <button type="button" onClick={() => { setStatus("loading"); setAttempt((n) => n + 1); }}>Try again</button>
        </div>
      ) : null}

      <aside className="sq-join">
        <p>Want to wear the crest?</p>
        <Link to="/join">Join Canterbury <span aria-hidden="true">→</span></Link>
      </aside>
    </main>
  );
}
