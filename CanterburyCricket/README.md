# Canterbury Cricket Club website

Source for [canterburycricketclub.com](https://canterburycricketclub.com): Vite + React, deployed on Vercel.
Pages are prerendered to static HTML at build time so search engines see full content.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server (no `api/` functions; use `npx vercel dev` for those) |
| `npm run build` | Build, prerender every route, write `sitemap.xml`/`robots.txt`, run the SEO check |
| `npm run test:fantasy` | Fantasy league, login and scorecard tests |
| `node scripts/generate-gallery-images.mjs` | Make gallery thumbnails/previews and `dimensions.json` from photos in `src/assets/gallery/` |

## Where things live

| Path | Contents |
|---|---|
| `src/pages/` | One file per page: `HomePage`, `HistoryPage`, `OurSquad`, `Season`, `Awards`, `GalleryPage` (/masonry), `Sponsors`, `Contact`, `JoinCricket` (/join), `CricketGuides` (/guides), member login and fantasy pages |
| `src/components/` | Shared pieces: `Navbar`, `Footer`, `ClubBackground`, plus page sections (`SeasonTable`, `SeasonCaptains`, `DivisionMatches`, `SquadSpotlight`, `SquadRanking`, `AwardsCarousel`, `SponsorsAccordion`, `GetInTouch`) |
| `src/seo/` | Page titles and descriptions (`config.js`), structured data (`SeoHead.jsx`), guide articles, editorial text |
| `src/data/` | Season captains, CricHeroes team links, and player stats in `stats/<division>-<year>.json` |
| `src/assets/gallery/` | Gallery photos: `thumbs/` (grid), `previews/` (full-size viewer), `dimensions.json` |
| `src/fantasy/`, `api/` | Member login and fantasy league (see `FANTASY.md`), contact form and squad API |
| `scripts/` | Prerender, SEO check and gallery image tools |

## Licence

All rights reserved. See `../LICENSE`.
