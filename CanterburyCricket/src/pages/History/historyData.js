// src/pages/History/historyData.js

// ✅ Tip: For Vite, prefer either:
// 1) import images from src/assets, OR
// 2) store images in /public and reference them as "/images/..."
// Below uses /public style paths for simplicity + reliability.
// src/pages/History/historyData.js

import AmeerImg from "../../assets/Ameer.png";
import PaulImg from "../../assets/Sanjeev.jpg";

import HarisImg from "../../assets/Haris.png";
import ZainImg from "../../assets/Zain.png";
//import AkbarImg from "../../assets/Akbar.jpg";//

export const championships = [
  {
    id: "c-2025-t20",
    year: 2025,
    division: "T20",
    placement: "runner-up", // "champion" | "runner-up"
    title: "T20 Runner-Up",
    subtitle: "Narrow loss in a thrilling final.",
    description:
      "An unforgettable campaign that went down to the last over. The team showed grit and class throughout the season.",
    scoreboardUrl:
      "https://cricheroes.com/scorecard/19351353/t20-division-2025/canterbury-t20-vs-capital-t20/summary",
    photos: [
      // Put these in: public/images/history/...
      "/images/history/2025-t20-1.jpg",
      "/images/history/2025-t20-2.jpg",
      "/images/history/2025-t20-3.jpg",
    ],
    highlights: [
      "Final lost by 5 wickets",
      "Highest run-scorer of the season",
      "Best bowling unit overall",
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
    photos: [
      "/images/history/2022-chg-1.jpg",
      "/images/history/2022-chg-2.jpg",
    ],
    highlights: ["Fierce playoff run", "Clutch spells under pressure"],
    keyPerformers: ["Akram", "Haris", "Jitesh"],
  },
];

export const leagueLegends = [
  {
    id: "l-haris",
    name: "Haris Chaudhry",
    role: "League Legend",
    headshot: HarisImg,
    bio:
      "A club icon and a consistent match-winner across multiple seasons. Known for leadership, calm under pressure, and big-game impact.",
    stats: {
  seasons: 15,
  matches: 403,
  runs: 12193,
  highestScore: "240*",     // was H.S
  hundreds: 17,          // was 100s
  fifties: 71,           // was 50s
  average: 36.95,        // was avg
  wickets: 203,
  bestBowling: "6/21",   // was best
},

    awards: ["League Legend", "Multiple-time Champion"],
    
  },
  {
    id: "l-zain",
    name: "Zain Mahmood",
    role: "League Legend",
    headshot: ZainImg,
    bio:
      "A true competitor with elite consistency. Delivered standout performances year after year and inspired the next generation.",
    stats: {
  seasons: 17,
  matches: 337,
  runs: 8972,
  highestScore: "200*",    
  hundreds: 10,          // was 100s
  fifties: 51,           // was 50s
  average: 35.32,        // was avg
  wickets: 522,
  bestBowling: "9/27",   // was best
},
    awards: ["Canada U-19 Representative", "Swing Specialist"],
    
  },
  {
    id: "l-akbar",
    name: "Akbar Hussain",
    role: "League Legend",
    headshot: "/images/legends/akbar.jpg",
    bio:
      "A pillar of the club’s success era — reliable, fearless, and clutch when it mattered most.",
    stats: {
  seasons: 17,
  matches: 324,
  runs: 8072,
  highestScore: 196,     // was H.S
  hundreds: 6,          // was 100s
  fifties: 49,           // was 50s
  average: 28.83,        // was avg
  wickets: 469,
  bestBowling: "6/28",   // was best
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
      avg: 25.5,
      sr: 110.5,
      fifties: 10,
      hundreds: 2,
      best: 136,
    },
    awards: ["Sarpanch", "Best Batter (2025)"],
    
  },
  {
    id: "p-Sanjeev",
    name: "Sanjeev",
    role: "All Rounder",
    headshot: PaulImg,
    bio:
      "Accumulator, loves to field .",
    stats: {
  matches: 89,
  runs: 2138,
  highestScore: "122*",   // kept as string because of *
  average: 31.44,
  strikeRate: 89.01,
  wickets: 94,
  bestBowling: "5/38",
  fifties: 9,             // 50s
  hundreds: 3,            // 100s

    
},

    awards: ["T20 MVP (2025)"], 
    
  },
];
