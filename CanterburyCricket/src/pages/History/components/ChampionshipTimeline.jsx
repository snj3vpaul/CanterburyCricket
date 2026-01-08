// src/pages/History/components/ChampionshipTimeline.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
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

export default function ChampionshipTimeline({ items }) {
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const isEmpty = useMemo(() => !items || items.length === 0, [items]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".champ-card");
      // Cards reveal
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

      // Timeline progress fill
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
  }, [items]);

  if (isEmpty) {
    return (
      <Box sx={{ opacity: 0.8, border: "1px solid rgba(255,255,255,0.12)", p: 3, borderRadius: 3 }}>
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
            bgcolor: "rgba(144,202,249,0.95)", // uses MUI primary-ish vibe
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
        {items.map((c, idx) => (
          <TimelineItem key={c.id}>
            <TimelineSeparator>
              <TimelineDot
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.25)",
                  bgcolor: "rgba(255,255,255,0.06)",
                }}
              />
              <TimelineConnector sx={{ bgcolor: "rgba(255,255,255,0.12)" }} />
            </TimelineSeparator>

            <TimelineContent sx={{ py: 2.5 }}>
              <div className="champ-card">
                <ChampionshipCard
                  item={c}
                  index={idx}
                  onOpenGallery={(images, startIndex) =>
                    setLightbox({ open: true, images, index: startIndex })
                  }
                />
              </div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
<LightboxGallery
  open={lightbox.open}
  onClose={() => setLightbox({ open: false, images: [], index: 0 })}
  images={lightbox.images}
  startIndex={lightbox.index}
/>

      {/* Local lightbox (keeps Timeline file independent) */}
      {lightbox.open && (
        <React.Suspense fallback={null}>
          {/* Lazy import optional; keeping simple: direct import is fine too */}
        </React.Suspense>
      )}
    </Box>
  );
}
