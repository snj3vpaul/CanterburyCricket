// src/pages/History/components/HeroHistory.jsx
import React, { useLayoutEffect, useRef } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroHistory({ totalTitles = 0, totalRunnerUps=0, subtitle }) {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);
  

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro
      gsap.fromTo(
        titleRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
      );
      gsap.fromTo(
        statsRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, delay: 0.1, ease: "power3.out" }
      );

      // Parallax background
      gsap.to(bgRef.current, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box ref={rootRef} sx={{ position: "relative", overflow: "hidden" }}>
      {/* Background image layer */}
      <Box
        ref={bgRef}
        sx={{
          position: "center",
          inset: 0,
          backgroundImage:
            "linear-gradient(180deg",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "translate3d(0,0,0)",
        }}
      />

      <Container sx={{ position: "relative", py: { xs: 8, md: 12 } }}>
        <Stack spacing={2} sx={{ maxWidth: 980 }}>
          <Typography
            ref={titleRef}
            variant="h2"
            sx={{
              fontWeight: 950,
              letterSpacing: -1,
              lineHeight: 1.05,
              textShadow: "0 10px 30px rgba(0,0,0,0.45)",
            }}
          >
            Our History
          </Typography>

          <Typography sx={{ opacity: 0.9, fontSize: { xs: 16, md: 18 }, maxWidth: 820 }}>
            {subtitle}
          </Typography>

          <Stack
  ref={statsRef}
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{ pt: 2 }}
>
  <StatPill label="Championships" value={totalTitles} />
  <StatPill label="Runner-Ups" value={totalRunnerUps} />   {/* ✅ NEW */}
  <StatPill label="Moments" value="Countless" />
  <StatPill label="Vibe" value="Elite 😄" />
</Stack>

        </Stack>
      </Container>
    </Box>
  );
}

function StatPill({ label, value }) {
  return (
    <Box
      sx={{
        px: 2.2,
        py: 1.2,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        bgcolor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        width: { xs: "fit-content", sm: "auto" },
      }}
    >
      <Typography sx={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 950 }}>{value}</Typography>
    </Box>
  );
}
