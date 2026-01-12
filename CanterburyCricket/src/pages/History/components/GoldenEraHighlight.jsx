import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

export default function GoldenEraHighlight() {
  return (
    <Box
      sx={{
        borderRadius: { xs: 3, md: 4 },
        p: { xs: 2.2, md: 3 },
        border: "1px solid rgba(255,211,106,0.22)",
        background:
          "radial-gradient(900px 300px at 15% 20%, rgba(79,82,255,0.22), transparent 60%)," +
          "radial-gradient(900px 300px at 85% 35%, rgba(255,211,106,0.22), transparent 60%)," +
          "linear-gradient(180deg, rgba(10,12,24,0.72), rgba(10,12,24,0.38))",
        boxShadow: "0 18px 55px rgba(0,0,0,0.32)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* subtle vertical accent */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: "linear-gradient(180deg, rgba(255,211,106,0.75), rgba(79,82,255,0.55))",
          opacity: 0.9,
        }}
      />

      <Stack spacing={1.2} sx={{ pl: 1 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="CHG"
            size="small"
            sx={{
              fontWeight: 900,
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#faf9f5",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />
          <Chip
            label="GOLDEN ERA"
            size="small"
            sx={{
              fontWeight: 950,
              bgcolor: "rgba(255,211,106,0.16)",
              color: "#ffd36a",
              border: "1px solid rgba(255,211,106,0.35)",
            }}
          />
          <Chip
            label="2006–2010"
            size="small"
            sx={{
              fontWeight: 900,
              bgcolor: "rgba(255,255,255,0.06)",
              color: "rgba(250,249,245,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </Stack>

        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
          Club’s Golden Era
        </Typography>

        <Typography sx={{ opacity: 0.9, maxWidth: 980 }}>
          Unbeaten streak — <b>35 consecutive</b> CHG-A games
        </Typography>

        <Typography sx={{ mt: 0.6, fontWeight: 900, color: "#ffd36a" }}>
          Mid 2006 → Mid 2008
        </Typography>

        <Box component="ul" sx={{ mt: 0.8, mb: 0, pl: 2.2, opacity: 0.92 }}>
          <li>35 consecutive CHG-A games unbeaten</li>
          <li>Completely unbeaten in the 2007 season</li>
          <li>Includes 1 tied game vs CCCCC</li>
          <li>NECC was the club to break the streak</li>
        </Box>
      </Stack>
    </Box>
  );
}
