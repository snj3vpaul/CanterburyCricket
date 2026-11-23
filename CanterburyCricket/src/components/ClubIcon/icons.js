/**
 * Canterbury CC icon set: original line icons on a 32px grid.
 * Style: 2px round strokes in currentColor; areas marked TINT get a light fill of the
 * same colour for depth. Plain strings so they work in React (ClubIcon.jsx) and in
 * generated SVG images (award placeholders).
 */
const TINT = 'fill="currentColor" fill-opacity=".16"';

export const ICONS = {
  // Best Batter: bat at an angle, blade tinted, spine and grip marked
  bat: `
    <g transform="rotate(38 16 16)">
      <path d="M11.8 12.5h8.4v12.8c0 2.6-1.9 4.2-4.2 4.2s-4.2-1.6-4.2-4.2z" ${TINT}/>
      <path d="M11.8 12.5h8.4v12.8c0 2.6-1.9 4.2-4.2 4.2s-4.2-1.6-4.2-4.2z"/>
      <path d="M16 16v9.5"/>
      <path d="M15 2.5h2v10h-2z"/>
    </g>`,

  // Best Bowler: ball with seam and pace lines
  ball: `
    <circle cx="19" cy="16" r="9" ${TINT}/>
    <circle cx="19" cy="16" r="9"/>
    <path d="M14.2 8.4c3 4.6 3 10.6 0 15.2M17.6 7.2c3 5 3 12.6 0 17.6"/>
    <path d="M14.9 11h1.6M15.6 14.4h1.6M15.6 17.6h1.6M14.9 21h1.6" stroke-width="1.4"/>
    <path d="M2.5 11.5h5M1.5 16h4.5M2.5 20.5h5"/>`,

  // Best Fielder: keeping glove, fingers together, thumb out, cuff
  glove: `
    <path d="M9.5 25V12.5a2 2 0 0 1 4 0V8.3a2 2 0 0 1 4 0v.9a2 2 0 0 1 4 0V18l2.3-3.2a2.1 2.1 0 0 1 3.4 2.4L22.4 25z" ${TINT}/>
    <path d="M9.5 25V12.5a2 2 0 0 1 4 0V8.3a2 2 0 0 1 4 0v.9a2 2 0 0 1 4 0V18l2.3-3.2a2.1 2.1 0 0 1 3.4 2.4L22.4 25z"/>
    <path d="M13.5 12.5v5M17.5 9.2v8.3"/>
    <rect x="8.5" y="25" width="15" height="4.5" rx="1.5"/>`,

  // MVP: trophy
  trophy: `
    <path d="M10 4.5h12v7.5a6 6 0 0 1-12 0z" ${TINT}/>
    <path d="M10 4.5h12v7.5a6 6 0 0 1-12 0z"/>
    <path d="M10 7H6.5c0 3.6 1.6 5.6 4 6.2M22 7h3.5c0 3.6-1.6 5.6-4 6.2"/>
    <path d="M16 18v4.5"/>
    <path d="M11 28.5h10v-2.8a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2z"/>
    <path d="m16 7.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke="none"/>`,

  // Player of the Year: baggy cricket cap with club star
  cap: `
    <path d="M4.5 21.5C4.5 12.4 10 7 16.5 7S27 11.8 27 19v2.5z" ${TINT}/>
    <path d="M4.5 21.5C4.5 12.4 10 7 16.5 7S27 11.8 27 19v2.5z"/>
    <path d="M17 21.5h11.3c.9 0 1.1 1.2.3 1.6-3.4 1.8-7.8 2.3-11.6 1.4"/>
    <path d="M4.5 21.5H17"/>
    <path d="M16.5 7v-1.6"/>
    <path d="M16.5 7c-2.6 2.8-3.6 8.3-3.4 14.5"/>
    <path d="m21.2 11.4.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3z" fill="currentColor" stroke="none"/>`,

  // Most Dedicated: medal on a ribbon with a heart
  medal: `
    <path d="M10.5 3.5 14 11.8M21.5 3.5 18 11.8M13.2 3.5h5.6"/>
    <circle cx="16" cy="20" r="8" ${TINT}/>
    <circle cx="16" cy="20" r="8"/>
    <path d="M16 23.6s-3.6-2.1-3.6-4.6a1.9 1.9 0 0 1 3.6-.9 1.9 1.9 0 0 1 3.6.9c0 2.5-3.6 4.6-3.6 4.6z" fill="currentColor" stroke="none"/>`,

  // Best Knock: bat meeting the ball, with impact sparks
  strike: `
    <g transform="translate(-2.5 2.5) rotate(218 16 16)">
      <path d="M11.8 12.5h8.4v11.5c0 2.6-1.9 4.2-4.2 4.2s-4.2-1.6-4.2-4.2z" ${TINT}/>
      <path d="M11.8 12.5h8.4v11.5c0 2.6-1.9 4.2-4.2 4.2s-4.2-1.6-4.2-4.2z"/>
      <path d="M15 3.5h2v9h-2z"/>
    </g>
    <circle cx="25" cy="7" r="3.2" fill="currentColor" stroke="none"/>
    <path d="M19.5 3.2l1.4 1.5M25 0.8v1.5M29.6 3.6l-1.5 1.1M30.6 9h-1.9" stroke-width="1.6"/>`,

  // Best Spell: stumps broken, one bail flying
  stumps: `
    <path d="M9.5 13v15M16 13v15M22.5 13v15"/>
    <path d="M8.5 13h6.5"/>
    <path d="m18.2 8.6 5.6-2.6"/>
    <path d="M17.6 4.2l.8 1.6M21.6 2.6l-.3 1.7M26.4 4.4l-1.4 1" stroke-width="1.5"/>
    <path d="M5.5 28.5h21"/>`,

  // Footer + form helpers
  pin: `
    <path d="M16 29s-9-8.4-9-15a9 9 0 0 1 18 0c0 6.6-9 15-9 15z" ${TINT}/>
    <path d="M16 29s-9-8.4-9-15a9 9 0 0 1 18 0c0 6.6-9 15-9 15z"/>
    <circle cx="16" cy="14" r="3.2"/>`,
  mail: `
    <rect x="4" y="7.5" width="24" height="17" rx="2.5" ${TINT}/>
    <rect x="4" y="7.5" width="24" height="17" rx="2.5"/>
    <path d="m5 9 11 8.5L27 9"/>`,
  megaphone: `
    <path d="M5 13.5h4.5L22 7v18l-12.5-6.5H5z" ${TINT}/>
    <path d="M5 13.5h4.5L22 7v18l-12.5-6.5H5z"/>
    <path d="m9.5 18.5 2 7h3l-1.8-5.8"/>
    <path d="M26 12.5a5 5 0 0 1 0 7"/>`,
  alert: `
    <path d="M14.3 5.2a2 2 0 0 1 3.4 0l11 19a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3z" ${TINT}/>
    <path d="M14.3 5.2a2 2 0 0 1 3.4 0l11 19a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3z"/>
    <path d="M16 12.5v6"/>
    <circle cx="16" cy="22.6" r="1.2" fill="currentColor" stroke="none"/>`,
  check: `
    <circle cx="16" cy="16" r="12" ${TINT}/>
    <circle cx="16" cy="16" r="12"/>
    <path d="m10.5 16.4 3.8 3.8 7.4-8"/>`,
};

export const ICON_ATTRS =
  'viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** A standalone SVG document string (for images / data URIs). */
export function iconSvg(name, { color = "#f7b500", size = 32 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ${ICON_ATTRS} color="${color}" style="color:${color}">${ICONS[name] ?? ICONS.trophy}</svg>`;
}
