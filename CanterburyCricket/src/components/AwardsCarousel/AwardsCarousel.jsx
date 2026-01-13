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

const DIVISIONS = ["T20", "CTZ", "CHG"];

const DIVISION_AWARDS = [
  { key: "best_batter", label: "Best Batter", emoji: "🏏" },
  { key: "best_bowler", label: "Best Bowler", emoji: "🔥" },
  { key: "best_fielder", label: "Best Fielder", emoji: "🧤" },
  { key: "mvp", label: "MVP", emoji: "🏆" },
];

const CLUB_AWARDS = [
  { key: "player_of_year", label: "Player of the Year", emoji: "👑" },
  { key: "emerging", label: "Emerging Player of the Year", emoji: "🌟" },
  { key: "most_improved", label: "Most Improved Player of the Year", emoji: "📈" },
  { key: "best_knock", label: "Best Knock of the Year", emoji: "💥" },
  { key: "best_spell", label: "Best Bowling Spell of the Year", emoji: "🎯" },
];

// ✅ Winners map (yours)
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

// ✅ OPTIONAL: a map where you’ll later plug real images
// Put images in /src/assets/awards/... and import them here, then set the values.
// For now, they can stay empty strings.
const AWARD_IMAGES = {
  // examples:
  // "2025-CLUB-player_of_year": PlayerOfYearImg,
  // "2025-T20-mvp": T20MvpImg,
};

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
 * ✅ Image-only placeholder SVG (NO title/winner text)
 * You’ll still get a nice “award poster” look until you add real images.
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
  return "#4f52ff";
}

function buildAwards(season = "2025") {
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
        winner: { name: winnerName, role: "", photoUrl: "", stats: [], highlight: "" },
        link: "",

        // ✅ Hero card image slot (for future)
        imageUrl: AWARD_IMAGES[id] ?? "",
      };
    })
  );

  const clubAwards = CLUB_AWARDS.map((a) => {
    const id = `${season}-CLUB-${a.key}`;
    return {
      id,
      season,
      division: "CLUB",
      type: "club",
      title: a.label,
      emoji: a.emoji,
      subtitle: "Club Award",
      meta: `${season}`,
      winner: { name: "TBD", role: "", photoUrl: "", stats: [], highlight: "" },
      link: "",

      // ✅ Hero card image slot (for future)
      imageUrl: AWARD_IMAGES[id] ?? "",
    };
  });

  return [...clubAwards, ...divisionAwards];
}

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
              {award.winner.photoUrl ? (
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

export default function AwardsCarousel() {
  const isMobile = useIsMobile(520);

  const awards = useMemo(() => buildAwards("2025"), []);
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

      {/* ✅ HERO: Tilted Cards = IMAGE PLACEHOLDERS (no mini-card text) */}
      <div className="awardsTiltStage" aria-label="Awards hero cards">
        <div className="awardsTiltRow">
          {heroCards.map((item) => {
            const idx = awards.findIndex((x) => x.id === item.id);

            const imageSrc =
              item.imageUrl ||
              imagePlaceholderDataUri({
                emoji: item.emoji,
                accent: accentByDivision(item.division === "CLUB" ? "CLUB" : item.division),
              });

            return (
              <button
                key={item.id}
                type="button"
                className="awardsTiltBtn"
                onClick={() => openAward(idx)}
                aria-label={`${item.title} — ${item.subtitle}`}
              >
                <TiltedCard
                  imageSrc={imageSrc}
                  altText={`${item.title} (${item.subtitle})`}
                  captionText=""                 // ✅ no text tooltip
                  containerHeight={isMobile ? "300px" : "320px"}
                  containerWidth={isMobile ? "280px" : "320px"}
                  imageHeight={isMobile ? "300px" : "320px"}
                  imageWidth={isMobile ? "280px" : "320px"}
                  rotateAmplitude={isMobile ? 8 : 12}
                  scaleOnHover={isMobile ? 1.03 : 1.08}
                  showMobileWarning={false}
                  showTooltip={false}            // ✅ no tooltip text
                  displayOverlayContent={false}  // ✅ no overlay text
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ Mini cards stay EXACTLY the same */}
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
