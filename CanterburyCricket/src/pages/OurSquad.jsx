import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
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

export default function OurSquad({ players = [] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");
  const [flipped, setFlipped] = useState(() => new Set()); // store player ids/names

  const normalized = (s) => (s ?? "").toString().trim().toLowerCase();

  const filtered = useMemo(() => {
    const q = normalized(query);

    return players.filter((p) => {
      const name = normalized(p.name);
      const pRole = p.role ?? p.primaryRole ?? "All-rounder";
      const pDiv = p.division ?? p.div ?? "All";

      const matchQuery =
        !q ||
        name.includes(q) ||
        normalized(pRole).includes(q) ||
        normalized(pDiv).includes(q);

      const matchRole = role === "All" || normalized(pRole) === normalized(role);
      const matchDiv = division === "All" || normalized(pDiv) === normalized(division);

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
        <Box className="squadHeader">
          <Box>
            <Typography variant="h4" className="squadTitle">
              Our Squad
            </Typography>
            <Typography className="squadSubtitle">
              Meet the Canterbury crew — tap a card for details 🏏
            </Typography>
          </Box>
        </Box>

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
                label={`${filtered.length} player${filtered.length === 1 ? "" : "s"}`}
                className="countChip"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Box>

        {/* Grid */}
        <Grid container spacing={2.2} className="squadGrid">
          {filtered.map((p, idx) => {
            const key = p.id ?? p.name ?? idx;
            const isFlipped = flipped.has(key);

            const img = p.image || p.photo || fallbackImage;
            const displayRole = p.role ?? p.primaryRole ?? "All-rounder";
            const displayDiv = p.division ?? p.div ?? "T20";

            return (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box className="flipCardWrap">
                  <Card className={`flipCard ${isFlipped ? "isFlipped" : ""}`} elevation={0}>
                    <CardActionArea
                      className="flipCardAction"
                      onClick={() => toggleFlip(key)}
                      aria-label={`Open details for ${p.name}`}
                    >
                      <Box className="flipInner">
                        {/* FRONT */}
                        <Box className="flipFace flipFront">
                          <Box className="cardMediaWrap">
                            <img className="cardMedia" src={img} alt={p.name} loading="lazy" />
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
                              {p.isCaptain && <Chip label="Captain" size="small" className="badgeChip" />}
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

        {filtered.length === 0 && (
          <Box className="emptyState">
            <Typography variant="h6">No matches</Typography>
            <Typography className="emptySub">
              Try a different name, role, or division.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
