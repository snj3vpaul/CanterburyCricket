import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Box,
  Modal,
  Fade,
  Backdrop,
  IconButton,
  Chip,
  Typography,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import TiltedCard from "../../components/TiltedCard/TiltedCard"; // ✅ adjust if your path differs
import "./AwardsCarousel.css";

// =========================
// Images (local)
// =========================

// Club award images
import PlayerOfTheYearImg from "./2025.jpg";
import BestKnockImg from "./BestKnock.jpg";
import BestSpellImg from "./BestSpell.jpg";

// CHG Division
import BatCHGImg from "./batCHG.png";
import BowlCHGImg from "./BowlCHG.jpg";
import FielderCHGImg from "./FielderCHG.jpg";

// CTZ Division
import BatCTZImg from "./BatCTZ.jpg";
import BowlCTZImg from "./BowlerCTZ.jpg";
import FielderCTZImg from "./FielderCTZ.jpg";

// T20 Division
import BatT20Img from "./T20Bat.jpg";
import BowlT20Img from "./T20Bowl.jpg";
import FielderT20Img from "./Fieldt20.jpg";

// =========================
// Config
// =========================

const SEASON = "2025";
const DIVISIONS = ["T20", "CTZ", "CHG"];

const DIVISION_AWARDS = [
  { key: "best_batter", label: "Best Batter", emoji: "🏏" },
  { key: "best_bowler", label: "Best Bowler", emoji: "🔥" },
  { key: "best_fielder", label: "Best Fielder", emoji: "🧤" },
  { key: "mvp", label: "MVP", emoji: "🏆" },
];

const CLUB_AWARDS = [
  { key: "player_of_year", label: "Player of the Year", emoji: "👑" },
  { key: "most_dedicated", label: "Most Dedicated Player", emoji: "🫡" },
  { key: "best_knock", label: "Best Knock of the Year", emoji: "💥" },
  { key: "best_spell", label: "Best Bowling Spell of the Year", emoji: "🎯" },
];

// ✅ Division winners map
const WINNERS = {
  "CHG:mvp": "Sanjeev K Paul",
  "CHG:best_batter": "Ameer Khan",
  "CHG:best_bowler": "Zain Mahmood",
  "CHG:best_fielder": "Jaideep Singh Grover",

  "T20:mvp": "Sanjeev K Paul",
  "T20:best_batter": "Sanjeev K Paul",
  "T20:best_bowler": "Ghous Bilal",
  "T20:best_fielder": "Sanjeev K Paul",

  "CTZ:mvp": "Sanjeev K Paul",
  "CTZ:best_batter": "Sanjeev K Paul",
  "CTZ:best_bowler": "Zaki",
  "CTZ:best_fielder": "Amir Abbas",
};

// ✅ Club winners + details
const CLUB_WINNERS = {
  player_of_year: {
    name: "Sanjeev K Paul",
    stats: [
      { label: "Runs", value: "1083" },
      { label: "Wickets", value: "36" },
    ],
    highlight: "",
  },
  most_dedicated: {
    name: "Syed Bazil Ravi",
    stats: [],
    highlight: " Always there to support the playing XI",
  },
  best_spell: {
    name: "Amir Abbas",
    stats: [{ label: "Spell", value: "5/5" }],
    highlight: "Best Spell of the Year against Cathedral CC",
  },
  best_knock: {
    name: "Varun Harish",
    stats: [{ label: "Knock", value: "92 off 32" }],
    highlight: "Best Knock of the Year vs Belair CC",
  },
};

// ✅ Award images map (id -> import)
const AWARD_IMAGES = {
  // ===== CLUB =====
  [`${SEASON}-CLUB-player_of_year`]: PlayerOfTheYearImg,
  [`${SEASON}-CLUB-best_knock`]: BestKnockImg,
  [`${SEASON}-CLUB-best_spell`]: BestSpellImg,

  // ===== CHG =====
  [`${SEASON}-CHG-best_batter`]: BatCHGImg,
  [`${SEASON}-CHG-best_bowler`]: BowlCHGImg,
  [`${SEASON}-CHG-best_fielder`]: FielderCHGImg,

  // ===== CTZ =====
  [`${SEASON}-CTZ-best_batter`]: BatCTZImg,
  [`${SEASON}-CTZ-best_bowler`]: BowlCTZImg,
  [`${SEASON}-CTZ-best_fielder`]: FielderCTZImg,

  // ===== T20 =====
  [`${SEASON}-T20-best_batter`]: BatT20Img,
  [`${SEASON}-T20-best_bowler`]: BowlT20Img,
  [`${SEASON}-T20-best_fielder`]: FielderT20Img,
};

