import React, { useMemo, useState } from "react";
import stats from "../../assets/T20_division_stats.json";

// MUI
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ShieldIcon from "@mui/icons-material/Shield";

function fmt(n) {
  if (n === null || n === undefined || n === "-" || Number.isNaN(n)) return "-";
  return typeof n === "number" ? n.toLocaleString() : String(n);
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function leaderBy(players, valueFn) {
  if (!players.length) return { name: "-", value: 0 };
  let best = players[0];
  let bestVal = valueFn(players[0]);

  for (const p of players) {
    const v = valueFn(p);
    if (v > bestVal) {
      best = p;
      bestVal = v;
    }
  }
  return { name: best.name ?? "-", value: bestVal };
}

export default function SeasonTable() {
  const [activeTab, setActiveTab] = useState("batting"); // batting | bowling | fielding

  // Map flat JSON to a consistent shape (adjust field names here if needed)
  const players = useMemo(
    () =>
      (stats || []).map((player, idx) => ({
        id: player.id ?? idx,
        name: player.name ?? "Unknown",

        batting: {
          runs: safeNum(player.total_runs_bat),
          highest: safeNum(player.highest_run_bat),
          average: safeNum(player.average_bat),
          strikeRate: safeNum(player.strike_rate_bat),
        },

        bowling: {
          wickets: safeNum(player.total_wickets),
          best: player.highest_wicket ?? "-",
          economy: player.economy ?? "-",
          average: player.avg ?? "-",
        },

        fielding: {
          catches: safeNum(player.total_catches),
          stumpings: safeNum(player.stumpings),
          runOuts: safeNum(player.run_outs),
        },
      })),
    []
  );

  const summary = useMemo(() => {
    const totalRuns = players.reduce((a, p) => a + p.batting.runs, 0);
    const totalWickets = players.reduce((a, p) => a + p.bowling.wickets, 0);
    const totalCatches = players.reduce((a, p) => a + p.fielding.catches, 0);

    const topRuns = leaderBy(players, (p) => p.batting.runs);
    const topWickets = leaderBy(players, (p) => p.bowling.wickets);
    const topCatches = leaderBy(players, (p) => p.fielding.catches);

    return { totalRuns, totalWickets, totalCatches, topRuns, topWickets, topCatches };
  }, [players]);

  const { columns, rows } = useMemo(() => {
    if (activeTab === "batting") {
      return {
        columns: [
          { field: "name", headerName: "Player", flex: 1, minWidth: 180 },
          { field: "runs", headerName: "Runs", type: "number", width: 110 },
          { field: "highest", headerName: "Highest", type: "number", width: 110 },
          { field: "average", headerName: "Avg", type: "number", width: 110 },
          { field: "strikeRate", headerName: "SR", type: "number", width: 110 },
        ],
        rows: players.map((p) => ({
          id: p.id,
          name: p.name,
          runs: p.batting.runs,
          highest: p.batting.highest,
          average: p.batting.average,
          strikeRate: p.batting.strikeRate,
        })),
      };
    }

    if (activeTab === "bowling") {
      return {
        columns: [
          { field: "name", headerName: "Player", flex: 1, minWidth: 180 },
          { field: "wickets", headerName: "Wkts", type: "number", width: 110 },
          { field: "best", headerName: "Best", width: 120 },
          { field: "economy", headerName: "Econ", width: 120 },
          { field: "average", headerName: "Avg", width: 120 },
        ],
        rows: players.map((p) => ({
          id: p.id,
          name: p.name,
          wickets: p.bowling.wickets,
          best: p.bowling.best,
          economy: p.bowling.economy,
          average: p.bowling.average,
        })),
      };
    }

    // fielding
    return {
      columns: [
        { field: "name", headerName: "Player", flex: 1, minWidth: 180 },
        { field: "catches", headerName: "Catches", type: "number", width: 120 },
        { field: "stumpings", headerName: "Stumpings", type: "number", width: 130 },
        { field: "runOuts", headerName: "Run Outs", type: "number", width: 120 },
      ],
      rows: players.map((p) => ({
        id: p.id,
        name: p.name,
        catches: p.fielding.catches,
        stumpings: p.fielding.stumpings,
        runOuts: p.fielding.runOuts,
      })),
    };
  }, [activeTab, players]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Season Dashboard
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Quick highlights + full stats table
          </Typography>
        </Box>

        {/* Summary cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <SportsCricketIcon />
                  <Typography fontWeight={700}>Batting</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={900}>
                  {fmt(summary.totalRuns)} runs
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                  <Chip
                    icon={<WorkspacePremiumIcon />}
                    label={`Top: ${summary.topRuns.name} (${fmt(summary.topRuns.value)})`}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <ShieldIcon />
                  <Typography fontWeight={700}>Bowling</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={900}>
                  {fmt(summary.totalWickets)} wickets
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                  <Chip
                    icon={<WorkspacePremiumIcon />}
                    label={`Top: ${summary.topWickets.name} (${fmt(summary.topWickets.value)})`}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography fontWeight={700}>Fielding</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={900}>
                  {fmt(summary.totalCatches)} catches
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                  <Chip
                    icon={<WorkspacePremiumIcon />}
                    label={`Top: ${summary.topCatches.name} (${fmt(summary.topCatches.value)})`}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <CardContent>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="batting" label="Batting" />
              <Tab value="bowling" label="Bowling" />
              <Tab value="fielding" label="Fielding" />
            </Tabs>

            <Box sx={{ height: 520, mt: 2 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: { sortModel: [{ field: columns?.[1]?.field ?? "name", sort: "desc" }] },
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
