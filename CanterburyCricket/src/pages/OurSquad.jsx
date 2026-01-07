// src/pages/OurSquad.jsx
import React, { useMemo, useState } from "react";
import { Card, CardBody, Chip, Avatar } from "@nextui-org/react";
import "./OurSquadFlip.css";

const ROLE_OPTIONS = ["All", "Batter", "Bowler", "All-rounder", "Wicket-keeper"];
const DIV_OPTIONS = ["All", "T20", "CTZ", "CHG"];

// Replace image with real imports later (e.g. import ameer from "../assets/players/ameer.jpg")
const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#0b1220"/>
        <stop offset="1" stop-color="#101b33"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="450" cy="420" r="160" fill="#1f2a44"/>
    <rect x="220" y="640" width="460" height="320" rx="160" fill="#1f2a44"/>
  </svg>
`);

const SQUAD = [
  {
    id: "p1",
    number: 13,
    name: "Ameer Khan",
    role: "Batter",
    division: "T20",
    batting: "Right-hand",
    bowling: "—",
    styles: ["Aggressive Opener", "Power-hitter"],
    bio: "Explosive top-order batter who attacks the powerplay.",
    image: fallbackImage,
  },
  {
    id: "p2",
    number: 5,
    name: "Varun Singh",
    role: "All-rounder",
    division: "CTZ",
    batting: "Right-hand",
    bowling: "Medium",
    styles: ["Utility", "Clutch"],
    bio: "Reliable all-rounder who delivers under pressure.",
    image: fallbackImage,
  },
  {
    id: "p3",
    number: 10,
    name: "Akram Syed",
    role: "Bowler",
    division: "CHG",
    batting: "Right-hand",
    bowling: "Leg-spin",
    styles: ["Wicket-taker", "Variations"],
    bio: "Leg-spinner who breaks partnerships with flight and deception.",
    image: fallbackImage,
  },
  {
    id: "p4",
    number: 20,
    name: "Aoun Ali",
    role: "Wicket-keeper",
    division: "T20",
    batting: "Left-hand",
    bowling: "—",
    styles: ["Safe hands", "Anchor"],
    bio: "Calm wicket-keeper and reliable batter who stabilizes the innings.",
    image: fallbackImage,
  },
];

const norm = (v) => (v || "").toString().trim().toLowerCase();

export default function OurSquad() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

  // Tap-to-flip (mobile); desktop flips on hover via CSS media query.
  const [tappedId, setTappedId] = useState(null);

  const filtered = useMemo(() => {
    const q = norm(query);

    return SQUAD.filter((p) => {
      if (role !== "All" && p.role !== role) return false;
      if (division !== "All" && p.division !== division) return false;
      if (!q) return true;

      const hay = norm(
        [p.name, p.role, p.division, p.batting, p.bowling, ...(p.styles || [])].join(" ")
      );
      return hay.includes(q);
    });
  }, [query, role, division]);

  const clearAll = () => {
    setQuery("");
    setRole("All");
    setDivision("All");
  };

  return (
    <div className="squadPage">
      <div className="squadContainer">
        {/* Header */}
        <div className="squadHeader">
          <div className="squadHeaderText">
            <h1 className="squadTitle">Our Squad</h1>
            <p className="squadSub">
              Hover a card to flip on desktop — tap to flip on mobile.
            </p>
          </div>

          <div className="squadSearchRow">
            <div className="squadSearch">
              <span className="squadSearchIcon" aria-hidden="true">
                ⌕
              </span>

              <input
                className="squadSearchInput"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: name, role, style…"
                aria-label="Search players"
              />

              {query && (
                <button
                  className="squadClearBtn"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="squadFilters">
          <div className="squadFilterCard">
            <div className="squadFilterTop">
              <div className="squadFilterTitle">Filters</div>

              {(query || role !== "All" || division !== "All") && (
                <button className="squadResetBtn" onClick={clearAll} type="button">
                  Reset
                </button>
              )}
            </div>

            <div className="squadFilterGrid">
              <label className="squadField">
                <span className="squadFieldLabel">Division</span>
                <select
                  className="squadSelect"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                >
                  {DIV_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="squadField">
                <span className="squadFieldLabel">Role</span>
                <select
                  className="squadSelect"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="squadResultsRow">
              <span className="squadResultsLabel">Results</span>
              <Chip size="sm" variant="flat" color="primary">
                {filtered.length}
              </Chip>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="squadGrid">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`flipCard ${tappedId === p.id ? "isFlipped" : ""}`}
              onClick={() => setTappedId(tappedId === p.id ? null : p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTappedId(tappedId === p.id ? null : p.id);
                }
              }}
              aria-label={`Flip card for ${p.name}`}
            >
              <div className="flipInner">
                {/* FRONT */}
                <Card className="flipFace flipFront" shadow="none">
                  <CardBody className="p-0 h-full">
                    <div className="frontTop">
                      <img className="frontPhoto" src={p.image} alt={p.name} />
                      <div className="numberBadge">#{p.number}</div>
                      <div className="frontVignette" />
                    </div>

                    <div className="frontBottom">
                      <div className="frontName">{p.name}</div>
                      <div className="frontMeta">
                        {p.role} • {p.division}
                      </div>

                      <Chip size="sm" variant="bordered" className="hintChip">
                        Hover / Tap to flip
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                {/* BACK */}
                <Card className="flipFace flipBack" shadow="none">
                  <CardBody className="p-4 h-full">
                    <div className="backHeader">
                      <div>
                        <div className="backName">{p.name}</div>
                        <div className="backMeta">
                          {p.role} • {p.division}
                        </div>
                      </div>

                      <Avatar src={p.image} className="backAvatar" radius="lg" />
                    </div>

                    <div className="backRow">
                      <Chip size="sm" variant="bordered" className="backChip">
                        Bat: {p.batting}
                      </Chip>
                      <Chip size="sm" variant="bordered" className="backChip">
                        Bowl: {p.bowling}
                      </Chip>
                    </div>

                    <div className="backStyles">
                      {(p.styles || []).map((s) => (
                        <Chip key={s} size="sm" variant="flat" color="primary">
                          {s}
                        </Chip>
                      ))}
                    </div>

                    <p className="backBio">{p.bio}</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="emptyState">
              <div className="emptyTitle">No players match your filters.</div>
              <div className="emptySub">
                Try changing Role/Division or clearing search.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ===== End of OurSquad.jsx =====