// =========================
// Hooks / helpers
// =========================

function useIsMobile(breakpoint = 520) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Fallback placeholder (used only when there’s no image)
 */
function imagePlaceholderDataUri({ emoji = "🏆", accent = "#4f52ff" } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <defs>
      <radialGradient id="g" cx="22%" cy="15%" r="90%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="#0b0d1b" stop-opacity="1"/>
      </radialGradient>
      <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="22" />
      </filter>
    </defs>

    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="760" cy="180" r="260" fill="${accent}" opacity="0.20" filter="url(#blur)"/>
    <circle cx="150" cy="780" r="320" fill="${accent}" opacity="0.14" filter="url(#blur)"/>

    <text x="70" y="180"
      font-size="140"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
      fill="#ffffff"
      opacity="0.95"
    >${emoji}</text>

    <rect x="70" y="700" width="760" height="16" rx="8" fill="rgba(255,255,255,0.14)"/>
    <rect x="70" y="740" width="540" height="16" rx="8" fill="rgba(255,255,255,0.10)"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function accentByDivision(div) {
  if (div === "T20") return "#4f52ff";
  if (div === "CTZ") return "#f7b500";
  if (div === "CHG") return "#7c3aed";
  if (div === "CLUB") return "#22c55e";
  return "#4f52ff";
}

function buildAwards(season = SEASON) {
  const divisionAwards = DIVISIONS.flatMap((div) =>
    DIVISION_AWARDS.map((a) => {
      const winnerName = WINNERS[`${div}:${a.key}`] ?? "TBD";
      const id = `${season}-${div}-${a.key}`;

      return {
        id,
        season,
        division: div,
        type: "division",
        title: a.label,
        emoji: a.emoji,
        subtitle: `${div} Division`,
        meta: `${season} • ${div}`,
        winner: {
          name: winnerName,
          role: "",
          photoUrl: "",
          stats: [],
          highlight: "",
        },
        link: "",
        imageUrl: AWARD_IMAGES[id] ?? "",
      };
    })
  );

  const clubAwards = CLUB_AWARDS.map((a) => {
    const id = `${season}-CLUB-${a.key}`;
    const cw = CLUB_WINNERS[a.key];

    return {
      id,
      season,
      division: "CLUB",
      type: "club",
      title: a.label,
      emoji: a.emoji,
      subtitle: "Club Award",
      meta: `${season}`,
      winner: {
        name: cw?.name ?? "TBD",
        role: "",
        photoUrl: "",
        stats: cw?.stats ?? [],
        highlight: cw?.highlight ?? "",
      },
      link: "",
      imageUrl: AWARD_IMAGES[id] ?? "",
    };
  });

  // Club first, then divisions
  return [...clubAwards, ...divisionAwards];
}

// =========================
// Modal
// =========================

function AwardModal({ open, award, onClose, onNext }) {
  if (!award) return null;

  const divChip =
    award.division === "CLUB"
      ? { label: "Club", className: "chipClub" }
      : { label: award.division, className: "chipDiv" };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 220 } }}
    >
      <Fade in={open} timeout={240}>
        <Box className="awardModal">
          <IconButton className="awardModalClose" onClick={onClose} aria-label="Close">
            <CloseRoundedIcon />
          </IconButton>

          <Stack direction="row" spacing={1} alignItems="center" className="awardModalTop">
            <Chip label={award.season} className="chipSeason" />
            <Chip label={divChip.label} className={divChip.className} />
          </Stack>

          <Typography variant="h4" className="awardModalTitle">
            {award.title}
          </Typography>
          <Typography className="awardModalSubtitle">{award.subtitle}</Typography>

          <Divider className="awardDivider" />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="awardModalBody">
            <div className="awardWinnerPhoto" aria-hidden="true">
              {award.imageUrl ? (
                <img src={award.imageUrl} alt={award.title} />
              ) : award.winner.photoUrl ? (
                <img src={award.winner.photoUrl} alt={award.winner.name} />
              ) : (
                <div className="awardPhotoPlaceholder">{award.emoji}</div>
              )}
            </div>

            <div className="awardWinnerInfo">
              <Typography className="awardWinnerName">{award.winner.name || "TBD"}</Typography>

              {!!award.winner.role && (
                <Typography className="awardWinnerRole">{award.winner.role}</Typography>
              )}

              {Array.isArray(award.winner.stats) && award.winner.stats.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" className="awardStatChips">
                  {award.winner.stats.map((s, i) => (
                    <Chip key={i} label={`${s.label}: ${s.value}`} className="chipStat" />
                  ))}
                </Stack>
              )}

              {!!award.winner.highlight && (
                <Typography className="awardHighlight">“{award.winner.highlight}”</Typography>
              )}

              <Stack direction="row" spacing={1} className="awardModalActions">
                <Button variant="contained" onClick={onNext}>
                  Next Award
                </Button>
                {award.link ? (
                  <Button
                    variant="outlined"
                    onClick={() => window.open(award.link, "_blank", "noopener,noreferrer")}
                  >
                    View Link
                  </Button>
                ) : null}
              </Stack>
            </div>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
}

