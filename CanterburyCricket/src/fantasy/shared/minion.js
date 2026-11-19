/**
 * Squad minions: one original cartoon cricketer per Canterbury player
 * (adapted from the RSFC league's mascots).
 *
 * Each look is generated from the player's NAME, so a player keeps the same minion
 * even if the squad sheet is re-imported. To make one look more like the real
 * person, add an override keyed by the lower-cased name:
 *
 *   "sanjeev k paul": { hair: "quiff", beard: true },
 */
export const HAIR_STYLES = ["buzz", "curly", "quiff", "spiky", "waves", "sidepart", "topknot", "mop", "cap"];
export const EYE_STYLES = ["round", "dot", "happy"];
export const MOUTHS = ["grin", "smile", "o", "smirk"];
export const SKIN_TONES = ["#f1c7a3", "#e2a77f", "#c98a5e", "#a8693f", "#8a5232", "#6b3d24"];
export const HAIR_COLORS = ["#16110e", "#2b1d15", "#4a3020", "#7a4a2a", "#b98a4e", "#8f8f8f"];
export const SHOE_COLORS = ["#f5f0e6", "#1b2233", "#f7b500"];

export const LOOK_OVERRIDES = {};

/** FNV-1a 32-bit: a stable number for a string. */
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small seeded PRNG (mulberry32) so one seed always produces the same minion. */
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];
export const minionSeed = (name) => String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function minionLook(name) {
  const seed = minionSeed(name);
  const r = rng(fnv(seed));
  const generated = {
    skin: pick(r, SKIN_TONES),
    hair: pick(r, HAIR_STYLES),
    hairColor: pick(r, HAIR_COLORS),
    eyes: pick(r, EYE_STYLES),
    mouth: pick(r, MOUTHS),
    beard: r() < 0.4,
    shoes: pick(r, SHOE_COLORS),
    brow: Math.round((r() - 0.5) * 24),
  };
  return { ...generated, ...LOOK_OVERRIDES[seed] };
}

/** Deterministic 0..1 per name, to desynchronise idle animations. */
export const minionPhase = (name) => (fnv(`${minionSeed(name)}:phase`) % 1000) / 1000;

/** What goes on the shirt: the jersey number if there is one, else the initial. */
export function shirtText(name, jersey) {
  const j = String(jersey ?? "").trim();
  if (/^\d{1,3}$/.test(j)) return j;
  return (String(name ?? "?").trim().charAt(0) || "?").toUpperCase();
}
