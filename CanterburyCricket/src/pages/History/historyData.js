// src/pages/History/historyData.js

import AmeerImg from "../../assets/Ameer.png";
import PaulImg from "../../assets/Sanjeev.jpg";
import HarisImg from "../../assets/Haris.png";
import ZainImg from "../../assets/Zain.png";

// ✅ Timeline = finals/titles only (Golden Era moved to top highlight component)
export const championships = [
  {
    id: "c-2025-t20",
    year: 2025,
    division: "T20",
    placement: "runner-up",
    title: "T20 Runner-Up",
    subtitle: "Narrow loss in a roller coaster thrilling final.",
    description:
      "An unforgettable campaign that went down to the last over. The team showed grit and class throughout the season.",
    scoreboardUrl:
      "https://cricheroes.com/scorecard/19351353/t20-division-2025/canterbury-t20-vs-capital-t20/summary",
    highlights: [
      "Final lost by 5 wickets",
     
      
    ],
    keyPerformers: ["Abdel Kader Sujon", "Danish Javed"],
  },

  {
    id: "c-2022-chg",
    year: 2022,
    division: "CHG",
    placement: "runner-up",
    title: "CHG Runner-Up",
    subtitle: "Fell just short at the final hurdle.",
    description:
      "A strong season with big performances across batting, bowling, and fielding. The team stayed competitive all year.",
    scoreboardUrl:
      "https://cricheroes.com/scorecard/5777355/2022-challenge/cumberland-(chl)-vs-canterbury-(chl)/summary",
    photos: ["/images/history/2022-chg-1.jpg", "/images/history/2022-chg-2.jpg"],
    highlights: ["Fierce playoff run", "Clutch spells under pressure"],
    keyPerformers: ["Akram", "Haris", "Jitesh"],
  },

  {
    id: "ctz-2018-final",
    year: 2018,
    division: "CTZ",
    placement: "champion",
    title: "CTZ Division Champions",
    subtitle: "2018 Final — Canterbury vs Royal",
    scoreboardUrl: "https://cricclubs.com/OVCC/viewScorecard.do?matchId=1894&clubId=679",
    result: "Won by 118 runs",
    highlights: ["Haris Chaudhry 85 (60 balls) — 7 fours, 4 sixes"],
    keyPerformers: ["Haris C", "Zain Mahmood", "Ayoub"],
  },

  {
    id: "t20-2018-final",
    year: 2018,
    division: "T20",
    placement: "champion",
    title: "T20 Division Champions",
    subtitle: "2018 Final — Canterbury vs Defence",
    scoreboardUrl: "https://cricclubs.com/OVCC/viewScorecard.do?matchId=1915&clubId=679",
    result: "Won by 5 wickets",
    match: {
      opponent: "Defence T20",
      canterbury: "106/5 (18.2 ov)",
      defence: "105/9 (20.0 ov)",
      date: "06-Oct-2018",
      location: "Ottawa (Ontario)",
      format: "T20",
      toss: "Canterbury (T20) opted to field",
    },
    highlights: ["Haris Chaudhry 39 (41 balls) — 1 four, 2 sixes"],
    keyPerformers: ["Haris C", "Shariq Akhlaq"],
  },

  {
    id: "t20-2017-final",
    year: 2017,
    division: "T20",
    placement: "champion",
    title: "T20 Division Champions",
    subtitle: "2017 Final — Canterbury vs Capital",
    scoreboardUrl: "https://cricclubs.com/OVCC/viewScorecard.do?matchId=1708&clubId=679",
    result: "Won by 70 Runs",
    highlights: ["Akber Hussain 80 (43)"],
    keyPerformers: ["Akber Hussain", "Zain Mahmood", "Deepak Pabla"],
  },

  {
    id: "chg-2017-final",
    year: 2017,
    division: "CHG",
    placement: "champion",
    title: "Challenge Division Champions",
    subtitle: "2017 Final — Canterbury vs Cathedral",
    scoreboardUrl:
      "https://cricheroes.com/scorecard/5779683/2017-challenge/canterbury-(chl)-vs-cathedral-(chl)/summary",
    result: "Won by 24 runs",
    highlights: ["A Hussain 82 (42 balls) — 11 sixes"],
    keyPerformers: ["Akber Hussain", "Deepak Pabla"],
  },

  {
    id: "chg-2006-final",
    year: 2006,
    division: "CHG",
    placement: "champion",
    title: "Challenge Division Champions",
    subtitle: "2006 Final — Canterbury vs CCCCC",
    result: "Won by 8 wickets",
    match: {
      opponent: "CCCCC",
      cathedralInnings: "59 all out (36.2 ov)",
      canterburyChase: "60/2 (14.3 ov)",
    },
    highlights: ["Vikram Arora 30* (32b)", "Kamran Raza 9 (run out)"],
    scoreboardUrl:
      "http://ottawacricket.org/en/2006_scorecards/chg/2006.09.17-ChgPO-CCC-CCCCC.htm",
  },
];

