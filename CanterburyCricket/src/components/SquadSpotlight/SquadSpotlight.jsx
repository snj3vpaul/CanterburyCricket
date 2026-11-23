import { useMemo } from "react";
import { PlayerPhoto } from "../SquadRoster/SquadRoster";
import "./SquadSpotlight.css";

const ROLE_LABEL = { Batter: "Batter", "Wicket-keeper": "Wicket-keeper", "All-rounder": "All-rounder", Bowler: "Bowler", Squad: "Squad player" };
const today = () => Math.floor(Date.now() / 86_400_000);

/**
 * Featured player. Rotates once a day among players with a photo (everyone sees the same one),
 * or shows `pinnedName` if set (player of the month, a debut, a milestone).
 */
export default function SquadSpotlight({ players = [], pinnedName = "" }) {
  const player = useMemo(() => {
    const withPhoto = players.filter((p) => p.photo).sort((a, b) => a.name.localeCompare(b.name));
    if (!withPhoto.length) return null;
    const pinned = pinnedName && withPhoto.find((p) => p.name.toLowerCase() === pinnedName.toLowerCase());
    return pinned || withPhoto[today() % withPhoto.length];
  }, [players, pinnedName]);

  if (!player) return null;

  return (
    <section className="sp" aria-label="Featured player">
      <div className="sp-photo">
        <PlayerPhoto player={player} eager />
      </div>
      <div className="sp-body">
        {player.jersey ? <span className="sp-ghost" aria-hidden="true">{player.jersey}</span> : null}
        <p className="sp-kicker">Featured player</p>
        <h2 className="sp-name">
          {player.first ? <span className="sp-first">{player.first}</span> : null}
          <span className="sp-last">{player.last}</span>
        </h2>
      </div>
      <dl className="sp-facts">
        <div><dt>Role</dt><dd>{ROLE_LABEL[player.role]}</dd></div>
        {player.jersey ? <div><dt>Number</dt><dd>{player.jersey}</dd></div> : null}
        {player.batting ? <div><dt>Bats</dt><dd>{player.batting.replace(/ bat$/, "")}</dd></div> : null}
        {player.bowling ? <div><dt>Bowls</dt><dd>{player.bowling}</dd></div> : null}
      </dl>
    </section>
  );
}
