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
        <stop offset="1" stop-color="#131a2a"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="450" cy="420" r="160" fill="rgba(255,255,255,0.06)"/>
    <text x="50%" y="73%" dominant-baseline="middle" text-anchor="middle"
      fill="rgba(255,255,255,0.55)" font-family="Arial" font-size="44">
      Player
    </text>
  </svg>
`);

// ===== Helpers (kept from the previously working MUI version) =====

// Drive link -> direct image URL
function normalizeDriveImageUrl(input) {
  if (!input) return "";
  const raw = String(input).trim();
  if (!raw) return "";

  const firstUrl = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .find((s) => /^https?:\/\//i.test(s));

  if (!firstUrl) return "";

  const fileMatch = firstUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const openMatch = firstUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
  const ucMatch = firstUrl.match(/[?&]id=([^&]+)/);

  const id = fileMatch?.[1] || openMatch?.[1] || ucMatch?.[1];
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;

  return firstUrl;
}

function normalizeRole(raw) {
  const s = (raw ?? "").toString().trim().toLowerCase();
  if (!s) return "All-rounder";
  if (s.includes("wicket") || s === "wk" || s.includes("keeper")) return "Wicket-keeper";
  if (s.includes("all")) return "All-rounder";
  if (s.includes("bowl")) return "Bowler";
  if (s.includes("bat")) return "Batter";
  return "All-rounder";
}

function normalized(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function pick(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

/**
 * Maps Apps Script JSON rows to UI model.
 * Sheet headers:
 * Timestamp, Full Name, Playing Role, Playing Style, Bowling Style, Jersey Number, Photo for Squad Banner, Short Bio
 */
function mapRowToPlayer(row, idx) {
  const name = (row["Full Name"] ?? "").toString().trim() || `Player ${idx + 1}`;
  const role = normalizeRole(row["Playing Role"]);
  const batting = (row["Playing Style"] ?? "").toString().trim();
  const bowling = (row["Bowling Style"] ?? "").toString().trim();
  const jersey = (row["Jersey Number"] ?? "").toString().trim();
  const bio = pick(row, ["Short Bio", "Short bio", "Bio", "About", "Player Bio", "Short Bio "]);

  const image = normalizeDriveImageUrl(row["Photo for Squad Banner"]) || fallbackImage;

  // no division in the form yet
  const division = "T20";

  const tags = [
    batting ? `Bat: ${batting}` : null,
    bowling ? `Bowl: ${bowling}` : null,
    jersey ? `#${jersey}` : null,
  ].filter(Boolean);

  return {
    id: `${name}-${idx}`,
    name,
    role,
    division,
    divisions: [division],
    image,
    bio,
    tags,
    isCaptain: false,
    isWicketKeeper: role === "Wicket-keeper",
  };
}

