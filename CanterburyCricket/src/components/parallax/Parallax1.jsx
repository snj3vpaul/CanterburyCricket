import { useState, useEffect } from "react";
import "./parallax.css";

export const Parallax1 = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = () => setScrollPosition(window.scrollY);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="page parallax-1-page">
      <section
        style={{
          backgroundPositionY: `${scrollPosition * 0.5}px`, 
          //backgroundSize: `${(window.outerHeight - scrollPosition) / 3}%`,//
        }}
        className="parallax-banner"
      >
        <h2>Canterbury Cricket Club</h2>
        <button>Join the Journey</button>
      </section>
      <section className="parallax-container">
        <h2>Canterbury Cricket Club — Where Passion Meet the Pitch</h2>
        <p>
  Canterbury Cricket Club Ottawa has been a proud part of the city’s cricketing
  community since <strong>1983</strong>. What started as a small group of
  passionate cricketers has grown into one of Ottawa’s most respected and
  long-standing cricket clubs. Over the years, Canterbury has become known not
  just for competitive cricket, but for strong friendships, sportsmanship, and
  a deep love for the game.
</p>

<p>
  From weekend league matches to tournament finals, Canterbury has always been
  about playing hard, playing fair, and enjoying every moment on and off the
  field. Our club proudly brings together players from diverse backgrounds,
  united by a shared passion for cricket and a commitment to representing the
  club with pride.
</p>

<p>
  With decades of history behind us, Canterbury has celebrated countless
  milestones — championship victories, unforgettable performances, and
  generations of players who’ve worn the club colors with honor. Whether you’re
  a seasoned cricketer or new to the game, there’s always a place for you in the
  Canterbury family.
</p>

<p>
  Today, Canterbury Cricket Club continues to build on its legacy while looking
  toward the future — developing young talent, strengthening our community,
  and keeping the spirit of cricket alive in Ottawa. Join us on the journey as
  we write the next chapter of Canterbury cricket. 🏏❤️
</p>

      </section>
    </div>
  );
};
