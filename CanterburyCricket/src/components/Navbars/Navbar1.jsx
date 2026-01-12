// src/components/Navbars/Navbar1.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import "./Navbar1.css";
import CburyLogo from "../../assets/CburyLogo.png";

export default function Navbar1() {
  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const { pathname, hash } = useLocation();

  const lastYRef = useRef(0);
  const rafRef = useRef(0);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setEventsOpen(false);
    setHistoryOpen(false);
  }, []);

  // ✅ Desktop active class (keeps your current behavior)
  const linkClass = useCallback(
    ({ isActive }) => (isActive ? "navLink active" : "navLink"),
    []
  );

  // ✅ Mobile active class
  const mobileLinkClass = useCallback(
    ({ isActive }) => `mobileNavItem ${isActive ? "active" : ""}`,
    []
  );

  // ✅ Treat /history and /history#* as active for the History dropdown button
  const isHistoryActive = pathname === "/history";

  // Lock body scroll only while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close desktop dropdowns if clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest(".eventsDropdown")) setEventsOpen(false);
      if (!e.target.closest(".historyDropdown")) setHistoryOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Hide/reveal on scroll (NO layout shifts)
  useEffect(() => {
    const threshold = 14;
    let last = window.scrollY || 0;
    lastYRef.current = last;

    const onScroll = () => {
      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;

        const y = window.scrollY || 0;
        const delta = y - last;

        // Close menus on scroll
        if (menuOpen) setMenuOpen(false);
        if (eventsOpen) setEventsOpen(false);
        if (historyOpen) setHistoryOpen(false);

        if (y < 6) {
          if (!isVisible) setIsVisible(true);
          last = y;
          return;
        }

        if (Math.abs(delta) < threshold) {
          last = y;
          return;
        }

        if (delta > 0) {
          if (isVisible) setIsVisible(false);
        } else {
          if (!isVisible) setIsVisible(true);
        }

        last = y;
        lastYRef.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [eventsOpen, menuOpen, historyOpen, isVisible]);

  return (
    <>
      <motion.header
        className={`navbar1 ${isVisible ? "show" : "hide"}`}
        initial={false}
        animate={
          prefersReducedMotion
            ? {}
            : { y: isVisible ? 0 : "calc(-1 * var(--nav-h))" }
        }
        transition={
          prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
        }
      >
        <div className="navInner">
          {/* Brand */}
          <NavLink to="/" className="brand" onClick={closeAll}>
            <img className="brandLogo" src={CburyLogo} alt="Canterbury Cricket Club" />
            <div className="brandText">
              <div className="brandTitle">Canterbury CC</div>
              <div className="brandSub">Est. 1983</div>
            </div>
          </NavLink>

          {/* Desktop Links */}
          <nav className="navLinksDesktop" aria-label="Primary navigation">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>

            {/* ✅ History dropdown (desktop) */}
            <div className="historyDropdown">
              <button
                type="button"
                className={`navLink ${historyOpen || isHistoryActive ? "active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((v) => !v)}
              >
                Rich History ▾
              </button>

              {historyOpen && (
                <div className="dropdownMenu" role="menu">
                  <Link
                    to="/history#championships"
                    className="dropdownItem"
                    onClick={closeAll}
                  >
                    Championship History
                  </Link>
                  <Link
                    to="/history#legends"
                    className="dropdownItem"
                    onClick={closeAll}
                  >
                    League Legends
                  </Link>
                </div>
              )}
            </div>

            <NavLink to="/squad" className={linkClass}>
              Our Squad
            </NavLink>

            <NavLink to="/season" className={linkClass}>
              Season
            </NavLink>

            {/* Events dropdown (desktop) */}
            <div className="eventsDropdown">
              <button
                type="button"
                className={`navLink ${eventsOpen ? "active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={eventsOpen}
                onClick={() => setEventsOpen((v) => !v)}
              >
                Events ▾
              </button>

              {eventsOpen && (
                <div className="dropdownMenu" role="menu">
                  <NavLink to="/awards" className="dropdownItem" onClick={closeAll}>
                    Awards Night
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink to="/sponsors" className={linkClass}>
              Sponsors
            </NavLink>

            <NavLink to="/contact" className={linkClass}>
              Contact Us!
            </NavLink>

            <NavLink to="/member-login" className={linkClass}>
              Member Only
            </NavLink>
          </nav>

          {/* Mobile Burger */}
          <button
            className="burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="burgerLine" />
            <span className="burgerLine" />
            <span className="burgerLine" />
          </button>
        </div>
      </motion.header>

      {/* Mobile overlay ONLY when menu is open */}
      {menuOpen && (
        <div
          className="mobileOverlay open"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <aside
        className={`mobileMenu ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        <div className="mobileHeader">
          <span className="mobileTitle">Menu</span>
          <button className="closeBtn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="navLinksMobile">
          <NavLink to="/" className={mobileLinkClass} onClick={closeAll} end>
            Home
          </NavLink>

          {/* ✅ Mobile: two direct section links */}
          <Link
            to="/history#championships"
            className={`mobileNavItem ${isHistoryActive && (hash === "" || hash === "#championships") ? "active" : ""}`}
            onClick={closeAll}
          >
            Championship History
          </Link>

          <Link
            to="/history#legends"
            className={`mobileNavItem ${isHistoryActive && hash === "#legends" ? "active" : ""}`}
            onClick={closeAll}
          >
            League Legends
          </Link>

          <NavLink to="/squad" className={mobileLinkClass} onClick={closeAll}>
            Our Squad
          </NavLink>

          <NavLink to="/season" className={mobileLinkClass} onClick={closeAll}>
            Season
          </NavLink>

          <div style={{ marginTop: 8, opacity: 0.85, fontWeight: 800 }}>
            Events
          </div>

          <NavLink to="/awards" className={mobileLinkClass} onClick={closeAll}>
            Awards Night Soon
          </NavLink>

          <NavLink to="/sponsors" className={mobileLinkClass} onClick={closeAll}>
            Sponsors
          </NavLink>

          <NavLink to="/contact" className={mobileLinkClass} onClick={closeAll}>
            Contact Us
          </NavLink>
        </nav>
      </aside>

      {/* Spacer ALWAYS present */}
      <div className="navbarSpacer" />
    </>
  );
}
