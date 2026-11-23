import { Link } from "react-router-dom";
import React from "react";
import SponsorsAccordion from "../components/SponsorsAccordion/SponsorsAccordion";
import "./SponsorsPage.css";
import lightStreaks from "../assets/LightStreaksBackground.webp";


export default function Sponsors() {
  return (
    <div className="sponsors-page">
      {/* Background SVG */}
      <div
        className="sponsors-bg"
        style={{ backgroundImage: `url(${lightStreaks})` }}
      ></div>

      {/* Accordion */}
      <div className="sponsors-content">
        <SponsorsAccordion />
        <p className="sponsors-cta">
          Want to support Ottawa cricket? <Link to="/join?topic=sponsorship#get-in-touch">Become a sponsor →</Link>
        </p>
      </div>

      
    </div>
  );
}
