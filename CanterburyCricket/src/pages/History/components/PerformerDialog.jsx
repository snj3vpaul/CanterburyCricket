// src/pages/History/components/PerformerDialog.jsx
import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LightboxGallery from "../../../components/LightboxGallery";

export default function PerformerDialog({ performer, onClose }) {
  const open = Boolean(performer);
  const [lb, setLb] = useState({ open: false, index: 0 });

  const statsEntries = useMemo(() => {
    const s = performer?.stats ?? {};
    return Object.entries(s);
  }, [performer]);

  const images = performer?.gallery ?? [];

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogContent sx={{ bgcolor: "#0b0c10", color: "#faf9f5", p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.2}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.4} alignItems="center">
                <Avatar
                  src={performer?.headshot}
                  sx={{ width: 62, height: 62, border: "2px solid rgba(255,255,255,0.18)" }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 950, fontSize: 22 }}>
                    {performer?.name}
                  </Typography>
                  <Typography sx={{ opacity: 0.85, fontWeight: 800 }}>
                    {performer?.role}
                  </Typography>
                </Box>
              </Stack>

              <IconButton onClick={onClose} sx={{ color: "#faf9f5" }}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {(performer?.awards ?? []).map((a) => (
                <Chip
                  key={a}
                  label={a}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#faf9f5",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: 850,
                  }}
                />
              ))}
            </Stack>

            <Typography sx={{ opacity: 0.85 }}>{performer?.bio}</Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

            <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Stats</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 1.4,
              }}
            >
              {statsEntries.map(([k, v]) => (
                <Box
                  key={k}
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.12)",
                    bgcolor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>
                    {k.toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 950 }}>{String(v)}</Typography>
                </Box>
              ))}
            </Box>

            {images.length > 0 && (
              <>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
                <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Gallery</Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {images.slice(0, 8).map((src, i) => (
                    <Box
                      key={src}
                      onClick={() => setLb({ open: true, index: i })}
                      sx={{
                        width: 96,
                        height: 72,
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
                    />
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      <LightboxGallery
        open={lb.open}
        onClose={() => setLb({ open: false, index: 0 })}
        images={images}
        startIndex={lb.index}
      />
    </>
  );
}
