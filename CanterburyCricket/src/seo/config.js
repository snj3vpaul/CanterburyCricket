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
  venueNotice: 'Fixtures and pitch allocations change each season, so check the date and exact pitch with the club before travelling.',
};

export const STATIC_ROUTES = [
  '/', '/history', '/squad', '/season', '/awards', '/masonry',
  '/join', '/sponsors', '/contact', '/guides',
  '/guides/join-cricket-club-ottawa',
  '/guides/first-cricket-match-ottawa',
  '/guides/ottawa-cricket-leagues-explained',
  '/member-login', // intentionally noindex, excluded from sitemap
];

export const SEO = {
  '/': {
    title: 'Canterbury Cricket Club | Ottawa Cricket Club Since 1983',
    description: 'Canterbury Cricket Club is an Ottawa cricket club, playing in the Ottawa Valley Cricket Council since 1983. New players welcome at Lynda Lane Park.',
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
  '/join': {
    title: 'Join a Cricket Club in Ottawa | Play for Canterbury CC',
    description: 'Want to play cricket in Ottawa? Canterbury Cricket Club plays leather-ball cricket in the OVCC CHG, CTZ and T20 divisions. New players welcome for 2027.',
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
  // Members-only SPA routes: not prerendered (kept out of STATIC_ROUTES), never indexed.
  '/fantasy': {
    title: 'Fantasy League | Canterbury Cricket Club Members',
    description: 'Members-only fantasy predictions for Canterbury Cricket Club matches.',
    noindex: true,
  },
  '/fantasy/decide': {
    title: 'Approve Registration | Canterbury Cricket Club',
    description: 'Approve or reject a Fantasy League registration.',
    noindex: true,
  },
  '/fantasy/verify': {
    title: 'Confirm Your Email | Canterbury Cricket Club',
    description: 'Confirm your email for the Canterbury Cricket Club Fantasy League.',
    noindex: true,
  },
  '/fantasy/admin': {
    title: 'Fantasy Admin | Canterbury Cricket Club',
    description: 'Committee tools for the Canterbury Cricket Club Fantasy League.',
    noindex: true,
  },
};

export const FAQS = [
  {
    question: 'How do I ask about joining Canterbury Cricket Club in Ottawa?',
    answer: 'Reach out using our website contact page or our official Instagram or Facebook channels. Introduce yourself, share your cricket experience and ask about current opportunities. A captain will follow up to talk about the right team for you. See the Join page for what to include.',
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

// Recruitment questions shown on /join and marked up as FAQPage.
export const JOIN_FAQS = [
  {
    question: 'How do I join Canterbury Cricket Club?',
    answer: 'Send a message to @canterburyccottawa on Instagram with your name, playing role, previous clubs or leagues and the part of Ottawa you live in. A Canterbury captain will contact you to talk about the right team. You can also use the contact form on this website.',
  },
  {
    question: 'What level of cricket does Canterbury play?',
    answer: 'Canterbury plays leather-ball cricket in the Ottawa Valley Cricket Council: the Challenge (CHG) division, the Citizen (CTZ) division and the T20 division. The club has ten divisional titles in its records and reached the T20 final in 2025 and 2026.',
  },
  {
    question: 'Where does Canterbury play and practise?',
    answer: 'Home matches are at the Jim Siew Cricket Pitch, Lynda Lane Park, 580 Smyth Road, Ottawa. Practice is outdoors during the summer season. Check each fixture with the club, as pitch allocations change by season.',
  },
  {
    question: 'I have just moved to Ottawa. Can I still join?',
    answer: 'Yes. Many Canterbury players first played their cricket elsewhere. Tell us where you played and in what role, and a captain will explain how the OVCC season works and where you could fit in.',
  },
];

// Add an entry ONLY for confirmed public fixtures with real startDate, location and URL.
// Example: { name:'...', startDate:'2027-06-01T10:00:00-04:00',
//   endDate:'...', locationName:'...', locationAddress:'...', url:'...', status:'EventScheduled' }
export const VERIFIED_EVENTS = [];
