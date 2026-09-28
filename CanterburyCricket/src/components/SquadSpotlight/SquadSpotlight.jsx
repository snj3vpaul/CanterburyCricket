// src/components/SquadSpotlight/SquadSpotlight.jsx
import { useMemo } from "react";
import { motion } from "framer-motion";
import "./SquadSpotlight.css";

function roleRGB(role) {
  const r = (role || "").toLowerCase();
  if (r.includes("wicket")) return "255, 211, 106"; // light gold
  if (r.includes("bowl")) return "224, 48, 30";     // crest red
  if (r.includes("bat")) return "247, 181, 0";       // gold
  return "245, 130, 31";                             // amber (all-rounder)
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  const last = parts.pop();
  return { first: parts.join(" "), last };
}

const dayIndex = () => Math.floor(Date.now() / 86_400_000); // changes once per day

/**
 * Featured "Player Spotlight".
 * - Only players WITH a real photo are eligible (never shows the placeholder).
 * - Rotates deterministically by day, so everyone sees the same one and it
 *   cycles fairly over time — no backend needed.
 * - pinnedName (optional) locks a specific player and overrides the rotation.
 */
export default function SquadSpotlight({ players = [], fallbackImage, pinnedName = "" }) {
  const player = useMemo(() => {
    const eligible = players.filter(
      (p) => p.image && p.image !== fallbackImage
    );
    if (eligible.length === 0) return null;

    if (pinnedName) {
      const pinned = eligible.find(
        (p) => (p.name || "").toLowerCase() === pinnedName.toLowerCase()
      );
      if (pinned) return pinned;
    }

    // Stable daily pick (sorted first so the index is consistent everywhere)
    const sorted = [...eligible].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
    return sorted[dayIndex() % sorted.length];
  }, [players, fallbackImage, pinnedName]);

  if (!player) return null;

  const { first, last } = splitName(player.name);
  const rgb = roleRGB(player.role);
  const jersey = String(player.jersey ?? "").replace(/\D/g, "");

  return (
    <motion.section
      className="sp-wrap"
      style={{ "--sp-rgb": rgb }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Player spotlight"
    >
      <span className="sp-glow" aria-hidden="true" />

      <div className="sp-photoFrame">
        <img
          className="sp-photo"
          src={player.image}
          alt={player.name}
          loading="lazy"
          onError={(e) => {
            if (fallbackImage) e.currentTarget.src = fallbackImage;
          }}
        />
      </div>

      <div className="sp-body">
        <span className="sp-kicker">★ Player Spotlight</span>

        <h2 className="sp-name">
          {first ? <span className="sp-first">{first} </span> : null}
          <span className="sp-last">{last}</span>
        </h2>

        <div className="sp-meta">
          <span className="sp-roleBadge">{player.role || "All-rounder"}</span>
          {jersey ? <span className="sp-jersey">#{jersey}</span> : null}
        </div>

        <dl className="sp-stats">
          {player.batting ? (
            <div className="sp-stat">
              <dt>Batting</dt>
              <dd>{player.batting}</dd>
            </div>
          ) : null}
          {player.bowling ? (
            <div className="sp-stat">
              <dt>Bowling</dt>
              <dd>{player.bowling}</dd>
            </div>
          ) : null}
          {player.bio ? (
            <div className="sp-stat sp-stat--bio">
              <dt>Bio</dt>
              <dd>{player.bio}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </motion.section>
  );
}