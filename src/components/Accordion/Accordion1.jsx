import { useState } from "react";
import "./styles.css";

export const Accordion1 = ({ items }) => {
  const [active, setActive] = useState(0);

  const handleToggle = (index) => setActive(index);

  return (
    <section className=" page image-accordion-page">
      <div
        className="bg"
        style={{ backgroundImage: `url(${items[active].image}` }}
      />
      <div className="image-accordion">
        {items.map((item, index) => {
          const isActive = active === index ? "active" : "";
          return (
            <div
              key={item.image}
              className={`image-accordion-item ${isActive}`}
              onClick={() => handleToggle(index)}
            >
              <img src={item.image} />
              <div className="content">
                <span className="material-symbols-outlined">photo_camera</span>
                <div>
                  <h2>{item.header}</h2>
                  <p>{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
