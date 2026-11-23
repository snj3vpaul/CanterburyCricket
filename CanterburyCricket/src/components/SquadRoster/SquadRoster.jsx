import { useState } from "react";
import "./SquadRoster.css";
import PlayerForm from "./PlayerForm";

// A player's photo, or their initials on navy if the photo is missing or fails to load.
// Tries the resized photo first, then the original file, then initials.
export function PlayerPhoto({ player, className = "", eager = false, sizes }) {
  const [attempt, setAttempt] = useState(0);
  const sources = [player.photo, player.photo.replace(/=w\d+$/, "")].filter((s, i, all) => s && all.indexOf(s) === i);
  const src = sources[attempt];
  if (!src) {
    return <div className={`ro-monogram ${className}`} aria-hidden="true"><span>{player.initials}</span></div>;
  }
  return (
    <img
      className={className}
      src={src}
      alt={player.name}
      width="640"
      height="800"
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setAttempt((n) => n + 1)}
    />
  );
}

function PlayerCard({ player, index }) {
  const details = [player.batting, player.bowling].filter(Boolean).join(" · ");
  return (
    <li className="ro-card" style={{ "--i": index }}>
      <div className="ro-photo">
        <PlayerPhoto player={player} eager={index < 4} />
        {player.jersey ? <span className="ro-number" aria-label={`Jersey number ${player.jersey}`}>{player.jersey}</span> : null}
      </div>
      <div className="ro-text">
        <h3 className="ro-name">
          {player.first ? <span className="ro-first">{player.first}</span> : null}
          <span className="ro-last">{player.last}</span>
        </h3>
        {details ? <p className="ro-details">{details}</p> : null}
        <PlayerForm name={player.name} role={player.role} />
      </div>
    </li>
  );
}

// Roster grouped by role (batters, keepers, all-rounders, bowlers), each group in jersey order.
export default function SquadRoster({ groups }) {
  return groups.map(({ key, plural, players }) => (
    <section key={key} className="ro-group" aria-labelledby={`ro-${key}`}>
      <header className="ro-groupHead">
        <h2 id={`ro-${key}`}>{plural}</h2>
        <span className="ro-count">{String(players.length).padStart(2, "0")}</span>
      </header>
      <ul className="ro-grid">
        {players.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}
      </ul>
    </section>
  ));
}
