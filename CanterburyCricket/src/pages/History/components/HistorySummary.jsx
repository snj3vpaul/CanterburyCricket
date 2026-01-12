import React from "react";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";

function StatPill({ label }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 900,
        bgcolor: "rgba(255,255,255,0.07)",
        color: "rgba(250,249,245,0.92)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    />
  );
}

function DivisionCard({ division, seasons, range, notes, finals, winners, semis, playoffsPct, lastWin }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 2.4 },
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(10,12,24,0.55)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={division}
            size="small"
            sx={{
              fontWeight: 950,
              bgcolor: "rgba(144,202,249,0.14)",
              color: "rgba(144,202,249,0.95)",
              border: "1px solid rgba(144,202,249,0.35)",
            }}
          />
          <Typography sx={{ fontWeight: 950, letterSpacing: "-0.01em" }}>
            {seasons} Seasons
          </Typography>
          <Typography sx={{ opacity: 0.8 }}>{range}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <StatPill label={`${finals} Finals`} />
          <StatPill label={`${winners} Titles`} />
          <StatPill label={`${semis} Semi-Finals`} />
          <StatPill label={`${playoffsPct}% Playoffs`} />
          {lastWin ? <StatPill label={`Last win: ${lastWin}`} /> : null}
        </Stack>

        {notes?.length ? (
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.1, opacity: 0.9 }}>
            {notes.map((n, i) => (
              <Box key={i} component="li" sx={{ mb: 0.5, lineHeight: 1.45 }}>
                {n}
              </Box>
            ))}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function HistorySummary() {
  return (
    <Box
      sx={{
        borderRadius: { xs: 3, md: 4 },
        p: { xs: 2.2, md: 3 },
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "radial-gradient(900px 300px at 10% 20%, rgba(79,82,255,0.14), transparent 60%)," +
          "radial-gradient(900px 300px at 90% 35%, rgba(144,202,249,0.14), transparent 60%)," +
          "rgba(10,12,24,0.40)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.26)",
      }}
    >
      <Stack spacing={2.2}>
        <Stack spacing={0.6}>
          <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
            Club Summary
          </Typography>
          <Typography sx={{ opacity: 0.85, maxWidth: 980 }}>
            A quick snapshot of Canterbury’s playoff consistency and titles across divisions.
          </Typography>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

        <Stack spacing={1.6}>
          {/* CHG */}
          <DivisionCard
            division="CHG Division"
            seasons={19}
            range="2004–2023"
            finals={11}
            winners={6}
            semis={5}
            playoffsPct={84}
            lastWin="2018"
            notes={[
              "Qualified for CHG playoffs in 14 consecutive seasons (2004–2017)",
              "Won CHG division 4 times in a 5-season span (2006–2010)",
              "No season in 2020, half season in 2021",
            ]}
          />

          {/* CTZ */}
          <DivisionCard
            division="CTZ Division"
            seasons={19}
            range="2004–2023"
            finals={5}
            winners={2}
            semis={3}
            playoffsPct={42}
            lastWin="2018"
            notes={["No season in 2020, half season in 2021"]}
          />

          {/* T20 */}
          <DivisionCard
            division="T20 Division"
            seasons={15}
            range="2008–2023"
            finals={2}
            winners={2}
            semis={6}
            playoffsPct={53}
            lastWin="2018"
            notes={["No season in 2020"]}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
