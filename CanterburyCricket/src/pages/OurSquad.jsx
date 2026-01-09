// src/pages/OurSquad/OurSquad.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./OurSquadFlip.css";

const ROLE_OPTIONS = ["All", "Batter", "Bowler", "All-rounder", "Wicket-keeper"];
const DIV_OPTIONS = ["All", "T20", "CTZ", "CHG"];

// same fallback idea you used earlier
const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#0b1220"/>
        <stop offset="1" stop-color="#141a2a"/>
      </linearGradient>
    </defs>
    <rect width="900" height="1200" fill="url(#g)"/>
    <circle cx="450" cy="420" r="180" fill="rgba(255,255,255,0.08)"/>
    <rect x="250" y="670" width="400" height="54" rx="18" fill="rgba(255,255,255,0.08)"/>
    <rect x="200" y="750" width="500" height="36" rx="14" fill="rgba(255,255,255,0.06)"/>
    <text x="50%" y="92%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial" font-size="34" fill="rgba(255,255,255,0.45)">
      Canterbury CC
    </text>
  </svg>
`);

function normalizeRole(role = "") {
  const r = String(role).toLowerCase();
  if (r.includes("wicket")) return "Wicket-keeper";
  if (r.includes("all")) return "All-rounder";
  if (r.includes("bowl")) return "Bowler";
  if (r.includes("bat")) return "Batter";
  return role || "—";
}

function safeText(v) {
  return v === null || v === undefined ? "" : String(v);
}

export default function OurSquad() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

  // flip-card state (track which card is flipped)
  const [flippedId, setFlippedId] = useState(null);

  const fetchSquad = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/squad?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      // Support either:
      // - { ok: true, data: [...] }
      // - [...]
      const data = Array.isArray(json) ? json : json?.data;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response shape from /api/squad");
      }

      setPlayers(data);
    } catch (e) {
      setLoadError(e?.message || "Failed to load squad");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return players.filter((p) => {
      const name = safeText(p.name || p.player || p.fullName).toLowerCase();
      const div = safeText(p.division || p.div || p.team).toUpperCase();
      const r = normalizeRole(p.role || p.type || "").toLowerCase();

      const matchQuery =
        !q ||
        name.includes(q) ||
        safeText(p.nickname).toLowerCase().includes(q) ||
        safeText(p.battingStyle).toLowerCase().includes(q) ||
        safeText(p.bowlingStyle).toLowerCase().includes(q);

      const matchRole = role === "All" || r === role.toLowerCase();
      const matchDiv = division === "All" || div === division;

      return matchQuery && matchRole && matchDiv;
    });
  }, [players, query, role, division]);

  const onCardToggle = (id) => {
    setFlippedId((prev) => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setQuery("");
    setRole("All");
    setDivision("All");
    setFlippedId(null);
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        <header className="squadHeader">
          <div>
            <h1 className="squadTitle">Our Squad</h1>
            <p className="squadSubtitle">
              Search players, filter by role and division, and flip a card to see details.
            </p>
          </div>

          <div className="headerActions">
            <button className="btn ghost" onClick={clearFilters} type="button">
              Clear
            </button>
            <button className="btn" onClick={fetchSquad} type="button">
              Refresh
            </button>
          </div>
        </header>

        <section className="filterBar" aria-label="Squad filters">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true">⌕</span>
            <input
              className="searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, style, nickname…"
              type="search"
            />
          </div>

          <div className="selectRow">
            <label className="selectField">
              <span className="selectLabel">Role</span>
              <select
                className="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="selectField">
              <span className="selectLabel">Division</span>
              <select
                className="select"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              >
                {DIV_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="metaPill" aria-live="polite">
            {loading ? "Loading…" : `${filtered.length} player${filtered.length === 1 ? "" : "s"}`}
          </div>
        </section>

        {loadError ? (
          <div className="alert error" role="alert">
            <strong>Squad data failed to load:</strong> {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeletonCard" key={i} />
            ))}
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p, idx) => {
              const id = p.id || p._id || p.email || `${p.name}-${idx}`;
              const name = safeText(p.name || p.player || p.fullName || "Unknown Player");
              const div = safeText(p.division || p.div || p.team || "—").toUpperCase();
              const roleLabel = normalizeRole(p.role || p.type || "");
              const imageUrl = p.image || p.photo || p.avatar || fallbackImage;

              const isFlipped = flippedId === id;

              return (
                <div className="flipCard" key={id}>
                  <button
                    type="button"
                    className={`flipInner ${isFlipped ? "isFlipped" : ""}`}
                    onClick={() => onCardToggle(id)}
                    aria-pressed={isFlipped}
                    aria-label={`Open ${name} details`}
                  >
                    {/* FRONT */}
                    <div className="cardFace cardFront">
                      <div className="cardMedia">
                        <img
                          src={imageUrl}
                          alt={name}
                          className="playerImg"
                          onError={(e) => {
                            e.currentTarget.src = fallbackImage;
                          }}
                        />
                        <div className="badgeRow">
                          <span className="badge">{div}</span>
                          <span className="badge alt">{roleLabel}</span>
                        </div>
                      </div>

                      <div className="cardBody">
                        <h3 className="playerName">{name}</h3>
                        <p className="playerMeta">
                          {safeText(p.battingStyle || p.batStyle || "Batting: —")}
                          {" • "}
                          {safeText(p.bowlingStyle || p.bowlStyle || "Bowling: —")}
                        </p>

                        <div className="hint">Click to flip</div>
                      </div>
                    </div>

                    {/* BACK */}
                    <div className="cardFace cardBack">
                      <div className="backTop">
                        <h3 className="playerName">{name}</h3>
                        <p className="playerMeta">{div} • {roleLabel}</p>
                      </div>

                      <div className="stats">
                        <div className="stat">
                          <span className="statLabel">Matches</span>
                          <span className="statValue">{safeText(p.matches ?? p.mat ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">Runs</span>
                          <span className="statValue">{safeText(p.runs ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">Wickets</span>
                          <span className="statValue">{safeText(p.wickets ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">SR / Econ</span>
                          <span className="statValue">
                            {safeText(p.strikeRate ?? p.sr ?? "—")} / {safeText(p.econ ?? "—")}
                          </span>
                        </div>
                      </div>

                      {p.bio || p.about ? (
                        <p className="bio">{safeText(p.bio || p.about)}</p>
                      ) : (
                        <p className="bio dim">Add a short bio for this player in your sheet later.</p>
                      )}

                      <div className="hint">Click to flip back</div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
