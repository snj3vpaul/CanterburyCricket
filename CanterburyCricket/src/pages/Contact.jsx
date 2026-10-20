import { Link } from "react-router-dom";
import GetInTouch from "../components/GetInTouch/GetInTouch";
import { CLUB } from "../seo/config";
import styles from "./Contact.module.css";

const enquirySteps = [
  {
    number: "01",
    title: "Introduce yourself",
    description: "Tell us whether you're new to cricket, returning to the game or already playing in a league.",
  },
  {
    number: "02",
    title: "Share what you're looking for",
    description: "Mention your preferred format, general availability and any questions about the club.",
  },
  {
    number: "03",
    title: "Confirm the next step",
    description: "Ask about current opportunities, eligibility and arrangements before attending a session.",
  },
];

export default function Contact() {
  return (
    <main id="top" className={styles.contact}>
      <section className={styles.intro} aria-labelledby="contact-heading">
        <div className={`${styles.shell} ${styles.introLayout}`}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>CANTERBURY CRICKET CLUB · OTTAWA</p>
            <h1 id="contact-heading">
              Want to play cricket<br />
              <span>in Ottawa?</span>
            </h1>
            <p className={styles.lead}>
              Whether you're looking for a cricket club in Ottawa  or the suburban areas surrounding Ottaa (Nepean, Barrhaven,Riverside South, Orleans, Kanata, Sttisville) or simply
              want to learn about Canterbury, we'd be happy to hear from you.
              Tell us a little about your cricket experience and what you'd
              like to know.
            </p>
            <p className={styles.disclaimer}>
              Sending an enquiry is not an automatic registration or a
              guarantee of a place in a team. Please confirm current
              opportunities and arrangements directly with the club.
            </p>
            <nav className={styles.actions} aria-label="Joining information">
              <a className={styles.primaryAction} href="#contact-form">
                Send an enquiry <span aria-hidden="true">→</span>
              </a>
              <Link className={styles.secondaryAction} to="/guides/join-cricket-club-ottawa">
                How joining works <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </div>

          <aside className={styles.steps} aria-labelledby="steps-heading">
            <p className={styles.stepsEyebrow}>BEFORE YOU GET IN TOUCH</p>
            <h2 id="steps-heading">A good first message</h2>
            <ol className={styles.stepList}>
              {enquirySteps.map((step) => (
                <li key={step.number}>
                  <span className={styles.stepNumber} aria-hidden="true">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section id="contact-form" className={styles.formSection} aria-label="Send Canterbury a message">
        <div className={styles.shell}>
          <GetInTouch />
        </div>
      </section>

      <section className={styles.socialSection} aria-labelledby="social-heading">
        <div className={`${styles.shell} ${styles.socialLayout}`}>
          <div>
            <h2 id="social-heading">Prefer social media?</h2>
            <p>You can also contact Canterbury through its official accounts.</p>
          </div>
          <div className={styles.socialLinks}>
            <a href={CLUB.instagram} target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span></a>
            <a href={CLUB.facebook} target="_blank" rel="noopener noreferrer">Facebook <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
    </main>
  );
}
