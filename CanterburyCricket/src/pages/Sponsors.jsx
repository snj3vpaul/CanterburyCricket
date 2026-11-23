import React from "react";
import SponsorsAccordion from "../components/SponsorsAccordion/SponsorsAccordion";
import "./SponsorsPage.css";
import bgSvg from "../assets/LightStreaksBackground.png"; // make sure the relative path is correct


export default function Sponsors() {
  return (
    <div className="sponsors-page">
      {/* Background SVG */}
      <div
        className="sponsors-bg"
        style={{ backgroundImage: `url(${bgSvg})` }}
      ></div>

      {/* Accordion */}
      <div className="sponsors-content">
        <SponsorsAccordion />
      </div>

      
    </div>
  );
}
