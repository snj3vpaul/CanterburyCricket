import React, { forwardRef, useMemo, useState, useCallback } from "react";
import CardSwap, { Card } from "../CardSwap/CardSwap"; // adjust path
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

// ✅ Build the awards list
function buildAwards(season = "2025") {
  const divisionAwards = DIVISIONS.flatMap((div) =>
    DIVISION_AWARDS.map((a) => ({
      id: `${season}-${div}-${a.key}`,
      season,
      division: div,
      type: "division",
      title: a.label,
      emoji: a.emoji,
      subtitle: `${div} Division`,
      meta: `${season} • ${div}`,
      // winner details (fill later)
      winner: {
        name: "TBD",
        role: "",
        photoUrl: "",
        stats: [], // e.g. [{ label:"Runs", value:"412" }, ...]
        highlight: "",
      },
      link: "", // optional: scorecard/album
    }))
  );

  const clubAwards = CLUB_AWARDS.map((a) => ({
    id: `${season}-CLUB-${a.key}`,
    season,
    division: "CLUB",
    type: "club",
    title: a.label,
    emoji: a.emoji,
    subtitle: "Club Award",
    meta: `${season}`,
    winner: {
      name: "TBD",
      role: "",
      photoUrl: "",
      stats: [],
      highlight: "",
    },
    link: "",
  }));

  return [...clubAwards, ...divisionAwards];
}

const AwardCard = forwardRef(function AwardCard({ item, style, onClick }, ref) {
  const divLabel = item.division === "CLUB" ? "Club" : item.division;

  return (
    <Card
      ref={ref}
      style={style}
      onClick={onClick}
      className="awardCard"
      role="button"
      tabIndex={0}
      aria-label={`${item.title} — ${divLabel}`}
    >
      <div className="awardGlow" aria-hidden="true" />

      <div className="awardTop">
        <div className="awardEmoji" aria-hidden="true">{item.emoji}</div>
        <div className="awardMeta">{item.meta}</div>
      </div>

      <div className="awardTitle">{item.title}</div>
      <div className="awardSubtitle">{item.subtitle}</div>

      <div className="awardFooter">
        <span className="awardTag">Awards Night</span>
        <span className="awardHint">Details</span>
      </div>
    </Card>
  );
});

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
      slotProps={{
        backdrop: { timeout: 220 },
      }}
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
              <Typography className="awardWinnerName">
                {award.winner.name || "TBD"}
              </Typography>
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
  const awards = useMemo(() => buildAwards("2025"), []);
  const heroCards = useMemo(() => awards.slice(0, 6), [awards]); // top 6 in CardSwap stack

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
      <div className="awardsSwapHeader">
        <h2 className="awardsSwapTitle">Awards Night</h2>
        <p className="awardsSwapSub">
          Tap a card to reveal the winner — swipe-worthy highlights for the season.
        </p>
      </div>

      <div className="awardsSwapStage">
        <CardSwap
          width={560}
          height={380}
          cardDistance={58}
          verticalDistance={68}
          delay={4500}
          pauseOnHover={true}
          easing="elastic"
          skewAmount={6}
          onCardClick={(stackIndex) => {
            // stackIndex refers to the current rendered order index,
            // we’ll map it to the award in heroCards for now:
            openAward(stackIndex);
          }}
        >
          {heroCards.map((item) => (
            <AwardCard key={item.id} item={item} />
          ))}
        </CardSwap>
      </div>

      {/* Division + Club sections (grid list) */}
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
                  onClick={() => {
                    const idx = awards.findIndex((x) => x.id === a.id);
                    openAward(idx);
                  }}
                >
                  <span className="miniEmoji">{a.emoji}</span>
                  <span className="miniTitle">{a.title}</span>
                  <span className="miniMeta">{a.meta}</span>
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
                    onClick={() => {
                      const idx = awards.findIndex((x) => x.id === a.id);
                      openAward(idx);
                    }}
                  >
                    <span className="miniEmoji">{a.emoji}</span>
                    <span className="miniTitle">{a.title}</span>
                    <span className="miniMeta">{a.meta}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AwardModal open={open} award={activeAward} onClose={closeAward} onNext={nextAward} />
    </section>
  );
}
