// src/pages/OurSquad/OurSquad.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./OurSquadFlip.css";
import ChromaGrid from "../../components/ChromaGrid/ChromaGrid";

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

// Drive link -> direct-ish image URL
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
 * Apps Script JSON row -> internal player model
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

  // If you don’t have division in the form yet:
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
  };
}

/** Small helper to give each role a consistent neon feel */
function roleTheme(role) {
  const r = normalized(role);
  if (r.includes("wicket")) {
    return {
      borderColor: "#22c55e",
      gradient: "linear-gradient(210deg, rgba(34,197,94,0.95), #000)",
    };
  }
  if (r.includes("bowl")) {
    return {
      borderColor: "#06b6d4",
      gradient: "linear-gradient(200deg, rgba(6,182,212,0.95), #000)",
    };
  }
  if (r.includes("bat")) {
    return {
      borderColor: "#f59e0b",
      gradient: "linear-gradient(165deg, rgba(245,158,11,0.95), #000)",
    };
  }
  // all-rounder / default
  return {
    borderColor: "#8b5cf6",
    gradient: "linear-gradient(225deg, rgba(139,92,246,0.95), #000)",
  };
}

/** Convert internal player model -> ChromaGrid item */
function playerToChromaItem(p) {
  const theme = roleTheme(p.role);

  // subtitle: keep it compact and informative
  const subtitleParts = [
    p.role || "All-rounder",
    p.division ? `• ${p.division}` : null,
    p.tags?.find((t) => t.startsWith("#")) || null, // jersey if present
  ].filter(Boolean);

  return {
    id: p.id,
    image: p.image || fallbackImage,
    title: p.name,
    subtitle: subtitleParts.join(" "),
    handle: p.tags?.filter((t) => t.startsWith("Bat:") || t.startsWith("Bowl:")).slice(0, 1)?.[0] || "",
    location: p.bio ? p.bio.slice(0, 52) + (p.bio.length > 52 ? "…" : "") : "",

    // Chroma styling
    borderColor: theme.borderColor,
    gradient: theme.gradient,

    // optional click-through (leave null/empty to disable opening a new tab)
    url: "", // e.g. `/player/${p.id}` if you later add routing
  };
}

export default function OurSquad() {
  // Filters (kept even if your UI is disabled right now)
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

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

  const filteredPlayers = useMemo(() => {
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

  const chromaItems = useMemo(
    () => filteredPlayers.map(playerToChromaItem),
    [filteredPlayers]
  );

  const clearFilters = () => {
    setQuery("");
    setRole("All");
    setDivision("All");
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        {/* You can re-enable your header + filters any time */}
        {/* <button onClick={clearFilters}>Clear</button>
            <button onClick={fetchSquad}>Refresh</button> */}

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
        ) : chromaItems.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No matches</div>
            <div className="emptySub">Try a different name, role, or division.</div>
          </div>
        ) : (
          <ChromaGrid
            items={chromaItems}
            className="squadChroma"
            radius={340}
            columns={3}
            rows={2}
            damping={0.45}
            fadeOut={0.6}
            ease="power3.out"
          />
        )}
      </div>
    </div>
  );
}
