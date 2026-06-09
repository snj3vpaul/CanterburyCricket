// src/components/Matches/DivisionMatches.jsx
import { motion } from "framer-motion";
import { CRICHEROES_TEAMS } from "../../data/cricheroesTeams";
import "./DivisionMatches.css";

export default function DivisionMatches() {
  return (
    <section className="dmWrap" aria-label="Live fixtures and results">
      <div className="dmHeader">
        <span className="dmLiveDot" aria-hidden="true" />
        <h2 className="dmTitle">2026 Fixtures &amp; Results — Live on CricHeroes</h2>
      </div>
      <p className="dmSub">
        The 2026 season is underway. Tap a division for live scores, scorecards
        and results, updated ball-by-ball.
      </p>

      <div className="dmGrid">
        {CRICHEROES_TEAMS.map((team, i) => (
          <motion.a
            key={team.key}
            className="dmCard"
            href={team.matchesUrl}
            target="_blank"
            rel="noreferrer"
            style={{ "--dm-accent": team.accent }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <span className="dmCardGlow" aria-hidden="true" />
            <div className="dmCardTop">
              <span className="dmBadge">{team.key}</span>
              <span className="dmExternal" aria-hidden="true">↗</span>
            </div>
            <h3 className="dmCardName">{team.name}</h3>
            <p className="dmCardDiv">{team.division}</p>
            <span className="dmCardCta">
              View matches
              <span className="dmCardArrow" aria-hidden="true">→</span>
            </span>
          </motion.a>
        ))}
      </div>

      <p className="dmFootNote">Scores &amp; scorecards powered by CricHeroes.</p>
    </section>
  );
}