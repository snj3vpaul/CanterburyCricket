import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

// Optional: replace with your actual logo path
import clubLogo from "../../assets/CburyLogo.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.glowLeft} aria-hidden="true" />
      <div className={styles.glowRight} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            {/* If you have a logo, uncomment and use it */}
            {/* <img className={styles.logo} src={clubLogo} alt="Canterbury Cricket Club logo" /> */}

            <div className={styles.brandText}>
              <p className={styles.clubName}>Canterbury Cricket Club</p>
              <p className={styles.meta}>Est. 1983 • Ottawa, Canada</p>
              <p className={styles.tagline}>
                Community cricket, competitive spirit, and great vibes 🏏
              </p>
            </div>
          </div>

          {/* Quick links */}
          <nav className={styles.col} aria-label="Footer navigation">
            <p className={styles.heading}>Quick Links</p>
            <ul className={styles.list}>
              <li><Link to="/" className={styles.link}>Home</Link></li>
              <li><Link to="/about" className={styles.link}>About</Link></li>
              <li><Link to="/teams" className={styles.link}>Teams</Link></li>
              <li><Link to="/fixtures" className={styles.link}>Fixtures & Results</Link></li>
              <li><Link to="/awards" className={styles.link}>Awards Night</Link></li>
              <li><Link to="/sponsors" className={styles.link}>Sponsors</Link></li>
              <li><Link to="/contact" className={styles.link}>Contact</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className={styles.col}>
            <p className={styles.heading}>Contact</p>
            <ul className={styles.list}>
              <li className={styles.item}>
                <span className={styles.muted}>📍</span> Ottawa, Ontario
              </li>
              <li className={styles.item}>
                <span className={styles.muted}>✉️</span>{" "}
                <a className={styles.link} href="mailto:cricketcanterbury@gmail.com">
                  cricketcanterbury@gmail.com
                </a>
              </li>
              <li className={styles.item}>
                <span className={styles.muted}>📣</span> New players welcome!
              </li>
            </ul>

            <Link to="/contact" className={styles.cta}>
              Join the Club
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Social */}
          <div className={styles.col}>
            <p className={styles.heading}>Follow</p>
            <div className={styles.socialRow}>
              <a
                className={styles.social}
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                IG
              </a>
              <a
                className={styles.social}
                href="https://www.facebook.com/CanterburyCCCanada/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                FB
              </a>
              <a
                className={styles.social}
                href="https://www.youtube.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                title="YouTube"
              >
                YT
              </a>
            </div>

            <p className={styles.smallNote}>
              Catch match updates, highlights, and awards night vibes.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <p className={styles.bottomText}>
            © {year} Canterbury Cricket Club Ottawa. All rights reserved.
          </p>

          <div className={styles.bottomLinks}>
            <Link to="/privacy" className={styles.bottomLink}>Privacy</Link>
            <span className={styles.dot} aria-hidden="true">•</span>
            <Link to="/terms" className={styles.bottomLink}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
