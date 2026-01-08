// src/pages/History/components/PerformersSection.jsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import PerformerCard from "./PerformerCard";
import PerformerDialog from "./PerformerDialog";

gsap.registerPlugin(ScrollTrigger);

export default function PerformersSection({ performers }) {
  const rootRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".perf-card");
      gsap.fromTo(
        cards,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 80%",
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box ref={rootRef}>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Top Performers
        </Typography>
        <Typography sx={{ opacity: 0.85, maxWidth: 900 }}>
          The people behind the moments — tap a card for full stats, awards, and photos.
        </Typography>
      </Stack>

      <Grid container spacing={2.2}>
        {(performers ?? []).map((p) => (
          <Grid key={p.id} item xs={12} sm={6} md={4}>
            <div className="perf-card">
              <PerformerCard performer={p} onOpen={() => setSelected(p)} />
            </div>
          </Grid>
        ))}
      </Grid>

      <PerformerDialog performer={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}
