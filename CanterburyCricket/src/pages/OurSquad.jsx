// src/pages/OurSquad/OurSquad.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./OurSquadFlip.css";

const ROLE_OPTIONS = ["All", "Batter", "Bowler", "All-rounder", "Wicket-keeper"];
const DIV_OPTIONS = ["All", "T20", "CTZ", "CHG"];

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
const safe = (v) => (v === null || v === undefined ? "" : String(v));

function extractArray(json) {
  // supports: []  | {data: []} | {ok:true,data:[]} | {players:[]} | {result:[]} etc.
  if (Array.isArray(json)) return json;

  if (json && typeof json === "object") {
    if (json.ok === false) {
      // your API might send {ok:false,error:"..."}
      throw new Error(json.error || "API returned ok:false");
    }
    const candidates = [json.data, json.players, json.result, json.items];
    for (const c of candidates) if (Array.isArray(c)) return c;
  }

  throw new Error("Unexpected response shape from /api/squad");
}

export default function OurSquad() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

  const [flippedId, setFlippedId] = useState(null);

  const fetchSquad = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await fetch(`/api/squad?_t=${Date.now()}`);
      const rawText = await res.text();

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${rawText.slice(0, 120)}`);
      }

      let json;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`API did not return JSON: ${rawText.slice(0, 140)}`);
      }

      const data = extractArray(json);
      setPlayers(data);
    } catch (e) {
      setPlayers([]);
      setLoadError(e?.message || "Failed to load squad");
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
      const name = safe(p.name || p.player || p.fullName).toLowerCase();
      const div = safe(p.division || p.div || p.team).toUpperCase();
      const r = normalizeRole(p.role || p.type || "").toLowerCase();

      const matchQuery =
        !q ||
        name.includes(q) ||
        safe(p.nickname).toLowerCase().includes(q) ||
        safe(p.battingStyle).toLowerCase().includes(q) ||
        safe(p.bowlingStyle).toLowerCase().includes(q);

      const matchRole = role === "All" || r === role.toLowerCase();
      const matchDiv = division === "All" || div === division;

      return matchQuery && matchRole && matchDiv;
    });
  }, [players, query, role, division]);

  const clearFilters = () => {
    setQuery("");
    setRole("All");
    setDivision("All");
    setFlippedId(null);
  };

  const toggleFlip = (id) => {
    setFlippedId((prev) => (prev === id ? null : id));
  };

  const onCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip(id);
    }
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        <header className="squadHeader">
          <div>
            <h1 className="squadTitle">Our Squad</h1>
            <p className="squadSubtitle">
              Search players, filter by role/division, and click a card to flip.
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
{/* ================= FILTER BAR (TEMP DISABLED) =================
        <section className="filterBar">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true">
              ⌕
            </span>
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
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
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
<div className="filterSpacer" />
============================================================== */}
        {loadError ? (
          <div className="alert error" role="alert">
            <strong>Squad data failed to load:</strong> {loadError}
            <div className="smallHint">
              Tip: open <code>/api/squad</code> in the browser and confirm it returns JSON.
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeletonCard" key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No players found</div>
            <div className="emptySub">Try clearing filters or searching a different name.</div>
            <button className="btn" onClick={clearFilters} type="button">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p, idx) => {
              const id = p.id || p._id || p.email || `${p.name}-${idx}`;
              const name = safe(p.name || p.player || p.fullName || "Unknown Player");
              const div = safe(p.division || p.div || p.team || "—").toUpperCase();
              const roleLabel = normalizeRole(p.role || p.type || "");
              const imageUrl = p.image || p.photo || p.avatar || fallbackImage;

              const isFlipped = flippedId === id;

              return (
                <div
                  className="flipCard"
                  key={id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isFlipped}
                  aria-label={`Flip card for ${name}`}
                  onClick={() => toggleFlip(id)}
                  onKeyDown={(e) => onCardKeyDown(e, id)}
                >
                  <div className={`flipInner ${isFlipped ? "isFlipped" : ""}`}>
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
                          {safe(p.battingStyle || p.batStyle || "Batting: —")} •{" "}
                          {safe(p.bowlingStyle || p.bowlStyle || "Bowling: —")}
                        </p>
                        <div className="hint">Click to flip</div>
                      </div>
                    </div>

                    {/* BACK */}
                    <div className="cardFace cardBack">
                      <div className="backTop">
                        <h3 className="playerName">{name}</h3>
                        <p className="playerMeta">
                          {div} • {roleLabel}
                        </p>
                      </div>

                      <div className="stats">
                        <div className="stat">
                          <span className="statLabel">Matches</span>
                          <span className="statValue">{safe(p.matches ?? p.mat ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">Runs</span>
                          <span className="statValue">{safe(p.runs ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">Wickets</span>
                          <span className="statValue">{safe(p.wickets ?? "—")}</span>
                        </div>
                        <div className="stat">
                          <span className="statLabel">SR / Econ</span>
                          <span className="statValue">
                            {safe(p.strikeRate ?? p.sr ?? "—")} / {safe(p.econ ?? "—")}
                          </span>
                        </div>
                      </div>

                      <p className={`bio ${p.bio || p.about ? "" : "dim"}`}>
                        {safe(p.bio || p.about || "Add a short bio for this player in your sheet later.")}
                      </p>

                      <div className="hint">Click to flip back</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
