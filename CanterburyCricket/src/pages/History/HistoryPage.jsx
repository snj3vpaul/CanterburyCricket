// src/pages/History/HistoryPage.jsx
import React, { useMemo, useState,useEffect } from "react";
import { Box, Chip, Container, Divider, Stack, Typography } from "@mui/material";

import HeroHistory from "./components/HeroHistory";
import GoldenEraHighlight from "./components/GoldenEraHighlight";
import ChampionshipTimeline from "./components/ChampionshipTimeline";
import LeagueLegendsSection from "./components/LeagueLegendsSection";
import PerformersSection from "./components/PerformersSection";
import HistorySummary from "./components/HistorySummary";

import { championships, leagueLegends, performers } from "./historyData";

const DIVS = ["All", "T20", "CTZ", "CHG"]; // add "OCA" here later if you want that filter too
const PLACEMENTS = ["All", "Champion", "Runner-Up"];

export default function HistoryPage() {
  const [division, setDivision] = useState("All");
  const [placement, setPlacement] = useState("All");
useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  // ✅ Timeline data = championships only (Golden Era is featured at top)
  const allChampionships = useMemo(() => [...(championships ?? [])], []);

  // Filter timeline list
  const filteredChamps = useMemo(() => {
    return (allChampionships ?? []).filter((c) => {
      if (division !== "All" && c.division !== division) return false;

      if (placement !== "All") {
        const want = placement === "Champion" ? "champion" : "runner-up";
        if ((c.placement ?? "champion") !== want) return false;
      }

      return true;
    });
  }, [allChampionships, division, placement]);

  // Counts for HeroHistory
  const totalTitles = useMemo(
    () => (allChampionships ?? []).filter((c) => c.placement === "champion").length,
    [allChampionships]
  );

  const totalRunnerUps = useMemo(
    () => (allChampionships ?? []).filter((c) => c.placement === "runner-up").length,
    [allChampionships]
  );

  return (
    <Box sx={{ color: "#faf9f5", minHeight: "100vh" }}>
      <HeroHistory
        totalTitles={totalTitles}
        totalRunnerUps={totalRunnerUps}
        subtitle="Trophies, finals, and the legends who made it happen."
      />

      <Container sx={{ py: { xs: 6, md: 10 } }}>
        {/* ✅ FEATURED: GOLDEN ERA */}
        <Box id="golden-era" sx={{ scrollMarginTop: "96px", mb: { xs: 6, md: 7 } }}>
          <GoldenEraHighlight />
        </Box>
        <Box id="summary" sx={{ scrollMarginTop: "96px", mb: { xs: 6, md: 7 } }}>
  <HistorySummary />
</Box>

        {/* ✅ ANCHOR TARGET: Championship History */}
        <Box id="championships" sx={{ scrollMarginTop: "96px" }}>
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
        </Box>

        <Divider
          sx={{
            my: { xs: 7, md: 10 },
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* ✅ ANCHOR TARGET: League Legends */}
        <Box id="legends" sx={{ scrollMarginTop: "96px" }}>
          <LeagueLegendsSection legends={leagueLegends} />
        </Box>

        <Divider
          sx={{
            my: { xs: 7, md: 10 },
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* TOP PERFORMERS */}
        <Box id="performers" sx={{ scrollMarginTop: "96px" }}>
          <PerformersSection performers={performers} />
        </Box>
      </Container>
    </Box>
  );
}
