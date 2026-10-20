import { CAPTAINS_2026 } from "../../data/captains2026";
import "./Captaincy2026.css";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CC";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "")).toUpperCase();
}

function Person({ person, role, lead = false }) {
  return (
    <div className={`capPerson ${lead ? "capPerson--lead" : ""}`}>
      <div className="capAvatar" aria-hidden="true">
        {person.img ? <img src={person.img} alt="" loading="lazy" /> : initials(person.name)}
      </div>
      <div className="capPersonText">
        <span className="capRole">{role}</span>
        <span className="capName">{person.name}</span>
      </div>
    </div>
  );
}

export default function Captaincy2026() {
  return (
    <section className="capWrap" aria-labelledby="captaincy-heading">
      <div className="capHead">
        <div className="capHeadCopy">
          <p className="capKicker">01 / THE PEOPLE</p>
          <h2 id="captaincy-heading" className="capTitle">Leading the way<span>.</span></h2>
        </div>
        <p className="capSub">Meet the captains and vice-captains representing Canterbury in the 2026 season.</p>
      </div>
      <div className="capGrid">
        {CAPTAINS_2026.map((team) => (
          <article key={team.key} className="capCard" style={{ "--cap-accent": team.accent }}>
            <div className="capCardHead">
              <span className="capDivision">{team.division}</span>
              <span className="capBadge">{team.key}</span>
            </div>
            <Person person={team.captain} role="Captain" lead />
            <div className="capDivider" aria-hidden="true" />
            <Person person={team.viceCaptain} role="Vice-captain" />
          </article>
        ))}
      </div>
    </section>
  );
}
