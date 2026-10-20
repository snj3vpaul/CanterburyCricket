import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, DialogContent } from '@mui/material';

import archiveAwards from '../../assets/Masonry/previews/IMG_1375.webp';
import archiveTrophies from '../../assets/Masonry/previews/IMG_1490.webp';
import { championships, goldenEra, leagueLegends, performers } from './historyData';
import { divisionSummaries } from './historyPageContent';
import styles from './HistoryPage.module.css';

const DIVISIONS = ['All', 'CHG', 'CTZ', 'T20'];
const RESULTS = [
  { value: 'All', label: 'All results' },
  { value: 'champion', label: 'Champions' },
  { value: 'runner-up', label: 'Runners-up' },
];

const formatNumber = (value) =>
  typeof value === 'number' ? new Intl.NumberFormat('en-CA').format(value) : String(value);

const formatStatLabel = (key) =>
  key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Eyebrow({ number, children, light = false }) {
  return (
    <div className={`${styles.eyebrow} ${light ? styles.eyebrowLight : ''}`}>
      <span className={styles.eyebrowRule} aria-hidden="true" />
      {number && <span className={styles.eyebrowNumber}>{number}</span>}
      <span>{children}</span>
    </div>
  );
}

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>;
}

function Portrait({ person, className = '', eager = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = person.headshot && !imageFailed;
  const initials = person.name
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join('');

  return (
    <span className={`${styles.portrait} ${className}`}>
      <span className={styles.portraitInitials} aria-hidden="true">{initials}</span>
      {hasImage && (
        <img
          src={person.headshot}
          alt=""
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}

function HistoryHero({ titleCount, finalsCount }) {
  return (
    <section className={styles.hero} aria-labelledby="history-title">
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.heroTopline}>
              <span className={styles.heroBadge}>CANTERBURY CRICKET CLUB</span>
              <span className={styles.heroSince}>EST. 1983 · OTTAWA</span>
            </div>
            <p className={styles.heroOverline}>The Canterbury archives / 01</p>
            <h1 className={styles.heroTitle} id="history-title">
              A legacy<br />
              <span>built to</span><br />
              <em>last.</em>
            </h1>
            <p className={styles.heroDescription}>
              Decades of big innings, unforgettable finals, and the people who gave the crest its meaning. This is our story — and it is still being written.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryLink} href="#championships">
                Explore our finals <Arrow />
              </a>
              <a className={styles.textLink} href="#legends">
                Meet the legends <Arrow diagonal />
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImageFrame}>
              <img
                src={archiveAwards}
                alt="Canterbury club member receiving an award"
                className={styles.heroImage}
                fetchPriority="high"
                decoding="async"
              />
              <div className={styles.heroImageShade} />
              <div className={styles.heroImageCaption}>
                <span className={styles.captionDot} />
                <span>From the Canterbury club archive</span>
              </div>
            </div>
            <div className={styles.heroPhotoInset}>
              <img src={archiveTrophies} alt="Trophies displayed at a Canterbury club event" loading="lazy" decoding="async" />
              <span>THE MOMENTS THAT MATTER</span>
            </div>
            <div className={styles.heroVerticalTag} aria-hidden="true">PRIDE · HISTORY · BROTHERHOOD</div>
          </div>
        </div>
        <div className={styles.heroFooter}>
          <span className={styles.heroIndex}>THE STORY SO FAR</span>
          <div className={styles.heroNumbers}>
            <div><strong>35</strong><span>CHG-A games unbeaten</span></div>
            <div><strong>{titleCount}</strong><span>Divisional titles in club records</span></div>
            <div><strong>{finalsCount}</strong><span>Final appearances profiled</span></div>
          </div>
          <a href="#golden-era" className={styles.scrollPrompt}>Scroll to discover <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}

function ChapterNav() {
  return (
    <nav className={styles.chapterNav} aria-label="On this page">
      <div className={`${styles.shell} ${styles.chapterNavInner}`}>
        <span className={styles.chapterNavLabel}>IN THIS STORY</span>
        <div className={styles.chapterLinks}>
          <a href="#golden-era">01 / Golden era</a>
          <a href="#summary">02 / Club record</a>
          <a href="#championships">03 / The finals</a>
          <a href="#legends">04 / Club legends</a>
          <a href="#performers">05 / Next generation</a>
        </div>
      </div>
    </nav>
  );
}

function GoldenEra() {
  return (
    <section id="golden-era" className={styles.goldenSection} aria-labelledby="golden-heading">
      <div className={styles.shell}>
        <div className={styles.sectionTopline}>
          <Eyebrow number="01">A period like no other</Eyebrow>
          <span className={styles.sectionAside}>{goldenEra.years} / CHG</span>
        </div>
        <div className={styles.goldenLayout}>
          <div className={styles.goldenStory}>
            <h2 className={styles.goldenHeading} id="golden-heading">The years we <em>couldn’t be beaten.</em></h2>
            <p className={styles.goldenLead}>
              A defining chapter in Canterbury history: an unbeaten run that stretched from mid-2006 to mid-2008.
            </p>
            <p className={styles.goldenSmall}>Not simply a winning season. An extraordinary stretch of consistency, belief, and togetherness.</p>
            <a className={styles.inlineLink} href="#championships">See the championship years <Arrow /></a>
          </div>
          <div className={styles.streakPanel}>
            <span className={styles.streakPanelLabel}>THE UNBEATEN RUN</span>
            <strong className={styles.streakNumber}>35<span className={styles.streakAsterisk}>*</span></strong>
            <p className={styles.streakName}>CONSECUTIVE CHG-A<br />GAMES UNBEATEN</p>
            <div className={styles.streakPeriod}>{goldenEra.period}</div>
            <div className={styles.streakFootnote}>* Includes one tied match against CCCCC.</div>
          </div>
        </div>
        <div className={styles.goldenFacts}>
          <div><span>01</span><p>Unbeaten throughout the entire 2007 season</p></div>
          <div><span>02</span><p>One tied match included in the 35-game run</p></div>
          <div><span>03</span><p>NECC ended the unbeaten streak</p></div>
        </div>
      </div>
    </section>
  );
}

function DivisionSummary() {
  return (
    <section id="summary" className={styles.summarySection} aria-labelledby="summary-heading">
      <div className={styles.shell}>
        <div className={styles.headingRow}>
          <div>
            <Eyebrow number="02">The record books</Eyebrow>
            <h2 className={styles.sectionHeading} id="summary-heading">Success, <em>across divisions.</em></h2>
          </div>
          <p className={styles.sectionIntro}>A snapshot of Canterbury’s long-standing presence in the CHG, CTZ and T20 competitions.</p>
        </div>
        <div className={styles.divisionGrid}>
          {divisionSummaries.map((record, index) => (
            <article className={styles.divisionCard} key={record.id}>
              <div className={styles.divisionCardHeader}>
                <span className={styles.divisionOrdinal}>0{index + 1} / DIVISION</span>
                <span className={styles.divisionRange}>{record.range}</span>
              </div>
              <h3 className={styles.divisionCode}>{record.shortName}<span className={styles.divisionDot}>.</span></h3>
              <p className={styles.divisionName}>{record.name}</p>
              <div className={styles.divisionMainStats}>
                <div><strong>{record.titles}</strong><span>TITLES</span></div>
                <div><strong>{record.finals}</strong><span>FINALS</span></div>
                <div><strong>{record.playoffRate}%</strong><span>PLAYOFF RATE</span></div>
              </div>
              <div className={styles.divisionDetails}>
                <span>{record.seasons} seasons</span>
                <span>{record.semiFinals} semi-finals</span>
                <span>Last title {record.lastWin}</span>
              </div>
              <ul className={styles.divisionNotes}>
                {record.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.recordNote}>Division totals reflect the club summary records. The finals archive below features selected documented matches, not a complete list of every title.</p>
      </div>
    </section>
  );
}

function FinalCard({ item, index }) {
  const champion = item.placement === 'champion';
  return (
    <article className={styles.finalEntry}>
      <div className={styles.finalYearColumn}>
        <span className={styles.finalYear}>{item.year}</span>
        <span className={styles.finalNode} aria-hidden="true" />
      </div>
      <div className={`${styles.finalCard} ${champion ? styles.finalChampion : ''}`}>
        <div className={styles.finalCardHeader}>
          <span className={styles.finalIndex}>FINAL {String(index + 1).padStart(2, '0')}</span>
          <div className={styles.finalBadges}>
            <span className={styles.divisionTag}>{item.division}</span>
            <span className={`${styles.placementTag} ${champion ? styles.winnerTag : ''}`}>
              {champion ? '★ Champion' : 'Runner-up'}
            </span>
          </div>
        </div>
        <div className={styles.finalContent}>
          <div>
            <h3>{item.title}</h3>
            {item.subtitle && <p className={styles.finalSubtitle}>{item.subtitle}</p>}
            {item.description && <p className={styles.finalDescription}>{item.description}</p>}
            {item.result && <p className={styles.finalResult}>{item.result}</p>}
          </div>
          <div className={styles.finalDetails}>
            {item.highlights?.length > 0 && (
              <div className={styles.finalDetailBlock}>
                <span className={styles.finalDetailLabel}>MATCH HIGHLIGHTS</span>
                {item.highlights.map((highlight) => <p key={highlight}>{highlight}</p>)}
              </div>
            )}
            {item.keyPerformers?.length > 0 && (
              <div className={styles.finalDetailBlock}>
                <span className={styles.finalDetailLabel}>KEY CONTRIBUTORS</span>
                <p>{item.keyPerformers.join(' · ')}</p>
              </div>
            )}
          </div>
        </div>
        {item.scoreboardUrl && (
          <a className={styles.scorecardLink} href={item.scoreboardUrl} target="_blank" rel="noopener noreferrer">
            View match scorecard <Arrow diagonal />
          </a>
        )}
      </div>
    </article>
  );
}

function FinalsArchive() {
  const [division, setDivision] = useState('All');
  const [result, setResult] = useState('All');

  const sorted = useMemo(() => [...championships].sort((a, b) => b.year - a.year), []);
  const filtered = useMemo(() => sorted.filter((item) =>
    (division === 'All' || item.division === division) &&
    (result === 'All' || item.placement === result)
  ), [sorted, division, result]);

  const clearFilters = () => {
    setDivision('All');
    setResult('All');
  };

  return (
    <section id="championships" className={styles.finalsSection} aria-labelledby="finals-heading">
      <div className={styles.shell}>
        <div className={styles.headingRow}>
          <div>
            <Eyebrow number="03" light>The defining moments</Eyebrow>
            <h2 className={`${styles.sectionHeading} ${styles.headingLight}`} id="finals-heading">Every final has <em>a story.</em></h2>
          </div>
          <p className={`${styles.sectionIntro} ${styles.introLight}`}>
            From the triumphs to the near misses — explore the matches that left their mark on Canterbury history.
          </p>
        </div>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup} role="group" aria-label="Filter finals by division">
            <span className={styles.filterLabel}>DIVISION</span>
            <div className={styles.filterButtons}>
              {DIVISIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={division === value}
                  className={`${styles.filterButton} ${division === value ? styles.filterActive : ''}`}
                  onClick={() => setDivision(value)}
                >{value === 'All' ? 'All divisions' : value}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup} role="group" aria-label="Filter finals by result">
            <span className={styles.filterLabel}>RESULT</span>
            <div className={styles.filterButtons}>
              {RESULTS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={result === value}
                  className={`${styles.filterButton} ${result === value ? styles.filterActive : ''}`}
                  onClick={() => setResult(value)}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.archiveMeta} aria-live="polite" aria-atomic="true">
          <span>SHOWING <strong>{filtered.length}</strong> OF {sorted.length} FEATURED FINALS</span>
          {(division !== 'All' || result !== 'All') && (
            <button type="button" className={styles.resetButton} onClick={clearFilters}>Clear filters ×</button>
          )}
        </div>
        <div className={styles.finalsTimeline}>
          {filtered.length ? filtered.map((item, index) => (
            <FinalCard item={item} index={index} key={item.id} />
          )) : (
            <div className={styles.emptyState}>
              <h3>No finals match these filters.</h3>
              <p>Try another division or result to explore more of the archive.</p>
              <button type="button" onClick={clearFilters}>Show all finals <Arrow /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PlayerCard({ person, onOpen, index }) {
  const stats = person.stats || {};
  const primaryStats = person.role?.toLowerCase().includes('bowl')
    ? [['WICKETS', stats.wickets], ['BEST', stats.bestBowling]]
    : [['RUNS', stats.runs], ['MATCHES', stats.matches]];
  const visibleStats = primaryStats.filter(([, value]) => value != null).slice(0, 2);

  return (
    <button type="button" className={styles.playerCard} onClick={() => onOpen(person)} aria-label={`View ${person.name}'s profile`}>
      <div className={styles.playerMedia}>
        <Portrait person={person} />
        <span className={styles.playerIndex}>NO. {String(index + 1).padStart(2, '0')}</span>
        <span className={styles.playerOpen} aria-hidden="true">↗</span>
      </div>
      <div className={styles.playerCardBody}>
        <span className={styles.playerRole}>{person.role}</span>
        <h3>{person.name}</h3>
        <div className={styles.playerStats}>
          {visibleStats.map(([label, value]) => (
            <div key={label}><strong>{formatNumber(value)}</strong><span>{label}</span></div>
          ))}
        </div>
        <span className={styles.playerProfileLink}>View full profile <Arrow /></span>
      </div>
    </button>
  );
}

function PlayerSection({ id, label, title, description, players, variant = 'dark', onOpen }) {
  return (
    <section id={id} className={`${styles.playersSection} ${variant === 'light' ? styles.playersLight : ''}`} aria-labelledby={`${id}-heading`}>
      <div className={styles.shell}>
        <div className={styles.headingRow}>
          <div>
            <Eyebrow number={id === 'legends' ? '04' : '05'} light={variant !== 'light'}>{label}</Eyebrow>
            <h2 className={`${styles.sectionHeading} ${variant !== 'light' ? styles.headingLight : ''}`} id={`${id}-heading`}>{title}</h2>
          </div>
          <p className={`${styles.sectionIntro} ${variant !== 'light' ? styles.introLight : ''}`}>{description}</p>
        </div>
        <div className={styles.playerGrid}>
          {players.map((person, index) => <PlayerCard key={person.id} person={person} index={index} onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  );
}

function PlayerProfile({ person, onClose }) {
  const stats = Object.entries(person?.stats || {});
  return (
    <Dialog
      open={Boolean(person)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="history-player-profile-title"
      slotProps={{ paper: { className: styles.profileDialog } }}
    >
      {person && (
        <DialogContent className={styles.profileDialogContent}>
          <div className={styles.profileHeader}>
            <div className={styles.profileIdentity}>
              <Portrait person={person} className={styles.profilePortrait} eager />
              <div>
                <span className={styles.profileEyebrow}>CANTERBURY / PLAYER PROFILE</span>
                <h2 id="history-player-profile-title">{person.name}</h2>
                <p>{person.role}</p>
              </div>
            </div>
            <button type="button" className={styles.profileClose} onClick={onClose} aria-label="Close player profile">×</button>
          </div>
          {person.bio && <p className={styles.profileBio}>{person.bio}</p>}
          {person.awards?.length > 0 && (
            <div className={styles.profileAwards} aria-label="Player honours">
              {person.awards.map((award) => <span key={award}>{award}</span>)}
            </div>
          )}
          <h3 className={styles.profileStatsHeading}>Career at a glance</h3>
          <div className={styles.profileStatsGrid}>
            {stats.map(([key, value]) => (
              <div key={key} className={styles.profileStat}>
                <strong>{formatNumber(value)}</strong>
                <span>{formatStatLabel(key)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default function HistoryPage() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { hash } = useLocation();

  // Also handle a direct visit to /history#... while this lazy route is mounting.
  // ScrollToTop may run before the route chunk has rendered its anchor.
  useEffect(() => {
    if (!hash) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.substring(1)));
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);
  const divisionTitleCount = divisionSummaries.reduce((sum, division) => sum + division.titles, 0);

  return (
    <main className={styles.page}>
      <HistoryHero titleCount={divisionTitleCount} finalsCount={championships.length} />
      <ChapterNav />
      <GoldenEra />
      <DivisionSummary />
      <FinalsArchive />
      <PlayerSection
        id="legends"
        label="Names etched in history"
        title={<>The people behind <em>the legacy.</em></>}
        description="The players whose skill, consistency, and commitment helped shape Canterbury's identity. Select a profile to see their full record."
        players={leagueLegends}
        onOpen={setSelectedPlayer}
      />
      <PlayerSection
        id="performers"
        label="The story continues"
        title={<>A new generation. <em>Same ambition.</em></>}
        description="Recognizing the talent and performances continuing the Canterbury tradition."
        players={performers}
        variant="light"
        onOpen={setSelectedPlayer}
      />
      <section className={styles.outroSection} aria-labelledby="history-outro-heading">
        <div className={styles.shell}>
          <div className={styles.outroContent}>
            <Eyebrow light>The next chapter</Eyebrow>
            <h2 id="history-outro-heading">History is written.<br /><em>Legacy is earned.</em></h2>
            <p>Yesterday made the club. Tomorrow belongs to the players who wear the crest next.</p>
            <div className={styles.outroActions}>
              <Link className={styles.primaryLink} to="/contact">Become part of the story <Arrow /></Link>
              <Link className={styles.outroSecondary} to="/squad">Meet the current squad <Arrow diagonal /></Link>
            </div>
            <span className={styles.outroWatermark} aria-hidden="true">CANTERBURY</span>
          </div>
        </div>
      </section>
      <PlayerProfile person={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </main>
  );
}
