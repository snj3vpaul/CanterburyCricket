import React from "react";
import SeasonTable from "../components/SeasonTable/SeasonTable";
import DivisionMatches from "../components/Matches/DivisionMatches";
import Captaincy2026 from "../components/Captaincy/Captaincy2026";

export default function Season() {
  return (
    <div className="season-page">
      {/* 2026 leadership announcement */}
      <Captaincy2026 />

      {/* 2026 season is underway — live fixtures & results from CricHeroes */}
      <DivisionMatches />

      <SeasonTable />
    </div>
  );
}