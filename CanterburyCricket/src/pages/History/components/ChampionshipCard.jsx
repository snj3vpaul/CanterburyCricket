// src/pages/History/components/ChampionshipCard.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";

export default function ChampionshipCard({ item, onOpenGallery }) {
  const isChampion = item?.placement === "champion";
  const label = isChampion ? "CHAMPIONS" : "RUNNER-UP";

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
    >
      {/* Top accent strip */}
      <Box
        sx={{
          height: 4,
          width: "100%",
          bgcolor: isChampion ? "rgba(255,215,0,0.95)" : "rgba(180,180,180,0.9)",
        }}
      />

      <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
        <Stack spacing={1.4}>
          {/* Placement + Year/Division */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            <Chip
              label={label}
              sx={{
                fontWeight: 950,
                letterSpacing: 0.6,
                bgcolor: isChampion
                  ? "rgba(255,215,0,0.16)"
                  : "rgba(200,200,200,0.14)",
                color: "#faf9f5",
                border: isChampion
                  ? "1px solid rgba(255,215,0,0.32)"
                  : "1px solid rgba(200,200,200,0.25)",
              }}
            />

            <Chip
              icon={<EmojiEventsIcon />}
              label={`${item.year} • ${item.division}`}
              sx={{
                fontWeight: 900,
                bgcolor: "rgba(144,202,249,0.18)",
                color: "#faf9f5",
                border: "1px solid rgba(144,202,249,0.25)",
              }}
            />
          </Stack>

          {/* Title */}
          <Typography sx={{ fontWeight: 950, fontSize: 20, lineHeight: 1.15 }}>
            {item.title}
          </Typography>

          {!!item.subtitle && (
            <Typography sx={{ opacity: 0.85 }}>{item.subtitle}</Typography>
          )}

          {!!item.description && (
            <Typography sx={{ opacity: 0.75, maxWidth: 820 }}>
              {item.description}
            </Typography>
          )}

          {/* Highlights */}
          {!!item.highlights?.length && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, pt: 0.5 }}>
              {item.highlights.slice(0, 4).map((h) => (
                <Chip
                  key={h}
                  label={h}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#faf9f5",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: 800,
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Key performers */}
          {!!item.keyPerformers?.length && (
            <>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                <Typography sx={{ opacity: 0.8, fontWeight: 900, fontSize: 13 }}>
                  Key performers:
                </Typography>
                {item.keyPerformers.slice(0, 5).map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "#faf9f5",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontWeight: 850,
                    }}
                  />
                ))}
              </Stack>
            </>
          )}

          {/* Thumbnails */}
          {!!item.photos?.length && (
            <Stack direction="row" spacing={1} sx={{ pt: 1, flexWrap: "wrap", gap: 1 }}>
              {item.photos.slice(0, 6).map((src, i) => (
                <Box
                  key={`${item.id}-thumb-${i}`}
                  onClick={() => onOpenGallery(item.photos, i)}
                  sx={{
                    width: 66,
                    height: 46,
                    borderRadius: 2,
                    cursor: "pointer",
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid rgba(255,255,255,0.14)",
                    opacity: 0.92,
                    "&:hover": { opacity: 1 },
                  }}
                  title="Open gallery"
                  role="button"
                />
              ))}
            </Stack>
          )}

          {/* CTA buttons */}
          <Stack direction="row" spacing={1.2} sx={{ pt: 1, flexWrap: "wrap" }}>
            {item.photos?.length ? (
              <Button
                variant="contained"
                onClick={() => onOpenGallery(item.photos, 0)}
                startIcon={<PhotoLibraryIcon />}
                sx={{ fontWeight: 950 }}
              >
                View Gallery
              </Button>
            ) : null}

            {item.scoreboardUrl ? (
              <Button
                variant="outlined"
                component="a"
                href={item.scoreboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                sx={{
                  fontWeight: 950,
                  color: "#faf9f5",
                  borderColor: "rgba(255,255,255,0.25)",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(144,202,249,0.12)",
                  },
                }}
              >
                {isChampion ? "Final Scorecard" : "Match Scorecard"}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
