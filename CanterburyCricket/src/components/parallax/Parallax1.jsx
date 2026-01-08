import { useState, useEffect, useRef } from "react";
import "./parallax.css";

export const Parallax1 = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Dive animation state
  const [isDiving, setIsDiving] = useState(false);
  const lockRef = useRef(false);

  // Target section ref (your paragraphs)
  const historyRef = useRef(null);

  const handleScroll = () => setScrollPosition(window.scrollY);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDiveClick = () => {
    if (lockRef.current) return;
    lockRef.current = true;

    setIsDiving(true);

    // Start scroll after the "dive" begins
    window.setTimeout(() => {
      historyRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 260);

    // Reset animation state
    window.setTimeout(() => {
      setIsDiving(false);
      lockRef.current = false;
    }, 850);
  };

  return (
    <div className="page parallax-1-page">
      <section
        style={{
          backgroundPositionY: `${scrollPosition * 0.5}px`,
        }}
        className="parallax-banner"
      >
        {/* Wrap hero content so we animate ONLY the text/button, not the background */}
        <div className={`parallax-heroContent ${isDiving ? "isDiving" : ""}`}>
          <h2>Canterbury Cricket Club</h2>
          <button onClick={handleDiveClick}>Let&apos;s Dive into History</button>
        </div>
      </section>

      {/* Add ref here so button can scroll into this section */}
      <section className="parallax-container" ref={historyRef} id="history">
        <h2>Canterbury Cricket Club — Where Passion Meet the Pitch</h2>

        <p>
          Canterbury Cricket Club Ottawa has been a proud part of the city’s
          cricketing community since <strong>1983</strong>. What started as a
          small group of passionate cricketers has grown into one of Ottawa’s
          most respected and long-standing cricket clubs. Over the years,
          Canterbury has become known not just for competitive cricket, but for
          strong friendships, sportsmanship, and a deep love for the game.
        </p>

        <p>
          From weekend league matches to tournament finals, Canterbury has always
          been about playing hard, playing fair, and enjoying every moment on
          and off the field. Our club proudly brings together players from
          diverse backgrounds, united by a shared passion for cricket and a
          commitment to representing the club with pride.
        </p>

        <p>
          With decades of history behind us, Canterbury has celebrated countless
          milestones — championship victories, unforgettable performances, and
          generations of players who’ve worn the club colors with honor. Whether
          you’re a seasoned cricketer or new to the game, there’s always a place
          for you in the Canterbury family.
        </p>

        <p>
          Today, Canterbury Cricket Club continues to build on its legacy while
          looking toward the future — developing young talent, strengthening our
          community, and keeping the spirit of cricket alive in Ottawa. Join us
          on the journey as we write the next chapter of Canterbury cricket. 🏏❤️
        </p>
      </section>
    </div>
  );
};
