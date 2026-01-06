import React from "react";
import {Sponsors as SponsorsAccordion} from "../components/SponsorsAccordion/SponsorsAccordion";
import "./Sponsors.css";
import bgSvg from "../assets/CGPT.png"; // make sure the relative path is correct


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
