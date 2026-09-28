// src/components/SquadRanking/SquadRanking.jsx
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./SquadRanking.css";

// Role -> crest-palette accent (same family used across the site)
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

// Numeric jersey if possible (for sorting); players without go last.
function jerseyNum(j) {
  const n = parseInt(String(j ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export default function SquadRanking({ players = [], fallbackImage }) {
  const [openId, setOpenId] = useState(null);

  const ordered = useMemo(() => {
    return [...players].sort((a, b) => {
      const ja = jerseyNum(a.jersey);
      const jb = jerseyNum(b.jersey);
      if (ja != null && jb != null) return ja - jb;
      if (ja != null) return -1; // numbered first
      if (jb != null) return 1;
      return (a.name || "").localeCompare(b.name || ""); // unnumbered: alphabetical
    });
  }, [players]);

  const toggle = useCallback(
    (id) => setOpenId((cur) => (cur === id ? null : id)),
    []
  );

  return (
    <ol className="sr-list">
      {ordered.map((p, i) => {
        const id = p.id || `${p.name}-${i}`;
        const isOpen = openId === id;
        const { first, last } = splitName(p.name);
        const jn = jerseyNum(p.jersey);
        const label = jn != null ? String(jn).padStart(2, "0") : "—";
        const rgb = roleRGB(p.role);
        const hasStats = p.batting || p.bowling || p.bio;

        return (
          <li
            key={id}
            className={`sr-item ${isOpen ? "is-open" : ""}`}
            style={{ "--sr-rgb": rgb }}
          >
            <button
              type="button"
              className="sr-row"
              aria-expanded={isOpen}
              onClick={() => toggle(id)}
            >
              <span className="sr-num">{label}</span>

              <span className="sr-name">
                {first ? <span className="sr-first">{first} </span> : null}
                <span className="sr-last">{last}</span>
              </span>

              <span className="sr-role">{p.role || "All-rounder"}</span>

              <span className={`sr-chev ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                ⌄
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="sr-panelWrap"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="sr-panel">
                    <div className="sr-photoFrame">
                      <img
                        className="sr-photo"
                        src={p.image || fallbackImage}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          if (fallbackImage && e.currentTarget.src !== fallbackImage) {
                            e.currentTarget.src = fallbackImage;
                          }
                        }}
                      />
                    </div>

                    <div className="sr-detail">
                      <div className="sr-detailHead">
                        <span className="sr-roleBadge">{p.role || "All-rounder"}</span>
                        {jn != null ? <span className="sr-jersey">#{jn}</span> : null}
                      </div>

                      {hasStats ? (
                        <dl className="sr-stats">
                          {p.batting ? (
                            <div className="sr-stat">
                              <dt>Batting</dt>
                              <dd>{p.batting}</dd>
                            </div>
                          ) : null}
                          {p.bowling ? (
                            <div className="sr-stat">
                              <dt>Bowling</dt>
                              <dd>{p.bowling}</dd>
                            </div>
                          ) : null}
                          {p.bio ? (
                            <div className="sr-stat sr-stat--bio">
                              <dt>Bio</dt>
                              <dd>{p.bio}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : (
                        <p className="sr-noStats">Proud member of the Canterbury squad.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}