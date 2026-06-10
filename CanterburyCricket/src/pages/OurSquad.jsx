// src/pages/OurSquad/OurSquad.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./OurSquadFlip.css";

// Ranked, tap-to-expand squad list (jersey order)
import SquadRanking from "../components/SquadRanking/SquadRanking";
// Rotating featured player panel (auto-rotates daily among players who have a photo)
import SquadSpotlight from "../components/SquadSpotlight/SquadSpotlight";

// Optional: pin a specific player to the spotlight (player of the month, debut, etc.).
// Leave "" for automatic daily rotation. Must exactly match a player's Full Name.
const SPOTLIGHT_PIN = "";

const ROLE_OPTIONS = ["All", "Batter", "Bowler", "All-rounder", "Wicket-keeper"];
const DEFAULT_BIOS = [
  "Always ready to give their best for the team.",
  "Plays with heart and team spirit.",
  "A proud part of our Canterbury family.",
  "Committed, competitive, and team-first.",
  "Brings energy and passion to every match.",
  "Always up for the challenge.",
  "A valued member of the Canterbury squad.",
  "Proud to wear Canterbury colours.",
  "Plays for the love of the game and the team.",
  "Heart on the sleeve, bat in hand.",
];

// deterministic hash so it doesn't change on every render
function stableIndexFromString(str, max) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % max;
}

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

function mapRowToPlayer(row, idx) {
  const name = (row["Full Name"] ?? "").toString().trim() || `Player ${idx + 1}`;
  const role = normalizeRole(row["Playing Role"]);

  const batting = (row["Playing Style"] ?? "").toString().trim();
  const bowling = (row["Bowling Style"] ?? "").toString().trim();
  const jersey = (row["Jersey Number"] ?? "").toString().trim();

  const bio = pick(row, ["Short Bio", "Short bio", "Bio", "About", "Player Bio", "Short Bio "]);
  const image = normalizeDriveImageUrl(row["Photo for Squad Banner"]) || fallbackImage;

  const tags = [batting ? `Bat: ${batting}` : null, bowling ? `Bowl: ${bowling}` : null, jersey ? `#${jersey}` : null].filter(Boolean);

  return {
    id: `${name}-${idx}`,
    name,
    role,
    image,
    bio,
    tags,
    batting,
    bowling,
    jersey,
  };
}

// ✅ CHANGE: new helper to create a “handle” like @shadcn profile cards
function makeHandle(name) {
  const base = (name || "player")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "");
  return base || "player";
}

// ✅ CHANGE: new helper to style inner gradient per role (keeps it “club themed”)
function roleAccentRGB(role) {
  const r = normalized(role);
  if (r.includes("wicket")) return "255, 211, 106"; // light gold
  if (r.includes("bowl")) return "224, 48, 30";     // crest red
  if (r.includes("bat")) return "247, 181, 0";       // gold
  return "245, 130, 31";                             // amber (all-rounder)
}

function innerGradientForRole(role) {
  return `linear-gradient(145deg, rgba(${roleAccentRGB(role)}, 0.26) 0%, rgba(8,12,22,0.94) 100%)`;
}

function behindGlowForRole(role) {
  return `rgba(${roleAccentRGB(role)}, 0.5)`;
}

export default function OurSquad() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");

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
        normalized(p.bio).includes(q) ||
        (p.tags || []).some((t) => normalized(t).includes(q));

      const matchRole = role === "All" || normalized(p.role) === normalized(role);
      return matchQuery && matchRole;
    });
  }, [players, query, role]);

  const clearFilters = () => {
    setQuery("");
    setRole("All");
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        {/* ✅ CHANGE: Added (optional) header back, but still safe to remove */}
        <div className="squadHeader">
          <div>
            <h1 className="squadTitle">Our Squad</h1>
            <p className="squadSubtitle">Meet the Canterbury players — built from live squad submissions.</p>
          </div>

          {/* ✅ CHANGE: Left filters “wired” but UI still optional */}
          {/* <div className="headerActions">
            <button className="btn ghost" onClick={clearFilters} type="button">Clear</button>
            <button className="btn" onClick={fetchSquad} type="button">Refresh</button>
          </div> */}
        </div>

        {loadError ? (
          <div className="alert error" role="alert">
            <strong>Squad data failed to load:</strong> {loadError}
          </div>
        ) : null}

        {/* ✅ CHANGE: Loading UI updated to match ProfileCard sizing */}
        {!loading && players.length > 0 ? (
          <SquadSpotlight
            players={players}
            fallbackImage={fallbackImage}
            pinnedName={SPOTLIGHT_PIN}
          />
        ) : null}

        {loading ? (
          <div className="sr-skeletonList">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="sr-skeletonRow" key={`sk-${i}`} />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No matches</div>
            <div className="emptySub">Try a different name or role.</div>
          </div>
        ) : (
          // ✅ CHANGE: Replaced <ChromaGrid /> with a simple responsive grid of <ProfileCard />
          <SquadRanking players={filteredPlayers} fallbackImage={fallbackImage} />
        )}
      </div>
    </div>
  );
}