// ✅ Optional: keep Golden Era data here if you want GoldenEraHighlight to consume it later
export const goldenEra = {
  id: "golden-era",
  years: "2006–2010",
  division: "CHG",
  title: "Club’s Golden Era",
  subtitle: "Unbeaten streak — 35 consecutive CHG-A games",
  period: "Mid 2006 → Mid 2008",
  bullets: [
    "35 consecutive CHG-A games unbeaten",
    "Completely unbeaten in the 2007 season",
    "Includes 1 tied game vs CCCCC",
    "NECC was the club to break the streak (either side of the run)",
  ],
};

export const leagueLegends = [
  {
    id: "l-haris",
    name: "Haris Chaudhry",
    role: "Batter",
    headshot: HarisImg,
    bio:
      "A club icon and a consistent match-winner across multiple seasons. Known for leadership, calm under pressure, and big-game impact.",
    stats: {
      seasons: 15,
      matches: 403,
      runs: 12193,
      highestScore: "240*",
      hundreds: 17,
      fifties: 71,
      battingAverage: 36.95,
      wickets: 203,
      bestBowling: "6/21",
    },
    awards: ["League Legend", "Multiple-time Champion"],
  },
  {
    id: "l-zain",
    name: "Zain Mahmood",
    role: "All Rounder",
    headshot: ZainImg,
    bio:
      "A true competitor with elite consistency. Delivered standout performances year after year and inspired the next generation.",
    stats: {
      seasons: 17,
      matches: 337,
      runs: 8972,
      highestScore: "200*",
      hundreds: 10,
      fifties: 51,
      battingAverage: 35.32,
      bowlingAverage: 11.89,
      economy: 3.62,
      wickets: 522,
      bestBowling: "9/27",
    },
    awards: ["League Legend", "First Over Specialist"],
  },
  {
    id: "l-akbar",
    name: "Akbar Hussain",
    role: "All Rounder",
    headshot: "/images/legends/akbar.jpg",
    bio:
      "A pillar of the club’s success era — reliable, fearless, and clutch when it mattered most.",
    stats: {
      seasons: 17,
      matches: 324,
      runs: 8072,
      highestScore: 196,
      hundreds: 6,
      fifties: 49,
      battingAverage: 28.83,
      wickets: 469,
      bestBowling: "6/28",
    },
    awards: ["League Legend", "Big Match Specialist"],
  },
];

export const performers = [
  {
    id: "p-ameer",
    name: "Ameer",
    role: "Batter",
    headshot: AmeerImg,
    bio:
      "Explosive top-order batter known for fast starts and finishing games. A fan favorite on big match days.",
    stats: {
      matches: 131,
      runs: 2665,
      average: 25.5,
      strikeRate: 110.5,
      fifties: 10,
      hundreds: 2,
      highestScore: 136,
    },
    awards: ["Sarpanch", "Best Batter (2025)"],
  },
  {
    id: "p-Danish",
    name: "Danish Javed",
    role: "Bowler",
    bio: "Left Arm Orthodox.",
    stats: {
      matches: 49,
      wickets: 54,
      economy: 4.28,
      bowlingAverage: 18.56,
      bestBowling: "5/18",
    },
    awards: ["Wicket-Taker"],
  },
  {
    id: "p-Sujon",
    name: "Abdel Kader Sujon",
    role: "Bowler",
    bio: "Right Arm Off-Spin",
    stats: {
      matches: 23,
      fifties: 1,
      wickets: 28,
      economy: 3.91,
      bowlingAverage: 15.79,
      bestBowling: "3/10",
    },
    awards: ["Miserly Bowler"],
  },
  {
    id: "p-Sanjeev",
    name: "Sanjeev",
    role: "All Rounder",
    headshot: PaulImg,
    bio: "Accumulator, loves to field .",
    stats: {
      matches: 89,
      runs: 2138,
      highestScore: "122*",
      battingAverage: 31.44,
      bowlingAverage: 21.3,
      strikeRate: 89.01,
      economy: 4.76,
      wickets: 94,
      bestBowling: "5/38",
      fifties: 9,
      hundreds: 3,
    },
    awards: ["OVCC T20 MVP (2025)"],
  },
];
