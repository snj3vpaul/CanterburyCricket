// src/pages/History/HistoryPage.jsx
import React, { useMemo, useState } from "react";
import { Box, Chip, Container, Divider, Stack, Typography } from "@mui/material";

import HeroHistory from "./components/HeroHistory";
import ChampionshipTimeline from "./components/ChampionshipTimeline";
import LeagueLegendsSection from "./components/LeagueLegendsSection";
import PerformersSection from "./components/PerformersSection";

import { championships, leagueLegends, performers } from "./historyData";

const DIVS = ["All", "T20", "CTZ", "CHG"];
const PLACEMENTS = ["All", "Champion", "Runner-Up"];

export default function HistoryPage() {
  const [division, setDivision] = useState("All");
  const [placement, setPlacement] = useState("All");

  const filteredChamps = useMemo(() => {
    return (championships ?? []).filter((c) => {
      if (division !== "All" && c.division !== division) return false;

      if (placement !== "All") {
        const want = placement === "Champion" ? "champion" : "runner-up";
        if ((c.placement ?? "champion") !== want) return false;
      }

      return true;
    });
  }, [division, placement]);

  const totalTitles = useMemo(
    () => (championships ?? []).filter((c) => c.placement === "champion").length,
    []
  );

  return (
    <Box sx={{ bgcolor: "#0b0c10", color: "#faf9f5", minHeight: "100vh" }}>
      <HeroHistory
        totalTitles={totalTitles}
        subtitle="Trophies, finals, and the legends who made it happen."
      />

      <Container sx={{ py: { xs: 6, md: 10 } }}>
        {/* TIMELINE HEADER + FILTERS */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Seasons & Finals Journey
          </Typography>

          <Typography sx={{ opacity: 0.85, maxWidth: 950 }}>
            Scroll through our timeline — titles, runner-ups, and the moments that built the club.
          </Typography>

          <Stack spacing={1.2}>
            {/* Division filter */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {DIVS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  clickable
                  onClick={() => setDivision(d)}
                  color={division === d ? "primary" : "default"}
                  sx={{
                    fontWeight: 850,
                    bgcolor:
                      division === d ? "primary.main" : "rgba(255,255,255,0.08)",
                    color: "#faf9f5",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                />
              ))}
            </Stack>

            {/* Placement filter */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {PLACEMENTS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  clickable
                  onClick={() => setPlacement(p)}
                  color={placement === p ? "primary" : "default"}
                  sx={{
                    fontWeight: 850,
                    bgcolor:
                      placement === p ? "primary.main" : "rgba(255,255,255,0.08)",
                    color: "#faf9f5",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        {/* TIMELINE */}
        <ChampionshipTimeline items={filteredChamps} />

        <Divider
          sx={{
            my: { xs: 7, md: 10 },
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* LEGENDS */}
        <LeagueLegendsSection legends={leagueLegends} />

        <Divider
          sx={{
            my: { xs: 7, md: 10 },
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* TOP PERFORMERS */}
        <PerformersSection performers={performers} />
      </Container>
    </Box>
  );
}
