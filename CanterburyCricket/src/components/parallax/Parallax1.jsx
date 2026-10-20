import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./parallax.css";

export const Parallax1 = () => {
  const bannerRef = useRef(null);

  // Dive animation state (KEEP)
  const [isDiving, setIsDiving] = useState(false);
  const lockRef = useRef(false);

  // Target section ref (KEEP - still useful if you want scroll behaviors later)
  const historyRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      banner.style.backgroundPositionY = media.matches
        ? "center"
        : `${window.scrollY * 0.5}px`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener?.("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener?.("change", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // ✅ Now navigates to /history, but still plays the dive animation first
  const handleDiveToHistoryPage = () => {
    if (lockRef.current) return;
    lockRef.current = true;

    setIsDiving(true);

    // Start navigation after "dive" begins
    window.setTimeout(() => {
      navigate("/history");
    }, 260);

    // Reset animation state (same timing you had)
    window.setTimeout(() => {
      setIsDiving(false);
      lockRef.current = false;
    }, 850);
  };

  return (
    <div className="page parallax-1-page">
      <section ref={bannerRef} className="parallax-banner">
         <div className={`parallax-heroContent ${isDiving ? "isDiving" : ""}`}>
    <div className="heroOverlay heroSplit">
      {/* LEFT: copy */}
      <div className="heroCopy">
        <h1 className="heroTitle">
          Canterbury <span>Cricket Club</span> Ottawa
        </h1>

        <p className="heroSubtitle">
          Join Ottawa’s most proud cricketing legacy
        </p>

        <div className="heroButtons">
          <button className="heroPrimary" onClick={() => navigate("/contact")}>
            Join The Team
          </button>

          <button className="heroSecondary" onClick={handleDiveToHistoryPage}>
            Our Legacy →
          </button>
        </div>
      </div>

      {/* RIGHT: crest/logo */}
      {/*<div className="heroMark" aria-hidden="true">
        <img className="heroLogo" src="/../../src/assets/CanterburyLogo.png" alt="" />
      </div>*/}
    </div>
  </div>

      </section>

      <section className="parallax-container" ref={historyRef} id="history" aria-label="Canterbury Cricket Club Ottawa history">
  {/* SEO: Keyword-forward H2 */}
  <h2>Canterbury Cricket Club Ottawa and the foundation story</h2>

  {/* Optional: keep your vibe line as supporting text (not another heading) */}
  <p className="sectionKicker">
    Canterbury Cricket Club — Where Passion Meets the Pitch
  </p>

  <p>
  Canterbury Cricket Club is a proud{" "}
  <strong>
    cricket club playing under{" "}
    <a
      href="https://www.ottawacricket.ca/"
      target="_blank"
      rel="noopener noreferrer"
      title="Ottawa Valley Cricket Council (OVCC)"
    >
      OVCC (Ottawa Valley Cricket Council)
    </a>{" "}
    in Ottawa
  </strong>{" "}
  with a legacy built through competitive cricket and strong community values.
  Founded in its modern form in <strong>1983</strong>, the club has helped lay initial foundation for Cricket in {" "}
  <strong>Ottawa </strong> for decades — from historic roots to today’s
  growing game, including <strong>Quick Fire T10 tournament to </strong> challenge division.
</p>


  <p>
    Canterbury Cricket Club Ottawa traces its roots back more than four decades, with its modern identity officially
    beginning in <strong>1983</strong>. Before that, the club was known as the{" "}
    <strong>Canadian Forces Ottawa Cricket Club (CFOCC)</strong> — fondly called <em>Forces</em> — and was based out of
    the Uplands military grounds.
  </p>

  <p>
    By 1982, a combination of retirements and an unfortunate incident led to a decline in membership, leaving Forces CC
    on the brink of folding. At the same time, another neighbouring club, <strong>Levenoques Cricket Club</strong>, based
    in Hillcrest, was facing similar struggles. Rather than allowing two historic Ottawa clubs to disappear, the
    leadership and players of both sides chose unity over loss. Forces CC was one of the most successful and respected
    clubs in the Ottawa Valley Cricket Council, producing championship teams and some of the greatest cricketers the city
    has ever seen.
  </p>

  <p>
    Legends of Ottawa cricket such as{" "}
    <strong>
      Jim Siew, Tariq Javed, Gullu Bajwa, Tony Edwards, Clinton Calixte, Shahid Khan, Mumtaz Akhter, and Akhter Mufti
    </strong>{" "}
    proudly wore the Forces colours, helping build a legacy of excellence, discipline, and sportsmanship that still
    defines the club today.
  </p>

  <p>
    With overwhelming support from both memberships, Forces CC and Levenoques CC merged to form a new club. Because both
    teams played within the Canterbury ward, the newly united club was proudly named <strong>Canterbury Cricket Club</strong>.
    A new home was assigned at <strong>Lynda Lane</strong>, a ground that was transformed into a playable cricket field
    through the dedication, labour, and commitment of Canterbury players themselves.
  </p>

  {/* SEO: Add a local + membership “hook” sentence (converts + ranks) */}
  <p>
    Today, Canterbury Cricket Club continues to grow the game in Ottawa — welcoming new players and experienced cricketers
    who want competitive matches, strong team culture, and respect for cricket traditions. 🏏
  </p>

  {/* ✅ CTA below the paragraphs (keeps dive animation) */}
  <div className={`parallax-historyCta ${isDiving ? "isDiving" : ""}`}>
    <button onClick={handleDiveToHistoryPage}>Let&apos;s Dive into History</button>

    
  </div>
</section>
    </div>
  );
};
