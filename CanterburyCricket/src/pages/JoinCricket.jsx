import { Link } from 'react-router-dom';
import { CLUB, JOIN_FAQS, PLAYING_GROUND } from '../seo/config';
import styles from './CricketGuides.module.css';

// Recruitment landing page: the page Google should send "join / play cricket in Ottawa" searches to.
// Every claim here comes from the club's own records on /history and /season.
const REASONS = [
  ['Three OVCC divisions', 'Canterbury fields teams in the Ottawa Valley Cricket Council Challenge (CHG), Citizen (CTZ) and T20 divisions, so there is a level for established first-team players and for those still building.'],
  ['A club that plays finals', 'Ten divisional titles in club records, 21 finals across the three divisions, T20 league toppers in 2025 and back-to-back T20 finals in 2025 and 2026.'],
  ['Proven pathway', 'Our CTZ side has long been a platform for young players to earn a CHG place. Club legends have played more than 300 matches each for Canterbury.'],
  ['More than match day', 'Awards night, a members-only fantasy league on this website, and a squad that has stayed together for decades.'],
];

export default function JoinCricket() {
  return <main className={styles.page}>
    <article className={styles.article}>
      <nav aria-label="Breadcrumb"><Link to="/">Home</Link> / Join</nav>
      <p className={styles.eyebrow}>PLAY CRICKET IN OTTAWA · NEW PLAYERS WELCOME</p>
      <h1>Join a cricket club in Ottawa: play for Canterbury</h1>
      <p className={styles.lead}>
        Looking for a competitive leather-ball cricket team in Ottawa? Canterbury Cricket Club has played in the
        Ottawa Valley Cricket Council since 1983. Batters, bowlers, all-rounders and keepers are welcome for the 2027 season.
      </p>
      <div className={styles.bottom}>
        <p><strong>How to join:</strong> send us a message on Instagram with your name, your role, where you have played
          and the part of Ottawa you live in. A captain will get back to you to talk about the right team for you.</p>
        <a href={CLUB.instagram} target="_blank" rel="noopener noreferrer">Message Canterbury on Instagram →</a>
        <br /><Link to="/contact">Or use the contact form →</Link>
      </div>

      <section className={styles.chapter}>
        <h2>Why players choose Canterbury</h2>
        {REASONS.map(([title, text]) => <p key={title}><strong>{title}.</strong> {text}</p>)}
      </section>

      <section className={styles.chapter}>
        <h2>Where and when we play</h2>
        <p>Our home ground is the {PLAYING_GROUND.pitchName} at {PLAYING_GROUND.name}, {PLAYING_GROUND.streetAddress},
          close to the Ottawa Hospital General campus and easy to reach from Alta Vista, Riverside South, Nepean,
          Barrhaven, Orléans and Kanata. The OVCC season runs through the Ottawa summer, with practice outdoors during the season.
          {' '}{PLAYING_GROUND.venueNotice}</p>
        <p><a href={PLAYING_GROUND.mapUrl} target="_blank" rel="noopener noreferrer">View the ground on Google Maps ↗</a></p>
      </section>

      <section className={styles.chapter}>
        <h2>Questions new players ask</h2>
        {JOIN_FAQS.map(({ question, answer }) => <div key={question}>
          <h3>{question}</h3><p>{answer}</p>
        </div>)}
      </section>

      <nav className={styles.relatedReads} aria-label="See the club before you message">
        <span>SEE THE CLUB FIRST</span>
        <Link to="/squad">Meet the squad <span aria-hidden="true">↗</span></Link>
        <Link to="/season">Season stats <span aria-hidden="true">↗</span></Link>
        <Link to="/history">Titles and finals <span aria-hidden="true">↗</span></Link>
        <Link to="/guides/ottawa-cricket-leagues-explained">How Ottawa leagues work <span aria-hidden="true">↗</span></Link>
      </nav>
    </article>
  </main>;
}
