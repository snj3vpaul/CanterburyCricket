import React from "react";
import SeasonTable from "../components/SeasonTable/SeasonTable";
import { Card1 } from "../components/FlipCards/overflipcards";

export default function Season() {
  return (
    <div className="season-page">
      <h1>Season Highlights</h1>
      <SeasonTable />
    </div>
  );
}

