import React from "react";
import styles from "./VideoHero.module.css";

export default function VideoHero() {
  return (
    <section className={styles.hero}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        src="/assets/CanterburyIntro.mp4"
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
