// src/pages/History/components/ChampionshipTimeline.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import LightboxGallery from "../../../components/LightboxGallery";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ChampionshipCard from "./ChampionshipCard";

gsap.registerPlugin(ScrollTrigger);

function MilestoneCard({ item }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2.2, md: 2.6 },
        border: "1px solid rgba(255,211,106,0.22)",
        background:
          "linear-gradient(180deg, rgba(255,211,106,0.10), rgba(10,12,24,0.30))",
        boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 1.2 }}>
        <Chip
          label={item.division ?? "Club"}
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
        {item.year ? (
          <Chip
            label={String(item.year)}
            size="small"
            sx={{
              fontWeight: 900,
              bgcolor: "rgba(255,255,255,0.06)",
              color: "rgba(250,249,245,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ) : null}
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
        {item.title}
      </Typography>

      {item.subtitle ? (
        <Typography sx={{ opacity: 0.85, mt: 0.6 }}>
          {item.subtitle}
        </Typography>
      ) : null}

      {item.result ? (
        <Typography sx={{ mt: 1.2, fontWeight: 900, color: "#ffd36a" }}>
          {item.result}
        </Typography>
      ) : null}

      {Array.isArray(item.highlights) && item.highlights.length > 0 ? (
        <Box component="ul" sx={{ mt: 1.3, mb: 0, pl: 2.1, opacity: 0.92 }}>
          {item.highlights.map((h, i) => (
            <Box key={i} component="li" sx={{ mb: 0.6, lineHeight: 1.45 }}>
              {h}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

export default function ChampionshipTimeline({ items }) {
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const sortedItems = useMemo(() => {
    const arr = [...(items ?? [])];

    // ✅ Sort by year descending; milestones will land where you anchor them
    // Tie-breaker: milestones first within the same year (so the era card appears before finals)
    return arr.sort((a, b) => {
      const ay = Number(a.year ?? 0);
      const by = Number(b.year ?? 0);
      if (by !== ay) return by - ay;

      const am = a.type === "milestone" ? 0 : 1;
      const bm = b.type === "milestone" ? 0 : 1;
      return am - bm;
    });
  }, [items]);

  const isEmpty = useMemo(() => !sortedItems || sortedItems.length === 0, [sortedItems]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".champ-card");

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            },
          }
        );
      });

      gsap.fromTo(
        fillRef.current,
        { scaleY: 0, transformOrigin: "top" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 20%",
            end: "bottom 70%",
            scrub: true,
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [sortedItems]);

  if (isEmpty) {
    return (
      <Box
        sx={{
          opacity: 0.8,
          border: "1px solid rgba(255,255,255,0.12)",
          p: 3,
          borderRadius: 3,
        }}
      >
        No championships found for this filter.
      </Box>
    );
  }

  return (
    <Box ref={rootRef} sx={{ position: "relative" }}>
      {/* “Progress line” overlay */}
      <Box
        sx={{
          position: "absolute",
          left: { xs: 28, md: 32 },
          top: 10,
          bottom: 10,
          width: 3,
          bgcolor: "rgba(255,255,255,0.10)",
          borderRadius: 99,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Box
          ref={fillRef}
          sx={{
            height: "100%",
            width: "100%",
            bgcolor: "rgba(144,202,249,0.95)",
            transform: "scaleY(0)",
          }}
        />
      </Box>

      <Timeline
        position="alternate"
        sx={{
          p: 0,
          "& .MuiTimelineItem-root:before": { flex: 0, padding: 0 },
        }}
      >
        {sortedItems.map((c, idx) => {
          const isMilestone = c.type === "milestone";

          return (
            <TimelineItem key={c.id}>
              <TimelineSeparator>
                <TimelineDot
                  variant="outlined"
                  sx={{
                    borderColor: isMilestone
                      ? "rgba(255,211,106,0.55)"
                      : "rgba(255,255,255,0.25)",
                    bgcolor: isMilestone
                      ? "rgba(255,211,106,0.10)"
                      : "rgba(255,255,255,0.06)",
                  }}
                />
                <TimelineConnector
                  sx={{
                    bgcolor: isMilestone
                      ? "rgba(255,211,106,0.16)"
                      : "rgba(255,255,255,0.12)",
                  }}
                />
              </TimelineSeparator>

              <TimelineContent sx={{ py: 2.5 }}>
                <div className="champ-card">
                  {isMilestone ? (
                    <MilestoneCard item={c} />
                  ) : (
                    <ChampionshipCard
                      item={c}
                      index={idx}
                      onOpenGallery={(images, startIndex) =>
                        setLightbox({ open: true, images, index: startIndex })
                      }
                    />
                  )}
                </div>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>

      <LightboxGallery
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, images: [], index: 0 })}
        images={lightbox.images}
        startIndex={lightbox.index}
      />
    </Box>
  );
}
