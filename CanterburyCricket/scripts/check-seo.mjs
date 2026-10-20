import fs from 'node:fs';
import path from 'node:path';
import { SEO, SITE_URL, STATIC_ROUTES } from '../src/seo/config.js';
import { GUIDE_ARTICLES } from '../src/seo/guides.js';
let bad = 0;
for (const route of STATIC_ROUTES) {
  const file = path.resolve('dist', route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const url = `${SITE_URL}${route}`;
  const checks = {
    nonempty: html.length > 2000,
    title: /<title>[^<]{12,}<\/title>/.test(html),
    description: /<meta\s+name="description"\s+content="[^"]+"/i.test(html),
    canonical: html.includes(url) && /rel="canonical"/i.test(html),
    clubText: /Canterbury Cricket Club/i.test(html),
    jsonld: html.includes('application/ld+json'),
    noindex: (SEO[route]?.noindex ? /noindex/.test(html) : true),
    article: (GUIDE_ARTICLES[route] ? html.includes('BlogPosting') : true),
    verifiedGround: ((route === '/' || route === '/contact') ? /Lynda Lane Park/.test(html) && /580 Smyth Road/.test(html) && /ieaHWsTVR2K5WcCP8/.test(html) : true),
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  console.log(`${failed.length ? 'FAIL' : 'PASS'} ${route}${failed.length ? ': ' + failed.join(', ') : ''}`);
  if (failed.length) bad++;
}
for (const f of ['404.html','robots.txt','sitemap.xml']) if (!fs.existsSync(path.resolve('dist', f))) { console.log('FAIL ' + f); bad++; }
if (bad) process.exitCode = 1;
