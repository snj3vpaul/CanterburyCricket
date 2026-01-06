import React from "react";
import styles from "./VideoHero.module.css";
import CanterburyIntro from "../../assets/CanterburyIntro.mp4"; // adjust path

export default function VideoHero() {
  return (
    <section className={styles.hero} style={{ marginTop: "72px" }}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        src={CanterburyIntro}
      />
      <div className={styles.overlay}>
        <div className={styles.text}>
          <h1>Canterbury Cricket Club</h1>
          <p>Ottawa · Passion · Community</p>
        </div>
      </div>
    </section>
  );
}
