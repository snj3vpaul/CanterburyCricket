import { useState } from "react";
import image1 from "./Cha.png";
import image2 from "./RedSwan.jpeg";
import image3 from "./Akram.jpg";
import image4 from "./Varun.jpg";
import image5 from "./Aoun.jpeg";
import image6 from "./MMG.jpg";
import "./SponsorsAccordion.module.css";

const cards = [
  { header: "Chai Talks", image: image1, text: `Platinum Sponsor`, url: "https://www.chaitalks.ca" },
  { header: "Red Swan Pizza", image: image2, text: `Gold Sponsor`, url: "https://ottawa-stittsville.redswanpizza.ca/zgrid/proc/site/start.jsp" },
  { header: "Akram Syed", image: image3, text: `Gold Sponsor`, url: "https://www.coast2coastrealestateteam.ca/" },
  { header: "Varun Harish", image: image4, text: `Silver Sponsor`, url: "www.realtor.ca/agent/2224383/varun-harish-1439-woodroffe-avenue-unit-2-ottawa-ontario-k2g1w1" },
  { header: "Aoun Rizvi", image: image5, text: `Silver Sponsor`, url: "https://www.centum.ca/agent/aoun_rizvi" },
  { header: "Mumbai Masala Grill", image: image6, text: `Silver Sponsor`, url: "https://mumbaimasalagrill.ca/" },
];

export const Sponsors = () => {
  const [active, setActive] = useState(0);

  // Remove ": number" type annotation
  const handleToggle = (index) => setActive(index);

  return (
    <section>
  {cards.map((card, index) => {
    const isActive = active === index ? "active" : "";
    return (
      <a
        key={card.image}
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <article
          className={isActive}
          onClick={() => handleToggle(index)}
        >
          <img src={card.image} alt={card.header} />
          <div className="content">
            <span className="material-symbols-outlined">Our Believers</span>
            <div className="text-container">
              <h2>{card.header}</h2>
              <p>{card.text}</p>
            </div>
          </div>
        </article>
      </a>
    );
  })}
</section>

  );
};