// =========================
// Component
// =========================

export default function AwardsCarousel() {
  const isMobile = useIsMobile(520);

  const awards = useMemo(() => buildAwards(SEASON), []);
  const heroCards = useMemo(
    () => (isMobile ? awards.slice(0, 4) : awards.slice(0, 6)),
    [awards, isMobile]
  );

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAward = useCallback((idx) => {
    setActiveIndex(idx);
    setOpen(true);
  }, []);

  const closeAward = useCallback(() => setOpen(false), []);

  const nextAward = useCallback(() => {
    setActiveIndex((i) => (i + 1) % awards.length);
  }, [awards.length]);

  const activeAward = awards[activeIndex];

  return (
    <section className="awardsSwapWrap">
      <div className="awardsSwapInner">
        <div className="awardsSwapHeader">
          <h2 className="awardsSwapTitle">Awards Night</h2>
          <p className="awardsSwapSub">
            Tap a card to reveal the winner — swipe-worthy highlights for the season.
          </p>
        </div>

        {/* ✅ HERO: blurred preview images + tap to reveal */}
        <div className="awardsTiltStage" aria-label="Awards hero cards">
          <div className="awardsTiltRow">
            {heroCards.map((item) => {
              const idx = awards.findIndex((x) => x.id === item.id);

              // ✅ Use real image if present; otherwise fallback placeholder
              const imageSrc =
                item.imageUrl ||
                imagePlaceholderDataUri({
                  emoji: item.emoji,
                  accent: accentByDivision(item.division),
                });

              return (
                <button
                  key={item.id}
                  type="button"
                  className="awardsTiltBtn"
                  onClick={() => openAward(idx)}
                  aria-label={`${item.title} — ${item.subtitle}`}
                >
                 

                  {/* Blur wrapper: add CSS .awardsBlurPreview to actually blur */}
                  <div className="awardsBlurPreview">
                    <TiltedCard
                      imageSrc={imageSrc}
                      altText={`${item.title} (${item.subtitle})`}
                      captionText=""
                      containerHeight={isMobile ? "300px" : "320px"}
                      containerWidth={isMobile ? "280px" : "320px"}
                      imageHeight={isMobile ? "300px" : "320px"}
                      imageWidth={isMobile ? "280px" : "320px"}
                      rotateAmplitude={isMobile ? 8 : 12}
                      scaleOnHover={isMobile ? 1.03 : 1.08}
                      showMobileWarning={false}
                      showTooltip={false}
                      displayOverlayContent={false}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Mini cards */}
        <div className="awardsSections">
          <div className="awardsSection">
            <h3 className="awardsSectionTitle">Club Awards</h3>
            <div className="awardsGrid">
              {awards
                .filter((a) => a.division === "CLUB")
                .map((a) => (
                  <button
                    key={a.id}
                    className="awardMiniCard"
                    onClick={() => openAward(awards.findIndex((x) => x.id === a.id))}
                  >
                    <span className="miniEmoji">{a.emoji}</span>
                    <span className="miniTitle">{a.title}</span>
                    <span className="miniMeta">{a.meta}</span>
                    <span className="miniWinner">{a.winner?.name ?? "TBD"}</span>
                  </button>
                ))}
            </div>
          </div>

          {DIVISIONS.map((div) => (
            <div className="awardsSection" key={div}>
              <h3 className="awardsSectionTitle">{div} Division Awards</h3>
              <div className="awardsGrid">
                {awards
                  .filter((a) => a.division === div)
                  .map((a) => (
                    <button
                      key={a.id}
                      className="awardMiniCard"
                      onClick={() => openAward(awards.findIndex((x) => x.id === a.id))}
                    >
                      <span className="miniEmoji">{a.emoji}</span>
                      <span className="miniTitle">{a.title}</span>
                      <span className="miniMeta">{a.meta}</span>
                      <span className="miniWinner">{a.winner?.name ?? "TBD"}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AwardModal open={open} award={activeAward} onClose={closeAward} onNext={nextAward} />
    </section>
  );
}
