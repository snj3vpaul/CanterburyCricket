import React, { useState } from "react";
import styles from "./SponsorsAccordion.module.css";

export default function SponsorsAccordion() {
  const [active, setActive] = useState(null);

  const sponsors = [
    { tier: "Platinum", names: ["Sponsor A", "Sponsor B"] },
    { tier: "Gold", names: ["Sponsor C", "Sponsor D"] },
    { tier: "Silver", names: ["Sponsor E", "Sponsor F", "Sponsor G"] },
  ];

  return (
    <div className={styles.accordion}>
      {sponsors.map((sponsor, index) => (
        <div key={index} className={styles.item}>
          <button
            className={styles.header}
            onClick={() => setActive(active === index ? null : index)}
          >
            {sponsor.tier} Sponsors
          </button>
          {active === index && (
            <ul className={styles.content}>
              {sponsor.names.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
