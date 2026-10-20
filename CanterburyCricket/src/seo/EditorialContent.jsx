import { Link, useLocation } from 'react-router-dom';
import { CLUB, FAQS, PLAYING_GROUND } from './config';
import { EDITORIAL } from './editorial';
import styles from './EditorialContent.module.css';

// Descriptive, context-specific internal links — no repeated self-links.
const RELATED_LINKS = {
  '/': [
    ['/guides/join-cricket-club-ottawa', 'How to join cricket in Ottawa →'],
    ['/contact', 'Ask Canterbury about playing →'],
    ['/guides/ottawa-cricket-leagues-explained', 'Understand Ottawa cricket leagues →'],
  ],
  '/contact': [
    ['/guides/join-cricket-club-ottawa', 'Read the Ottawa joining guide →'],
    ['/squad', 'Meet the Canterbury squad →'],
    ['/season', 'Explore our cricket divisions →'],
  ],
  '/season': [
    ['/guides/ottawa-cricket-leagues-explained', 'Understand Ottawa leagues and formats →'],
    ['/history', 'Explore Canterbury history →'],
    ['/contact', 'Ask about playing for Canterbury →'],
  ],
  '/squad': [
    ['/season', 'See season statistics →'],
    ['/guides/join-cricket-club-ottawa', 'How to join a cricket club in Ottawa →'],
    ['/contact', 'Contact Canterbury →'],
  ],
  '/history': [
    ['/season', 'Explore recent seasons →'],
    ['/squad', 'Meet the current squad →'],
    ['/contact', 'Ask about Canterbury →'],
  ],
  '/guides': [
    ['/guides/join-cricket-club-ottawa', 'How to find a cricket club in Ottawa →'],
    ['/guides/ottawa-cricket-leagues-explained', 'Ottawa leagues and formats →'],
    ['/contact', 'Contact Canterbury Cricket Club →'],
  ],
};

const DEFAULT_LINKS = [
  ['/history', 'Canterbury club history →'],
  ['/season', 'Ottawa season records →'],
  ['/contact', 'Contact Canterbury →'],
];

export default function EditorialContent() {
  const { pathname } = useLocation();
  const path = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
  const content = EDITORIAL[path];
  if (!content) return null;
  // Contact now has its own prominent H1 above the form. Keep only one page H1.
  // Legacy awards/gallery/sponsors components still need a meaningful H1.
  const needsH1 = new Set(["/awards", "/masonry", "/sponsors"]).has(path);
  const Heading = needsH1 ? "h1" : "h2";
  return (
    <section className={styles.section} aria-labelledby="local-cricket-heading">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>CANTERBURY · OTTAWA CRICKET</p>
          <Heading id="local-cricket-heading">{content.heading}</Heading>
          <p className={styles.lead}>{content.lead}</p>
        </div>
        <div className={styles.columns}>
          {content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        {(path === '/' || path === '/contact') && (
          <aside className={styles.groundCard} aria-labelledby="playing-ground-heading">
            <div className={styles.groundInformation}>
              <p className={styles.groundKicker}>OTTAWA CRICKET · CLUB PLAYING GROUND</p>
              <h3 id="playing-ground-heading">{PLAYING_GROUND.name}</h3>
              <p><strong>{PLAYING_GROUND.pitchName}</strong> · {PLAYING_GROUND.streetAddress}, {PLAYING_GROUND.city}, {PLAYING_GROUND.region}</p>
              <p className={styles.groundNotice}>{PLAYING_GROUND.venueNotice}</p>
              <p className={styles.groundNotice}>This is a public park and playing ground, not Canterbury Cricket Club’s office or mailing address.</p>
            </div>
            <div className={styles.groundActions}>
              <a href={PLAYING_GROUND.mapUrl} target="_blank" rel="noopener noreferrer">View ground on Google Maps ↗</a>
              {path === '/contact'
                ? <Link to="/guides/join-cricket-club-ottawa">How to enquire about joining ↗</Link>
                : <Link to="/contact">Contact about playing ↗</Link>}
              <a href={CLUB.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
              <a href={CLUB.facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a>
            </div>
          </aside>
        )}
        {path === '/contact' && (
          <div className={styles.faq}>
            <h3>Questions about cricket in Ottawa</h3>
            {FAQS.map(({ question, answer }) => (
              <details key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        )}
        <nav className={styles.links} aria-label="Related Canterbury cricket information">
          {(RELATED_LINKS[path] || DEFAULT_LINKS).map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
