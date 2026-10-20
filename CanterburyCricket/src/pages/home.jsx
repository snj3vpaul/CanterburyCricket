import { Link } from "react-router-dom";
import matchPhoto from "../assets/Sanjeev.webp";
import trophyPhoto from "../assets/Masonry/previews/IMG_1490.webp";
import clubPhoto from "../assets/Masonry/previews/IMG_1373.webp";
import styles from "./home.module.css";

const pathways = [
  {
    index: "01",
    overline: "THE PEOPLE",
    title: "Meet our squad",
    text: "Get to know the players and personalities who wear the Canterbury crest.",
    to: "/squad",
    action: "Explore the squad",
  },
  {
    index: "02",
    overline: "THE COMPETITION",
    title: "Follow the season",
    text: "Discover the divisions, performances and results that shape our cricket.",
    to: "/season",
    action: "View the season",
  },
  {
    index: "03",
    overline: "THE LEGACY",
    title: "A rich history",
    text: "Explore the unbeaten years, club achievements and the names behind them.",
    to: "/history",
    action: "Explore our history",
  },
];

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

function SectionIntro({ eyebrow, title, description, id }) {
  return (
    <div className={styles.sectionIntro}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {description && <p className={styles.sectionDescription}>{description}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.home}>
      {/* Navigation already renders its own fixed-header spacer in Navbar1.jsx. */}
      <section className={styles.hero} aria-labelledby="home-hero-heading">
        <div className={styles.heroAmbient} aria-hidden="true" />
        <div className={styles.shell}>
          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span className={styles.eyebrowDot} /> CANTERBURY CRICKET CLUB · OTTAWA</p>
              <h1 id="home-hero-heading" className={styles.heroTitle}>
                Cricket in Ottawa.<br />
                <span>A legacy since 1983.</span>
              </h1>
              <p className={styles.heroDescription}>
                A club with a past. A game with a future. Canterbury Cricket Club
                brings competitive cricket and genuine community together in Ottawa.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} to="/contact">
                  Ask about joining <Arrow />
                </Link>
                <Link className={styles.secondaryAction} to="/history">
                  Discover our story <Arrow diagonal />
                </Link>
              </div>
              <div className={styles.heroBottomLine}>
                <span className={styles.lineMark} aria-hidden="true" />
                Proudly part of Ottawa's cricket community
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroPhotoFrame}>
                <img
                  src={matchPhoto}
                  alt="Canterbury cricketer batting in a match"
                  fetchPriority="high"
                  decoding="async"
                  className={styles.heroPhoto}
                />
                <div className={styles.photoShade} aria-hidden="true" />
                <div className={styles.photoTopline}>
                  <span className={styles.photoLiveDot} aria-hidden="true" />
                  ON THE PITCH
                </div>
                <div className={styles.photoCaption}>
                  <span>CRICKET. CHARACTER. CANTERBURY.</span>
                  <span className={styles.captionDash} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.floatingPlate} aria-label="Established 1983">
                <span>EST.</span>
                <strong>1983</strong>
                <span>OTTAWA</span>
              </div>
              <div className={styles.heroVisualOutline} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statBand} aria-label="Canterbury at a glance">
        <div className={`${styles.shell} ${styles.statGrid}`}>
          <div className={styles.statItem}>
            <strong>1983</strong>
            <div><span>OUR ROOTS</span><p>Four decades of club history</p></div>
          </div>
          <div className={styles.statItem}>
            <strong>35</strong>
            <div><span>UNBEATEN</span><p>A remarkable CHG run</p></div>
          </div>
          <div className={styles.statItem}>
            <strong>03</strong>
            <div><span>DIVISIONS</span><p>CHG · CTZ · T20</p></div>
          </div>
        </div>
      </section>

      <section className={styles.discoverSection} aria-labelledby="discover-heading">
        <div className={styles.shell}>
          <SectionIntro
            eyebrow="01 / EXPLORE THE CLUB"
            id="discover-heading"
            title={<>Everything that makes us <em>Canterbury.</em></>}
            description="Whether you're here to play, keep up with the season or revisit a memorable match, start here."
          />
          <div className={styles.pathwayGrid}>
            {pathways.map((item) => (
              <Link to={item.to} className={styles.pathwayCard} key={item.index}>
                <div className={styles.cardTopline}>
                  <span>{item.overline}</span>
                  <span className={styles.cardIndex}>{item.index}</span>
                </div>
                <div className={styles.cardBody}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <span className={styles.cardAction}>{item.action} <Arrow diagonal /></span>
              </Link>
            ))}
          </div>
          <nav className={styles.guideTrail} aria-label="Cricket in Ottawa resources">
            <span>NEW TO OTTAWA CRICKET?</span>
            <Link to="/guides/join-cricket-club-ottawa">How to join a cricket club <Arrow diagonal /></Link>
            <Link to="/guides/ottawa-cricket-leagues-explained">Understand Ottawa cricket leagues <Arrow diagonal /></Link>
          </nav>
        </div>
      </section>

      <section className={styles.storySection} id="history" aria-labelledby="story-heading">
        <div className={`${styles.shell} ${styles.storyLayout}`}>
          <div className={styles.storyVisual}>
            <img
              src={clubPhoto}
              alt="Members of the Canterbury cricket community presenting a cricket jersey"
              loading="lazy"
              decoding="async"
            />
            <div className={styles.storyPhotoCaption}>
              <span>THE PEOPLE BEHIND THE CREST</span>
              <span>OTTAWA, CANADA</span>
            </div>
          </div>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>02 / OUR BEGINNINGS</p>
            <h2 id="story-heading">Built on belief.<br /><em>Bound by cricket.</em></h2>
            <p className={styles.storyLead}>
              Canterbury's roots reach back to the Canadian Forces Ottawa Cricket Club
              and Levenoques Cricket Club — two sides that came together to keep the game growing.
            </p>
            <p className={styles.storyBody}>
              That shared spirit shaped Canterbury in 1983, and it still defines our
              approach: respect for the game, commitment to one another and pride in
              representing Ottawa.
            </p>
            <Link className={styles.inlineLink} to="/history">
              Read the full club history <Arrow />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.communitySection} aria-labelledby="community-heading">
        <div className={styles.shell}>
          <SectionIntro
            eyebrow="03 / BEYOND THE BOUNDARY"
            id="community-heading"
            title={<>Every season has <em>its moments.</em></>}
            description="The game is only part of the story. The people, celebrations and memories matter just as much."
          />
          <div className={styles.communityCard}>
            <div className={styles.communityImage}>
              <img src={trophyPhoto} alt="Canterbury Cricket Club awards and trophies" loading="lazy" decoding="async" />
            </div>
            <div className={styles.communityCopy}>
              <span className={styles.communityKicker}>CLUB LIFE</span>
              <h3>Celebrating what<br />we build together.</h3>
              <p>From standout innings to awards nights, Canterbury's best moments are shared.</p>
              <div className={styles.communityActions}>
                <Link to="/masonry">Explore the gallery <Arrow diagonal /></Link>
                <Link to="/awards">Club awards <Arrow diagonal /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.joinSection} aria-labelledby="join-heading">
        <div className={styles.shell}>
          <div className={styles.joinPanel}>
            <div className={styles.joinContent}>
              <p className={styles.eyebrow}>YOUR NEXT INNINGS</p>
              <h2 id="join-heading">Your next innings<br /><em>could start here.</em></h2>
              <p>Interested in playing cricket in Ottawa or supporting the club? Send us an enquiry and we'll help you find the right information.</p>
            </div>
            <div className={styles.joinActions}>
              <Link className={styles.primaryAction} to="/contact">Ask about playing <Arrow /></Link>
              <Link className={styles.joinSecondary} to="/sponsors">Our supporters <Arrow diagonal /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
