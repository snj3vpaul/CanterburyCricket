import React, { useMemo } from "react";
import CardSwap, { Card } from "../CardSwap/CardSwap"; // adjust path
import "./AwardsCarousel.css";

const AWARDS = [
  { title: "Best Batter", subtitle: "Season Award", meta: "2025 • T20", emoji: "🏏" },
  { title: "Best Bowler", subtitle: "Season Award", meta: "2025 • CTZ", emoji: "🔥" },
  { title: "MVP", subtitle: "Club Award", meta: "2025", emoji: "🏆" },
  { title: "Best Fielder", subtitle: "Season Award", meta: "2025 • CHG", emoji: "🧤" },
  { title: "Spirit Award", subtitle: "Club Award", meta: "2025", emoji: "✨" },
];

function AwardCard({ item }) {
  return (
    <Card className="awardCard" role="button" aria-label={item.title} tabIndex={0}>
      <div className="awardGlow" aria-hidden="true" />
      <div className="awardTop">
        <div className="awardEmoji" aria-hidden="true">
          {item.emoji}
        </div>
        <div className="awardMeta">{item.meta}</div>
      </div>

      <div className="awardTitle">{item.title}</div>
      <div className="awardSubtitle">{item.subtitle}</div>

      <div className="awardFooter">
        <span className="awardTag">Awards Night</span>
        <span className="awardHint">Tap</span>
      </div>
    </Card>
  );
}

export default function AwardsCarousel() {
  // Responsive sizing without needing a hook: use CSS vars + clamp in CSS
  // but we still pass a reasonable base size here.
  const cards = useMemo(() => AWARDS, []);

  return (
    <section className="awardsSwapWrap">
      <div className="awardsSwapHeader">
        <h2 className="awardsSwapTitle">Awards Night</h2>
        <p className="awardsSwapSub">A rotating stack of highlights — tap any card.</p>
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
          onCardClick={(i) => {
            // optional: open modal, route, etc.
            // console.log("clicked index", i, cards[i]);
          }}
        >
          {cards.map((item, idx) => (
            <AwardCard key={idx} item={item} />
          ))}
        </CardSwap>
      </div>
    </section>
  );
}
