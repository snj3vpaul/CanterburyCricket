/**
 * Build-time HTML snapshots of the ACTUAL React pages using Puppeteer.
 * npm run build:client && node scripts/prerender.mjs
 * Requirements: `npm install --save-dev puppeteer` (commit updated lockfile).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { preview } from 'vite';
import puppeteer from 'puppeteer';
import { STATIC_ROUTES, SEO, SITE_URL } from '../src/seo/config.js';
import { GUIDE_ARTICLES } from '../src/seo/guides.js';

const dist = path.resolve('dist');
const publicRoutes = STATIC_ROUTES.filter((route) => !SEO[route]?.noindex);
const requiredH1 = new Set(['/','/history','/season','/squad','/guides',...Object.keys(GUIDE_ARTICLES)]);
let server;
let browser;
try {
  server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: false } });
  const port = server.httpServer.address().port;
  if (process.env.VERCEL) {
    // Vercel's build image may not include the Linux shared libraries required
    // by Puppeteer's downloaded Google Chrome (for example libnspr4.so).
    // Use a serverless-compatible Chromium with its bundled libraries instead.
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ]);
    chromium.setGraphicsMode = false;
    browser = await puppeteerCore.launch({
      executablePath: await chromium.executablePath(),
      args: [...chromium.args, '--disable-dev-shm-usage'],
      headless: true,
    });
  } else {
    // Keep the existing Windows/macOS/Linux local development behavior.
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  }
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const failures = [];
  for (const route of STATIC_ROUTES) {
    const errors = [];
    const onPageError = (error) => errors.push(error.message);
    page.on('pageerror', onPageError);
    try {
      await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForFunction((r) =>
        document.documentElement.dataset.seoReady === r &&
        !!document.head.querySelector('link[rel="canonical"]') &&
        !document.querySelector('.pageLoader'), { timeout: 30000 }, route);
      // Wait until the route's visual component loads, not just the shared SEO section.
      await page.waitForFunction((r, needsH1) => !needsH1 || !!document.querySelector('main h1, #root h1'),
        { timeout: 20000 }, route, requiredH1.has(route));
      await new Promise((resolve) => setTimeout(resolve, 300));
      const snapshot = await page.content();
      const visibleText = await page.evaluate(() => document.querySelector('#root')?.innerText || '');
      if (errors.length) throw new Error(`Browser errors: ${errors.slice(0,3).join('; ')}`);
      if (visibleText.trim().length < 220 && route !== '/member-login') {
        throw new Error(`Route contains too little readable content (${visibleText.length} chars)`);
      }
      const output = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
      const file = path.join(dist, output);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, snapshot, 'utf8');
      console.log(`PRE-RENDER ${route.padEnd(43)} -> ${output}`);
    } catch (error) {
      failures.push(`${route}: ${error.message}`);
      console.error(`FAILED ${route}: ${error.message}`);
    } finally {
      page.off('pageerror', onPageError);
    }
  }
  await fs.writeFile(path.join(dist, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | Canterbury Cricket Club</title></head><body style="background:#070912;color:#fff;font:16px system-ui;padding:10vw"><main><h1>Page not found</h1><p>We could not find that Canterbury Cricket Club page.</p><a style="color:#e1b963" href="/">Return to Canterbury Cricket Club</a></main></body></html>`, 'utf8');
  const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes.map((url) => `  <url><loc>${xmlEsc(SITE_URL + url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
  await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');
  if (failures.length) throw new Error(`Pre-render incomplete. NEVER deploy a partial build:\n${failures.join('\n')}`);
  console.log(`SEO COMPLETE: ${STATIC_ROUTES.length} HTML routes, sitemap.xml, robots.txt, real 404.html`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
