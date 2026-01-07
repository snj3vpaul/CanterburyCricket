import { useState } from "react";
import styles from "./SponsorsAccordion.module.css";

import image1 from "./Cha.png";
import image2 from "./RedSwan.jpeg";
import image3 from "./Akram.jpg";
import image4 from "./Varun.jpg";
import image5 from "./Aoun.jpeg";
import image6 from "./MMG.jpg";

const withHttps = (url) =>
  url?.startsWith("http://") || url?.startsWith("https://")
    ? url
    : `https://${url}`;

const cards = [
  { header: "Chai Talks", image: image1, text: "Platinum Sponsor", url: "https://www.chaitalks.ca" },
  { header: "Red Swan Pizza", image: image2, text: "Gold Sponsor", url: "https://ottawa-stittsville.redswanpizza.ca/zgrid/proc/site/start.jsp" },
  { header: "Akram Syed", image: image3, text: "Gold Sponsor", url: "https://www.coast2coastrealestateteam.ca/" },
  { header: "Varun Harish", image: image4, text: "Silver Sponsor", url: "www.realtor.ca/agent/2224383/varun-harish-1439-woodroffe-avenue-unit-2-ottawa-ontario-k2g1w1" },
  { header: "Aoun Rizvi", image: image5, text: "Silver Sponsor", url: "https://www.centum.ca/agent/aoun_rizvi" },
  { header: "Mumbai Masala Grill", image: image6, text: "Silver Sponsor", url: "https://mumbaimasalagrill.ca/" },
];

export default function SponsorsAccordion() {
  const [active, setActive] = useState(0);

  return (
    <section className={styles.section}>
  {cards.map((card, index) => {
    const isActive = active === index;

    return (
      <article
        key={card.header}
        className={`${styles.card} ${isActive ? styles.active : ""}`}
        onClick={() => setActive(index)}
      >
        <div className={styles.media}>
          <img className={styles.image} src={card.image} alt={card.header} />
        </div>

        <div className={styles.body}>
          <h3 className={styles.thankYou}>Thank You</h3>
          <h2 className={styles.title} title={card.header}>
            {card.header}
          </h2>

          {/* Show sponsor tier always, OR only when active */}
          <p className={styles.subtitle}>{card.text}</p>

          <a
            className={styles.link}
            href={withHttps(card.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Visit Sponsor <span aria-hidden>→</span>
          </a>
        </div>
      </article>
    );
  })}
</section>

  );
}
