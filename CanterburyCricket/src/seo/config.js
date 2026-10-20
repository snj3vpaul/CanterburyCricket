// Shared public identity. Fill OPTIONAL_FIELDS only with verified public details.
export const SITE_URL = 'https://canterburycricketclub.com';
export const CLUB = {
  name: 'Canterbury Cricket Club',
  email: 'cricketcanterbury@gmail.com',
  founded: '1983',
  city: 'Ottawa',
  region: 'Ontario',
  country: 'CA',
  instagram: 'https://www.instagram.com/canterburyccottawa',
  facebook: 'https://www.facebook.com/CanterburyCCCanada/',
  // Keep null rather than publishing made-up information.
  streetAddress: null,
  postalCode: null,
  phone: null,
  latitude: null,
  longitude: null,
  // This is not Canterbury's street or mailing address.
  groundName: 'Lynda Lane Park',
  joiningMethod: 'Website contact page and official social-media accounts',
};

// Venue details refer to the public playing ground, NOT a club office or mailing address.
// Map link provided by the club; City of Ottawa records name the cricket pitch and park address.
export const PLAYING_GROUND = {
  name: 'Lynda Lane Park',
  pitchName: 'Jim Siew Cricket Pitch',
  streetAddress: '580 Smyth Road',
  city: 'Ottawa',
  region: 'Ontario',
  country: 'CA',
  // Approximate park pin from the club-provided map link; not a specific match wicket.
  latitude: 45.3972967,
  longitude: -75.6453003,
  mapUrl: 'https://maps.app.goo.gl/ieaHWsTVR2K5WcCP8',
  venueNotice: 'Confirm the date, exact pitch and access details with the club before travelling. No fixture or training schedule has been confirmed.',
};

export const STATIC_ROUTES = [
  '/', '/history', '/squad', '/season', '/awards', '/masonry',
  '/sponsors', '/contact', '/guides',
  '/guides/join-cricket-club-ottawa',
  '/guides/first-cricket-match-ottawa',
  '/guides/ottawa-cricket-leagues-explained',
  '/member-login', // intentionally noindex, excluded from sitemap
];

export const SEO = {
  '/': {
    title: 'Cricket in Ottawa | Canterbury Cricket Club Since 1983',
    description: 'Discover Canterbury Cricket Club in Ottawa, Ontario, playing at Lynda Lane Park. Explore our history, season records and ways to get in touch.',
  },
  '/history': {
    title: 'Our History & Championships | Canterbury Cricket Club Ottawa',
    description: 'Explore Canterbury Cricket Club history in Ottawa, from its 1983 roots to club milestones, achievements and the players behind its legacy.',
  },
  '/squad': {
    title: 'Meet Our Cricket Squad | Canterbury CC Ottawa',
    description: 'Get to know Canterbury Cricket Club players and the people behind our Ottawa cricket community. Explore the squad and contact the club.',
  },
  '/season': {
    title: 'Cricket Season, Teams & Statistics | Canterbury CC Ottawa',
    description: 'Follow Canterbury Cricket Club seasons in Ottawa, with match links, division information, player performances and season statistics.',
  },
  '/awards': {
    title: 'Club Awards & Celebrations | Canterbury Cricket Club Ottawa',
    description: 'Explore Canterbury Cricket Club celebrations, awards and recognition of Ottawa cricket players and volunteers across club seasons.',
  },
  '/masonry': {
    title: 'Ottawa Cricket Club Photos | Canterbury CC Gallery',
    description: 'Browse photos from Canterbury Cricket Club matches, events and community celebrations in Ottawa, Ontario.',
  },
  '/sponsors': {
    title: 'Support Ottawa Cricket | Canterbury CC Sponsors',
    description: 'Discover the community partners and supporters of Canterbury Cricket Club in Ottawa, and learn how to support local cricket.',
  },
  '/contact': {
    title: 'Join Cricket in Ottawa | Contact Canterbury Cricket Club',
    description: 'Want to play cricket in Ottawa? Contact Canterbury Cricket Club to ask about joining, current opportunities and local playing arrangements.',
  },
  '/guides': {
    title: 'Ottawa Cricket Guides | Canterbury Cricket Club',
    description: 'Practical guides to playing cricket in Ottawa: finding a club, preparing for a match and understanding local cricket formats.',
  },
  '/member-login': {
    title: 'Member Login | Canterbury Cricket Club',
    description: 'Member access for Canterbury Cricket Club.',
    noindex: true,
  },
};

export const FAQS = [
  {
    question: 'How do I ask about joining Canterbury Cricket Club in Ottawa?',
    answer: 'Reach out using our website contact page or our official Instagram or Facebook channels. Introduce yourself, share your cricket experience and ask about current opportunities. A message is an enquiry, not a confirmed registration or selection.',
  },
  {
    question: 'Does Canterbury Cricket Club offer youth cricket lessons?',
    answer: 'Current youth coaching or junior registration has not been confirmed. Contact the club to ask about age eligibility or possible referrals to suitable programs in Ottawa.',
  },
  {
    question: 'Where does Canterbury Cricket Club play?',
    answer: 'Canterbury currently identifies Lynda Lane Park, home to the Jim Siew Cricket Pitch, at 580 Smyth Road, Ottawa, as a playing ground. This is a public park, not the club’s mailing or office address. Confirm each fixture, exact pitch and any training arrangements with the club before travelling.',
  },
];

// Add an entry ONLY for confirmed public fixtures with real startDate, location and URL.
// Example: { name:'...', startDate:'2027-06-01T10:00:00-04:00',
//   endDate:'...', locationName:'...', locationAddress:'...', url:'...', status:'EventScheduled' }
export const VERIFIED_EVENTS = [];
