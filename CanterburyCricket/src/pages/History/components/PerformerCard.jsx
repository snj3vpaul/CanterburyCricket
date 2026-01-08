// src/pages/History/components/PerformerCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export default function PerformerCard({ performer, onOpen }) {
  const s = performer.stats || {};

  // Handle both batter/bowler style stats gracefully
  const statA = s.runs != null ? ["Runs", s.runs] : ["Wkts", s.wickets ?? "-"];
  const statB = s.average != null ? ["Average", s.average] : ["Econ", s.economy ?? "-"];
  const statC = s.wickets != null ? ["Wickets", s.wickets] : ["Best", s.bestBowling ?? "-"];

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
              src={performer.headshot}
              sx={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.18)" }}
            />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{performer.name}</Typography>
              <Typography sx={{ opacity: 0.8, fontWeight: 700 }}>{performer.role}</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {(performer.awards ?? []).slice(0, 2).map((a) => (
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

          <Stack direction="row" spacing={2} sx={{ pt: 0.5 }}>
            {[statA, statB, statC].map(([k, v]) => (
              <Box key={k} sx={{ minWidth: 82 }}>
                <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>{k}</Typography>
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
