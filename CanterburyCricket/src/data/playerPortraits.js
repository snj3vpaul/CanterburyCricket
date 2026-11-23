// One photo per player across the whole site (History, Awards, Squad, Season form guide).
// Keys are lower-case full names as they appear in the squad sheet / CricHeroes exports.
import ameerKhan from "../assets/players/ameer-khan.webp";
import harisChaudhry from "../assets/players/haris-chaudhry.webp";
import sanjeevKPaul from "../assets/players/sanjeev-k-paul.webp";
import zainMahmood from "../assets/players/zain-mahmood.webp";

export const PLAYER_PORTRAITS = {
  "ameer khan": ameerKhan,
  "haris chaudhry": harisChaudhry,
  "sanjeev k paul": sanjeevKPaul,
  "zain mahmood": zainMahmood,
};

export const portraitFor = (name) => PLAYER_PORTRAITS[String(name ?? "").trim().toLowerCase()] ?? null;