export default function OurSquad() {
  // Filters (kept even if UI is temporarily disabled)
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

  // Flip state
  const [flippedId, setFlippedId] = useState(null);

  // Data state
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchSquad = useCallback(async () => {
    setLoadError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/squad?_t=${Date.now()}`);
      const json = await res.json();

      // match the previously working contract exactly
      if (!json?.ok) throw new Error(json?.error || "API error");

      const mapped = (json.data || []).map(mapRowToPlayer);
      mapped.sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(mapped);
    } catch (e) {
      setPlayers([]);
      setLoadError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  const filtered = useMemo(() => {
    const q = normalized(query);

    return players.filter((p) => {
      const matchQuery =
        !q ||
        normalized(p.name).includes(q) ||
        normalized(p.role).includes(q) ||
        normalized(p.division).includes(q) ||
        (p.tags || []).some((t) => normalized(t).includes(q));

      const matchRole = role === "All" || normalized(p.role) === normalized(role);

      const divs = Array.isArray(p.divisions) && p.divisions.length ? p.divisions : [p.division];
      const matchDiv = division === "All" || divs.some((d) => normalized(d) === normalized(division));

      return matchQuery && matchRole && matchDiv;
    });
  }, [players, query, role, division]);

  const clearFilters = () => {
    setQuery("");
    setRole("All");
    setDivision("All");
    setFlippedId(null);
  };

  const toggleFlip = (id) => setFlippedId((prev) => (prev === id ? null : id));

  const onCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip(id);
    }
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        {/* ================= HEADER (TEMP DISABLED) =================
        <header className="squadHeader">
          <div>
            <h1 className="squadTitle">Our Squad</h1>
            <p className="squadSubtitle">
              Meet the Canterbury crew — tap a card for details 🏏
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
        ========================================================== */}

        {/* ================= FILTER BAR (TEMP DISABLED) =================
        <section className="filterBar">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true">⌕</span>
            <input
              className="searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player…"
              type="search"
            />
          </div>

          <div className="selectRow">
            <label className="selectField">
              <span className="selectLabel">Role</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </label>

            <label className="selectField">
              <span className="selectLabel">Division</span>
              <select className="select" value={division} onChange={(e) => setDivision(e.target.value)}>
                {DIV_OPTIONS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="metaPill" aria-live="polite">
            {loading ? "Loading…" : `${filtered.length} player${filtered.length === 1 ? "" : "s"}`}
          </div>
        </section>
        <div className="filterSpacer" />
        ============================================================= */}

        {loadError ? (
          <div className="alert error" role="alert">
            <strong>Squad data failed to load:</strong> {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div className="skeletonCard" key={`sk-${i}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No matches</div>
            <div className="emptySub">Try a different name, role, or division.</div>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p, idx) => {
              const key = p.id ?? p.name ?? idx;
              const isFlipped = flippedId === key;

              const img = p.image || fallbackImage;
              const displayRole = p.role ?? "All-rounder";
              const displayDiv = p.division ?? "T20";

              return (
                <div
                  className="flipCard"
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isFlipped}
                  aria-label={`Open details for ${p.name}`}
                  onClick={() => toggleFlip(key)}
                  onKeyDown={(e) => onCardKeyDown(e, key)}
                >
                  <div className={`flipInner ${isFlipped ? "isFlipped" : ""}`}>
                    {/* FRONT */}
                    <div className="cardFace cardFront">
                      <div className="cardMedia">
                        <img
                          className="playerImg"
                          src={img}
                          alt={p.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImage;
                          }}
                        />

                        <div className="badgeRow">
                          <span className="badge">{displayDiv}</span>
                          <span className="badge alt">{displayRole}</span>
                          {p.isCaptain ? <span className="badge alt">Captain</span> : null}
                          {p.isWicketKeeper ? <span className="badge alt">WK</span> : null}
                        </div>
                      </div>

                      <div className="cardBody">
                        <h3 className="playerName">{p.name}</h3>

                        <div className="backTags" style={{ marginTop: 10 }}>
                          {(p.tags || ["Team-first", "Match-ready"]).slice(0, 6).map((t) => (
                            <span key={t} className="badge" style={{ background: "rgba(12,14,20,0.62)" }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="hint">Tap for details</div>
                      </div>
                    </div>

                    {/* BACK */}
                    <div className="cardFace cardBack">
                      <div className="backTop">
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <img
                            src={img}
                            alt={p.name}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "999px",
                              objectFit: "cover",
                              border: "1px solid rgba(255,255,255,0.14)",
                            }}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackImage;
                            }}
                          />
                          <div>
                            <div className="backName">{p.name}</div>
                            <div className="backMeta">
                              {displayRole} • {displayDiv}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="backBody">
                        <div className="backLabel">About</div>
                        <div className="backText">
                          {p.bio ||
                            "Solid contributor for the club — reliable, competitive, and always up for a big game."}
                        </div>

                        <div className="backTags" style={{ marginTop: 12 }}>
                          {(p.tags || ["Team-first", "Match-ready"]).slice(0, 6).map((t) => (
                            <span key={t} className="badge" style={{ background: "rgba(255,255,255,0.06)" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="hint">Tap to go back</div>
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
