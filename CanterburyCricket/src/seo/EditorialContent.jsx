import { Link, useLocation } from 'react-router-dom';
import { CLUB, FAQS, PLAYING_GROUND } from './config';
import { EDITORIAL } from './editorial';
import styles from './EditorialContent.module.css';

export default function EditorialContent() {
  const { pathname } = useLocation();
  const path = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
  const content = EDITORIAL[path];
  if (!content) return null;
  // Legacy awards/gallery/sponsors/contact components do not render an H1.
  // Keep the visible heading semantic instead of injecting hidden SEO-only text.
  const needsH1 = new Set(["/awards", "/masonry", "/sponsors", "/contact"]).has(path);
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
              <Link to="/contact">Contact about playing ↗</Link>
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
        <nav className={styles.links} aria-label="Explore Ottawa cricket">
          <Link to="/contact">Ask about joining →</Link>
          <Link to="/season">Explore the season →</Link>
          <Link to="/guides">Ottawa cricket guides →</Link>
        </nav>
      </div>
    </section>
  );
}
