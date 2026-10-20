import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CLUB, FAQS, PLAYING_GROUND, SEO, SITE_URL, VERIFIED_EVENTS } from './config';
import { GUIDE_ARTICLES } from './guides';

const absolute = (path) => `${SITE_URL}${path === '/' ? '/' : path}`;

function meta(selector, attribute, value, content) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, value);
    node.dataset.seo = 'canterbury';
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}
function link(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.rel = rel;
    node.dataset.seo = 'canterbury';
    document.head.appendChild(node);
  }
  node.href = href;
}
function structuredData(path, title) {
  const playingGround = {
    '@type': 'Place',
    name: `${PLAYING_GROUND.pitchName} at ${PLAYING_GROUND.name}`,
    description: 'Public cricket playing ground in Ottawa. Not Canterbury Cricket Club’s office or mailing address; confirm individual fixtures with the club.',
    url: PLAYING_GROUND.mapUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: PLAYING_GROUND.streetAddress,
      addressLocality: PLAYING_GROUND.city,
      addressRegion: PLAYING_GROUND.region,
      addressCountry: PLAYING_GROUND.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: PLAYING_GROUND.latitude,
      longitude: PLAYING_GROUND.longitude,
    },
  };
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'SportsClub',
    '@id': `${SITE_URL}/#sportsclub`,
    name: CLUB.name,
    url: SITE_URL,
    email: CLUB.email,
    foundingDate: CLUB.founded,
    sport: 'Cricket',
    areaServed: { '@type': 'City', name: 'Ottawa' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: CLUB.city,
      addressRegion: CLUB.region,
      addressCountry: CLUB.country,
      ...(CLUB.streetAddress ? { streetAddress: CLUB.streetAddress } : {}),
      ...(CLUB.postalCode ? { postalCode: CLUB.postalCode } : {}),
    },
    ...(CLUB.phone ? { telephone: CLUB.phone } : {}),
    ...(CLUB.latitude != null && CLUB.longitude != null ? {
      geo: { '@type': 'GeoCoordinates', latitude: CLUB.latitude, longitude: CLUB.longitude },
    } : {}),
    // Public municipal ground, separate from the club's registered address.
    location: playingGround,
    sameAs: [CLUB.instagram, CLUB.facebook],
    logo: `${SITE_URL}/og-canterbury.jpg`,
  };
  const segments = path.split('/').filter(Boolean);
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` }];
  if (segments.length) crumbs.push({ '@type': 'ListItem', position: 2, name: segments.length > 1 ? 'Cricket Guides' : title, item: absolute(`/${segments[0]}`) });
  if (segments.length > 1) crumbs.push({ '@type': 'ListItem', position: 3, name: title, item: absolute(path) });
  const graph = [organization];
  if (path !== '/' && path !== '/member-login') graph.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs,
  });
  if (path === '/contact') graph.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQS.map(({ question, answer }) => ({
      '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  });
  if (path.startsWith('/guides/') && GUIDE_ARTICLES[path]) {
    const guide = GUIDE_ARTICLES[path];
    graph.push({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: guide.title, description: guide.description,
      datePublished: guide.published, dateModified: guide.published,
      mainEntityOfPage: absolute(path),
      author: { '@type': 'Organization', name: CLUB.name },
      publisher: { '@id': `${SITE_URL}/#sportsclub` },
    });
  }
  for (const event of VERIFIED_EVENTS.filter((e) => e.url === absolute(path))) {
    graph.push({
      '@context': 'https://schema.org', '@type': 'SportsEvent',
      name: event.name, startDate: event.startDate,
      ...(event.endDate ? { endDate: event.endDate } : {}),
      eventStatus: `https://schema.org/${event.status || 'EventScheduled'}`,
      location: { '@type': 'Place', name: event.locationName,
        address: event.locationAddress },
      url: event.url,
    });
  }
  return graph;
}

export default function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
    const guide = GUIDE_ARTICLES[path];
    const info = guide ? { title: `${guide.title} | Canterbury CC`, description: guide.description } : SEO[path];
    if (!info) return;
    document.title = info.title;
    meta('meta[name="description"]', 'name', 'description', info.description);
    meta('meta[name="robots"]', 'name', 'robots', info.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large');
    meta('meta[property="og:type"]', 'property', 'og:type', guide ? 'article' : 'website');
    meta('meta[property="og:title"]', 'property', 'og:title', info.title);
    meta('meta[property="og:description"]', 'property', 'og:description', info.description);
    meta('meta[property="og:url"]', 'property', 'og:url', absolute(path));
    meta('meta[property="og:image"]', 'property', 'og:image', `${SITE_URL}/og-canterbury.jpg`);
    meta('meta[property="og:locale"]', 'property', 'og:locale', 'en_CA');
    meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    link('canonical', absolute(path));
    document.head.querySelectorAll('script[data-canterbury-jsonld]').forEach((node) => node.remove());
    for (const data of structuredData(path, info.title)) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.canterburyJsonld = 'true';
      script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    }
    document.documentElement.dataset.seoReady = path;
  }, [pathname]);
  return null;
}
