// src/data/cricheroesTeams.js
// -----------------------------------------------------------------------------
// Canterbury CC — CricHeroes team pages (live fixtures, results & scorecards)
// -----------------------------------------------------------------------------
// These link straight to each team's official CricHeroes "Matches" tab, where
// ball-by-ball scores, scorecards and results update live during the season.
//
// Why link out (instead of embedding): CricHeroes blocks third-party iframe
// embedding (X-Frame-Options) and does not offer a free per-team match widget,
// so deep-linking to the official pages is the reliable, always-current option.
// Update a URL here only if a team's CricHeroes profile ID ever changes.
// -----------------------------------------------------------------------------

export const CRICHEROES_TEAMS = [
  {
    key: "T20",
    name: "Canterbury T20",
    division: "T20 Division",
    teamId: "4265193",
    matchesUrl: "https://cricheroes.com/team-profile/4265193/canterbury-t20/matches",
    accent: "#4f52ff",
  },
  {
    key: "CTZ",
    name: "Canterbury CTZ",
    division: "Citizen Division",
    teamId: "4265196",
    matchesUrl: "https://cricheroes.com/team-profile/4265196/canterbury-ctz/matches",
    accent: "#1ec8a5",
  },
  {
    key: "CHG",
    name: "Canterbury CHG",
    division: "Challenge Division",
    teamId: "4265195",
    matchesUrl: "https://cricheroes.com/team-profile/4265195/canterbury-chg/matches",
    accent: "#f7b500",
  },
];