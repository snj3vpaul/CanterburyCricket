// src/pages/History/components/PerformerCard.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

function normalizeRole(roleRaw = "") {
  const r = String(roleRaw).toLowerCase().trim();

  // treat "all rounder", "all-rounder", etc.
  if (r.includes("all")) return "allrounder";
  if (r.includes("bowl")) return "bowler";
  if (r.includes("bat")) return "batter";

  // fallback: legends have "League Legend" etc.
  return "other";
}

function pickStatsByRole(role, s) {
  const val = (x) => (x === 0 ? 0 : x ?? "-");

  // 🟢 Bowler → Economy | Best Bowling | Bowling Average
  if (role === "bowler") {
    return [
      ["Wickets", val(s.wickets)],
      ["Best", val(s.bestBowling)],
      ["Bowl Avg", val(s.bowlingAverage ?? s.bowlingAvg ?? s.average)],
    ];
  }

  // 🔵 Batter → Strike Rate | 50s | Highest Score
  if (role === "batter") {
    return [
      ["Runs", val(s.runs)],
      ["50s", val(s.fifties)],
      ["HS", val(s.highestScore)],
    ];
  }

  // 🟡 All-rounder → Runs | Wickets | Strike Rate
  if (role === "allrounder") {
    return [
      ["Runs", val(s.runs)],
      ["Wkts", val(s.wickets)],
      ["HS", val(s.highestScore)],
    ];
  }

  // ⚪ Fallback (Legends / unknown): balanced trio
  const statA = s.runs != null ? ["Runs", val(s.runs)] : ["Wkts", val(s.wickets)];
  const statB = s.average != null ? ["Avg", val(s.average)] : ["SR", val(s.strikeRate)];
  const statC =
    s.bestBowling != null ? ["Best", val(s.bestBowling)] : ["HS", val(s.highestScore)];

  return [statA, statB, statC];
}

export default function PerformerCard({ performer, onOpen }) {
  const s = performer?.stats || {};

  const roleKey = useMemo(() => normalizeRole(performer?.role), [performer?.role]);
  const statsToShow = useMemo(() => pickStatsByRole(roleKey, s), [roleKey, s]);

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      sx={{
        cursor: "pointer",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.4 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.4} alignItems="center">
            <Avatar
              src={performer?.headshot}
              alt={performer?.name || "Performer"}
              sx={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.18)" }}
            />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                {performer?.name}
              </Typography>
              <Typography sx={{ opacity: 0.8, fontWeight: 700 }}>
                {performer?.role}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {(performer?.awards ?? []).slice(0, 2).map((a) => (
              <Chip
                key={a}
                label={a}
                size="small"
                sx={{
                  bgcolor: "rgba(144,202,249,0.16)",
                  color: "#faf9f5",
                  border: "1px solid rgba(144,202,249,0.22)",
                  fontWeight: 800,
                }}
              />
            ))}
          </Stack>

          {/* ✅ Always show ONLY 3 stats */}
          <Stack direction="row" spacing={2} sx={{ pt: 0.5, flexWrap: "wrap", rowGap: 1 }}>
            {statsToShow.slice(0, 3).map(([k, v]) => (
              <Box key={k} sx={{ minWidth: 82 }}>
                <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                  {k}
                </Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{v}</Typography>
              </Box>
            ))}
          </Stack>

          <Typography sx={{ opacity: 0.75 }}>
            Tap to view full profile → stats, gallery, highlights.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
