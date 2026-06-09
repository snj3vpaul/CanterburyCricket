// src/components/Captaincy/Captaincy2026.jsx
import { motion } from "framer-motion";
import { CAPTAINS_2026 } from "../../data/captains2026";
import "./Captaincy2026.css";

// "Varun Harish" -> "VH", "Sanjeev K Paul" -> "SP"
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ person, size }) {
  return (
    <span className={`capAvatar capAvatar--${size}`}>
      {person.img ? (
        <img src={person.img} alt={person.name} loading="lazy" />
      ) : (
        <span className="capAvatarInitials">{initials(person.name)}</span>
      )}
    </span>
  );
}

export default function Captaincy2026() {
  return (
    <section className="capWrap" aria-label="2026 captaincy announcement">
      <div className="capHead">
        <span className="capKicker">Leadership · 2026</span>
        <h2 className="capTitle">Meet Our 2026 Captains</h2>
        <p className="capSub">
          Leading Canterbury across all three divisions this season.
        </p>
      </div>

      <div className="capGrid">
        {CAPTAINS_2026.map((team, i) => (
          <motion.article
            key={team.key}
            className="capCard"
            style={{ "--cap-accent": team.accent }}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="capCardGlow" aria-hidden="true" />
            <span className="capBadge">{team.key}</span>
            <p className="capDivision">{team.division}</p>

            {/* Captain — prominent */}
            <div className="capPerson capPerson--lead">
              <Avatar person={team.captain} size="lg" />
              <div className="capPersonText">
                <span className="capRole capRole--c">Captain</span>
                <span className="capName">{team.captain.name}</span>
              </div>
            </div>

            <span className="capDivider" aria-hidden="true" />

            {/* Vice-captain */}
            <div className="capPerson">
              <Avatar person={team.viceCaptain} size="sm" />
              <div className="capPersonText">
                <span className="capRole capRole--vc">Vice-Captain</span>
                <span className="capName capName--sm">{team.viceCaptain.name}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}