// OurSquad.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
  Avatar,
  Divider,
  Alert,
  Button,
  Skeleton,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
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

// ✅ Robust Drive link -> direct image URL
function normalizeDriveImageUrl(input) {
  if (!input) return "";
  const raw = String(input).trim();
  if (!raw) return "";

  const firstUrl = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .find((s) => /^https?:\/\//i.test(s));

  if (!firstUrl) return "";

  // extract ID from common formats
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
 * Maps Apps Script JSON rows to the UI player model.
 * Uses your exact Sheet headers:
 * Timestamp, Full Name, Playing Role, Playing Style, Bowling Style, Jersey Number, Photo for Squad Banner, Short Bio
 */
function mapRowToPlayer(row, idx) {
  const name = (row["Full Name"] ?? "").toString().trim() || `Player ${idx + 1}`;
  const role = normalizeRole(row["Playing Role"]);
  const batting = (row["Playing Style"] ?? "").toString().trim();
  const bowling = (row["Bowling Style"] ?? "").toString().trim();
  const jersey = (row["Jersey Number"] ?? "").toString().trim();
  const bio = pick(row, [
  "Short Bio",
  "Short bio",
  "Bio",
  "About",
  "Player Bio",
  "Short Bio "
]);


  const image = normalizeDriveImageUrl(row["Photo for Squad Banner"]) || fallbackImage;

  // You don't have division in form yet; default for now
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
    // optional flags (keep false unless you add fields later)
    isCaptain: false,
    isWicketKeeper: role === "Wicket-keeper",
  };
}

export default function OurSquad() {
  // Filters
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");

  // Flip state
  const [flipped, setFlipped] = useState(() => new Set());

  // Data state
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchSquad = async () => {
    setLoadError("");
    setLoading(true);

    try {
      const base = import.meta.env.VITE_SQUAD_API_URL;
      const key = import.meta.env.VITE_SQUAD_API_KEY;

      if (!base || !key) {
        throw new Error("Missing VITE_SQUAD_API_URL or VITE_SQUAD_API_KEY in .env");
      }

      const url = new URL(base);
      url.searchParams.set("key", key);
      // cache-bust so newly submitted Form data shows up quickly
      url.searchParams.set("_t", String(Date.now()));

      const res = await fetch(url.toString());
      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error || "API error");

      const mapped = (json.data || []).map(mapRowToPlayer);

      // Sort by name for stability
      mapped.sort((a, b) => a.name.localeCompare(b.name));

      setPlayers(mapped);
    } catch (e) {
      setLoadError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const matchDiv =
        division === "All" || divs.some((d) => normalized(d) === normalized(division));

      return matchQuery && matchRole && matchDiv;
    });
  }, [players, query, role, division]);

  const toggleFlip = (key) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Box className="squadPage">
      <Container maxWidth="lg" className="squadContainer">
        {/* Header */}
        <Box className="squadHeader">
          <Box>
            <Typography variant="h4" className="squadTitle">
              Our Squad
            </Typography>
            <Typography className="squadSubtitle">
              Meet the Canterbury crew — tap a card for details 🏏
            </Typography>
          </Box>

          <Box sx={{ mt: { xs: 2, sm: 0 } }}>
            <Button
              onClick={fetchSquad}
              startIcon={<RefreshRoundedIcon />}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 999 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Squad data failed to load: {loadError}
          </Alert>
        )}

        {/* Filters */}
        <Box className="filterBar">
          <Box className="filterBarInner">
            <Box className="filterLeft">
              <Box className="filterIconWrap" aria-hidden="true">
                <FilterAltRoundedIcon />
              </Box>

              <TextField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player…"
                size="small"
                className="searchField"
                InputProps={{
                  startAdornment: (
                    <Box className="searchIcon">
                      <SearchRoundedIcon fontSize="small" />
                    </Box>
                  ),
                }}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} className="filterRight">
              <FormControl size="small" className="selectField">
                <InputLabel>Role</InputLabel>
                <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                  {ROLE_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" className="selectField">
                <InputLabel>Division</InputLabel>
                <Select
                  value={division}
                  label="Division"
                  onChange={(e) => setDivision(e.target.value)}
                >
                  {DIV_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Chip
                label={
                  loading
                    ? "Loading…"
                    : `${filtered.length} player${filtered.length === 1 ? "" : "s"}`
                }
                className="countChip"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Box>

        {/* Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center"
  alignItems="stretch" className="squadGrid">

          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={`sk-${i}`}>
                  <Card elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
                    <Skeleton variant="rectangular" height={240} />
                    <Box sx={{ p: 2 }}>
                      <Skeleton height={28} width="70%" />
                      <Skeleton height={22} width="55%" />
                      <Skeleton height={22} width="45%" />
                    </Box>
                  </Card>
                </Grid>
              ))
            : filtered.map((p, idx) => {
                const key = p.id ?? p.name ?? idx;
                const isFlipped = flipped.has(key);

                const img = p.image || fallbackImage;
                const displayRole = p.role ?? "All-rounder";
                const displayDiv = p.division ?? "T20";

                return (
                  <Grid item xs={12} sm={6} md={4} key={key} sx={{
    display: "flex",          // ✅ make the grid cell a flex container
  }}>
                    <Box className="flipCardWrap">
                      <Card className={`flipCard ${isFlipped ? "isFlipped" : ""}`} 
                      elevation={0}>
                        <CardActionArea
    className="flipCardAction"
    onClick={() => toggleFlip(key)}
    aria-label={`Open details for ${p.name}`}
    sx={{ width: "100%", height: "100%", display: "block" }} // ✅ critical
  >
                          <Box className="flipInner">
                            {/* FRONT */}
                            <Box className="flipFace flipFront">
                              <Box className="cardMediaWrap">
                                <img
                                  className="cardMedia"
                                  src={img}
                                  alt={p.name}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    console.log("Image failed:", img);
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = fallbackImage;
                                  }}
                                />
                                <Box className="cardOverlay">
                                  <Chip label={displayDiv} className="divChip" size="small" />
                                </Box>
                              </Box>

                              <Box className="cardBody">
                                <Typography variant="h6" className="playerName">
                                  {p.name}
                                </Typography>

                                <Stack direction="row" spacing={1} className="roleRow">
                                  <Chip label={displayRole} size="small" className="roleChip" />
                                  {p.isCaptain && (
                                    <Chip label="Captain" size="small" className="badgeChip" />
                                  )}
                                  {p.isWicketKeeper && (
                                    <Chip label="WK" size="small" className="badgeChip" />
                                  )}
                                </Stack>

                                <Typography className="tapHint">Tap for details</Typography>
                              </Box>
                            </Box>

                            {/* BACK */}
                            <Box className="flipFace flipBack">
                              <Box className="backTop">
                                <Stack direction="row" spacing={1.2} alignItems="center">
                                  <Avatar src={img} alt={p.name} />
                                  <Box>
                                    <Typography className="backName">{p.name}</Typography>
                                    <Typography className="backMeta">
                                      {displayRole} • {displayDiv}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>

                              <Divider className="backDivider" />

                              <Box className="backBody">
                                <Typography className="backLabel">About</Typography>
                                <Typography className="backText">
                                  {p.bio ||
                                    "Solid contributor for the club — reliable, competitive, and always up for a big game."}
                                </Typography>

                                <Box className="backTags">
                                  {(p.tags || ["Team-first", "Match-ready"]).slice(0, 6).map((t) => (
                                    <Chip key={t} label={t} size="small" className="tagChip" />
                                  ))}
                                </Box>
                              </Box>

                              <Typography className="tapHintBack">Tap to go back</Typography>
                            </Box>
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Box>
                  </Grid>
                );
              })}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box className="emptyState">
            <Typography variant="h6">No matches</Typography>
            <Typography className="emptySub">Try a different name, role, or division.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
