import { Link } from "react-router-dom";
import Captaincy2026 from "../components/Captaincy/Captaincy2026";
import DivisionMatches from "../components/Matches/DivisionMatches";
import SeasonTable from "../components/SeasonTable/SeasonTable";
import styles from "./Season.module.css";

const divisions = [
  { key: "T20", label: "T20 cricket", number: "01" },
  { key: "CTZ", label: "Citizen Division", number: "02" },
  { key: "CHG", label: "Challenge Division", number: "03" },
];

export default function Season() {
  return (
    <main className={styles.season}>
      <section className={styles.hero} aria-labelledby="season-heading">
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span aria-hidden="true" className={styles.eyebrowDot} /> CANTERBURY CC / SEASON 2026</p>
              <h1 id="season-heading" className={styles.heroTitle}>
                The season.<br /><span>Every moment matters.</span>
              </h1>
              <p className={styles.heroDescription}>
                Three divisions. One Canterbury. Explore our leadership,
                follow match results and discover the players shaping each season.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#season-statistics">Explore player stats <span aria-hidden="true">↗</span></a>
                <a className={styles.secondaryAction} href="#season-matches">Fixtures &amp; results <span aria-hidden="true">→</span></a>
              </div>
            </div>

            <aside className={styles.competitionPanel} aria-label="Our cricket divisions">
              <div className={styles.panelHeading}>
                <span>OUR COMPETITIONS</span>
                <span className={styles.panelYear}>2026</span>
              </div>
              <div className={styles.divisionList}>
                {divisions.map(({ key, label, number }) => (
                  <div key={key} className={styles.divisionItem}>
                    <span className={styles.divisionNumber}>{number}</span>
                    <span className={styles.divisionName}>{label}</span>
                    <strong className={styles.divisionKey}>{key}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.panelFoot}>
                <span className={styles.panelMark} aria-hidden="true" />
                ONE CLUB. THREE DIVISIONS.
              </div>
            </aside>
          </div>
          <nav className={styles.sectionNav} aria-label="Season sections">
            <a href="#season-leadership"><span>01</span> Leadership</a>
            <a href="#season-matches"><span>02</span> Matches</a>
            <a href="#season-statistics"><span>03</span> Player statistics</a>
          </nav>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.shell}>
          <div id="season-leadership" className={styles.sectionAnchor}>
            <Captaincy2026 />
          </div>
          <div className={styles.sectionRule} aria-hidden="true" />
          <div id="season-matches" className={styles.sectionAnchor}>
            <DivisionMatches />
          </div>
          <div className={styles.sectionRule} aria-hidden="true" />
          <div id="season-statistics" className={styles.sectionAnchor}>
            <SeasonTable />
          </div>
          <aside className={styles.seasonGuide} aria-label="Understanding Ottawa cricket competitions">
            <div>
              <p className={styles.seasonGuideEyebrow}>NEW TO OTTAWA CLUB CRICKET?</p>
              <h2>Explore the formats behind the numbers.</h2>
              <p>Learn how local divisions and match statistics work, then ask Canterbury about current playing opportunities.</p>
            </div>
            <div className={styles.seasonGuideLinks}>
              <Link to="/guides/ottawa-cricket-leagues-explained">Ottawa cricket league guide <span aria-hidden="true">↗</span></Link>
              <Link to="/contact">Ask about joining <span aria-hidden="true">→</span></Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
