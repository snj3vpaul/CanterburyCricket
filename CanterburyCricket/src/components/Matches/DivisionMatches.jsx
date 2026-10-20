import { CRICHEROES_TEAMS } from "../../data/cricheroesTeams";
import "./DivisionMatches.css";

export default function DivisionMatches() {
  return (
    <section className="dmWrap" aria-labelledby="division-matches-heading">
      <div className="dmHead">
        <div>
          <p className="dmKicker">02 / THE FIXTURES</p>
          <h2 className="dmTitle" id="division-matches-heading">The match centre<span>.</span></h2>
        </div>
        <p className="dmSub">The 2026 season is complete. Revisit the fixtures, results and scorecards on CricHeroes.</p>
      </div>
      <div className="dmGrid">
        {CRICHEROES_TEAMS.map((team) => (
          <a
            key={team.key}
            className="dmCard"
            href={team.matchesUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${team.name} fixtures and results on CricHeroes (opens in new tab)`}
          >
            <div className="dmCardTop"><span className="dmBadge">{team.key}</span><span className="dmExternal" aria-hidden="true">↗</span></div>
            <div className="dmCardBody"><p className="dmCardDiv">{team.division}</p><h3 className="dmCardName">{team.name}</h3></div>
            <span className="dmCardCta">View scorecards <span aria-hidden="true">→</span></span>
          </a>
        ))}
      </div>
      <p className="dmFootNote">External match results are maintained on CricHeroes.</p>
    </section>
  );
}
