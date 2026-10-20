import { Link, useParams } from 'react-router-dom';
import { GUIDE_ARTICLES } from '../seo/guides';
import styles from './CricketGuides.module.css';
const items = Object.entries(GUIDE_ARTICLES);
// Guide-to-club links help readers reach the relevant page after learning more.
const RELATED_GUIDES = {
  'join-cricket-club-ottawa': [
    ['/squad', 'Meet our squad'],
    ['/season', 'Explore the current season'],
  ],
  'first-cricket-match-ottawa': [
    ['/season', 'Explore Canterbury season records'],
    ['/guides/join-cricket-club-ottawa', 'How to approach a cricket club'],
  ],
  'ottawa-cricket-leagues-explained': [
    ['/season', 'See Canterbury divisions and statistics'],
    ['/history', 'Discover Canterbury club history'],
  ],
};
export function CricketGuidesIndex() {
  return <main className={styles.page}>
    <div className={styles.shell}>
      <p className={styles.eyebrow}>CANTERBURY · OTTAWA</p>
      <h1>Guides to cricket in Ottawa</h1>
      <p className={styles.lead}>Practical, locally relevant information for people discovering clubs, matches and community cricket.</p>
      <div className={styles.grid}>
        {items.map(([path, article]) => <article className={styles.card} key={path}>
          <span>CRICKET GUIDE</span><h2><Link to={path}>{article.title}</Link></h2>
          <p>{article.description}</p><Link className={styles.cta} to={path}>Read the guide →</Link>
        </article>)}
      </div>
      <p className={styles.note}>Current club participation, youth activities, fixtures and venues must be confirmed with the relevant organizer.</p>
    </div>
  </main>;
}
export function CricketGuide() {
  const { slug } = useParams();
  const article = GUIDE_ARTICLES[`/guides/${slug}`];
  if (!article) return <main className={styles.page}><div className={styles.shell}><h1>Guide not found</h1><Link to="/guides">All cricket guides</Link></div></main>;
  return <main className={styles.page}>
    <article className={styles.article}>
      <nav aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/guides">Cricket guides</Link></nav>
      <p className={styles.eyebrow}>CRICKET IN OTTAWA · GUIDE</p>
      <h1>{article.title}</h1>
      <p className={styles.lead}>{article.description}</p>
      <p className={styles.date}>Published {new Date(`${article.published}T12:00:00`).toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})} · Canterbury Cricket Club</p>
      {article.sections.map(({ heading, paragraphs }) => <section key={heading} className={styles.chapter}>
        <h2>{heading}</h2>{paragraphs.map((text) => <p key={text}>{text}</p>)}
      </section>)}
      <div className={styles.bottom}><p>Interested in getting involved with cricket in Ottawa?</p><Link to="/contact">Ask Canterbury Cricket Club about joining →</Link></div>
      <nav className={styles.relatedReads} aria-label="Related Canterbury information">
        <span>EXPLORE THE CLUB</span>
        {(RELATED_GUIDES[slug] || []).map(([to, label]) => (
          <Link to={to} key={to}>{label} <span aria-hidden="true">↗</span></Link>
        ))}
      </nav>
      <Link to="/guides">← See more Ottawa cricket guides</Link>
    </article>
  </main>;
}
