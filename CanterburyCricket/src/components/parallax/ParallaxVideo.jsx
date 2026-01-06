import { useState, useEffect } from "react";
import CanterburyIntro from "../../assets/CanterburyIntro.mp4"; // correct path
import "./ParallaxVideo.module.css";

export default function ParallaxVideo() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Video section — part of normal flow */}
      <section
        className="parallax-video-banner"
        style={{
          transform: `translateY(${scrollPosition * 0.2}px)`, // subtle parallax
        }}
      >
        <video
          src={CanterburyIntro}
          autoPlay
          loop
          muted
          playsInline
          className="video-element"
        />
      </section>

      {/* Text section below */}
      <section className="parallax-text-section">
        <h2>Step Into the Club</h2>
        <p>
          Discover Canterbury Cricket Club — our rich history, vibrant community,
          and passion for the sport. Join us as we celebrate excellence on and
          off the field.
        </p>
        <button>Discover Our Story</button>
      </section>
    </>
  );
}
