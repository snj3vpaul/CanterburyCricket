import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import "./Navbar1.css";
import CburyLogo from "../../assets/CburyLogo.png"; // adjust path if needed

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    const threshold = 10;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollTop.current + threshold) setIsVisible(false);
      else if (y < lastScrollTop.current - threshold) setIsVisible(true);
      lastScrollTop.current = y <= 0 ? 0 : y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="navbar-1 fire-nav"
      initial={false}
      animate={isVisible ? "shown" : "hidden"}
      variants={{ shown: { y: 0 }, hidden: { y: "-100%" } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* 🔥 fire layer stays as you already have it (optional) */}
      {!prefersReducedMotion && (
        <div className="fire-layer" aria-hidden="true">
          <div className="fire-glow" />
          <div className="fire-waves">
            <span className="fire-wave fw1" />
            <span className="fire-wave fw2" />
            <span className="fire-wave fw3" />
          </div>
          <div className="embers">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="ember" />
            ))}
          </div>
        </div>
      )}

      <div className="navbar-1-inner nav-layout">
        {/* LEFT: Logo */}
        <Link to="/" className="brand-left" aria-label="Home">
          <motion.img
            src={CburyLogo}
            alt="Canterbury Cricket Club Ottawa"
            className="brand-logo"
            animate={
              prefersReducedMotion ? {} : { y: [0, -2, 0], scale: [1, 1.02, 1] }
            }
            transition={
              prefersReducedMotion
                ? {}
                : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
            }
            whileHover={
              prefersReducedMotion
                ? {}
                : {
                    scale: 1.06,
                    rotate: -1,
                    filter: "drop-shadow(0 0 18px rgba(255,140,0,0.85))",
                  }
            }
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          />
        </Link>

        {/* CENTER: Links */}
        <div className="nav-items center-links" aria-label="Primary navigation">
          <NavLink to="/" end>
            About
          </NavLink>
          <NavLink to="/squad">Our Squad</NavLink>
          <NavLink to="/Season">Season</NavLink>
          <NavLink to="/Awards">Awards Night</NavLink>
          <NavLink to="/Sponsors">Sponsors</NavLink>
          <NavLink to="/Contact">Contact</NavLink>
        </div>

        {/* RIGHT: Member Login button */}
        <div className="right-actions">
          <button
            className="member-login-btn"
            onClick={() => navigate("/member-login")}
            type="button"
          >
            Member Login
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
