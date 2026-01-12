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
  {
  id: "ctz-2018-final",
  year: 2018,
  division: "CTZ",
  placement: "champion",

  title: "CTZ Division Champions",
  subtitle: "2018 Final — Canterbury vs Royal",
  // ✅ ADD scorecard link
  scoreboardUrl:
    "https://cricheroes.com/scorecard/____/2018-citizen-final/canterbury-(ctz)-vs-royal-(ctz)/summary",
  result: "Won by 118 runs",

  match: {
    opponent: "Royal (CTZ)",
    canterbury: "245/10 (37.5 ov)",
    royal: "127/10 (30.5 ov)",
    date: "22-Sep-2018",
    location: "Ottawa (Ontario)",
    format: "40 Ov",
    toss: "Royal (CTZ) opted to field",
  },

  highlights: [
    "Haris Chaudhry 85 (60 balls) — 7 fours, 4 sixes",
    "S Ahmed 50 (68 balls) — 1 four, 3 sixes",
    "A Ahmadzai 42 (31 balls) — 2 fours, 2 sixes",
    "Z Mahmood 4/18 (8.0 ov) — econ 2.25",
    "S Patel 3/43 (7.5 ov)",
    "A Khalid 3/37 (5.0 ov)",
  ],
},
{
  id: "t20-2018-final",
  year: 2018,
  division: "T20",
  placement: "champion",

  title: "T20 Division Champions",
  subtitle: "2018 Final — Canterbury vs Defence",
  scoreboardUrl:
    "https://cricheroes.com/scorecard/____/2018-t20-final/canterbury-(t20)-vs-defence-(t20)/summary",
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

  highlights: [
    "Haris Chaudhry 39 (41 balls) — 1 four, 2 sixes",
       
  ],
},


  {
    id: "chg-2017-final",
    year: 2017,
    division: "CHG",
    placement: "champion",
  
    title: "Challenge Division Champions",
    subtitle: "2017 Final — Canterbury vs Cathedral",
    // ✅ ADD scorecard link
    scoreboardUrl:
      "https://cricheroes.com/scorecard/5779683/2017-challenge/canterbury-(chl)-vs-cathedral-(chl)/summary",
    result: "Won by 24 runs",
  
    match: {
      opponent: "Cathedral (CHL)",
      canterbury: "243/10 (45.4 ov)",
      cathedral: "219/10 (45.3 ov)",
      date: "23-Sep-2017",
    },
  
    highlights: [
      "A Hussain 82 (42 balls) — 11 sixes",
      "Hassan Hamid 66",
      "J Karamchandani 57",
      "Vikram Arora 4/37",
      "Deepak Pabla 3/28",
      
    ],
  
    
  },
  
  
        
        {
          id: "chg-2006-final",
          year: 2006,
          division: "CHG",
          placement: "champion",
  
          // Common display fields (timeline components usually use these)
          title: "Challenge Division Champions",
          subtitle: "2006 Final — Canterbury vs Cathedral",
          result: "Won by 8 wickets",
  
          // Screenshot-derived match details (safe to ignore if your UI doesn’t use them)
          match: {
            opponent: "Cathedral",
            cathedralInnings: "59 all out (36.2 ov)",
            canterburyChase: "60/2 (14.3 ov)",
          },
          highlights: [
            
            "Vikram Arora 30* (59m, 32b)",
            "Kamran Raza 9 (run out)",
            
          ],
  
          
            scoreboardUrl: "http://ottawacricket.org/en/2006_scorecards/chg/2006.09.17-ChgPO-CCC-CCCCC.htm",
          
        },
];

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
  highestScore: "240*",     // was H.S
  hundreds: 17,          // was 100s
  fifties: 71,           // was 50s
  battingAverage: 36.95,        // was avg
  wickets: 203,
  bestBowling: "6/21",   // was best
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
  hundreds: 10,          // was 100s
  fifties: 51,           // was 50s
  battingAverage: 35.32,
  bowlingAverage: 11.89, // was avg
  economy: 3.62,
  wickets: 522,
  bestBowling: "9/27",   // was best
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
  highestScore: 196,     // was H.S
  hundreds: 6,          // was 100s
  fifties: 49,           // was 50s
  battingAverage: 28.83,        // was avg
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
    //headshot: AmeerImg,
    bio:
      "Left Arm Orthodox.",
    stats: {
      matches: 49,
      wickets:54,
      economy: 4.28,
      bowlingAverage: 18.56,
      bestBowling: "5/18"
    },
    awards: ["Wicket-Taker"],
    
  },
  {
    id: "p-Sujon",
    name: "Abdel Kader Sujon",
    role: "Bowler",
    //headshot: AmeerImg,
    bio:
      "Right Arm Off-Spin",
    stats: {
      matches: 23,
      fifties: 1,
      wickets:28,
      economy: 3.91,
      bowlingAverage: 15.79,

      bestBowling: "3/10"
    },
    awards: ["Miserly Bowler"],
    
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
  battingAverage: 31.44,
  bowlingAverage: 21.3,
  strikeRate: 89.01,
  economy: 4.76,
  wickets: 94,
  bestBowling: "5/38",
  fifties: 9,             // 50s
  hundreds: 3,            // 100s

    
},

    awards: ["OVCC T20 MVP (2025)"], 
    
  },
];
