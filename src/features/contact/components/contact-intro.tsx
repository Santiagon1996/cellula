import { contactCopy } from '../data/contact-content';
import styles from '../styles/contact.module.css';

export function ContactIntro() {
  return (
    <header className={styles.intro}>
      <div className={styles.sectionLabel}>
        <span>{contactCopy.sectionLabel}</span>
        <span>{contactCopy.sectionNote}</span>
      </div>
      <h2 id="contact-title" className={styles.title}>
        <span className={styles.visuallyHidden}>{contactCopy.introTitle}</span>
        <span className={styles.titleLine} aria-hidden="true"><span data-contact-word>{contactCopy.introLines[0]}</span></span>
        <span className={`${styles.titleLine} ${styles.middleLine}`} aria-hidden="true">
          <span data-contact-word>{contactCopy.introLines[1]}</span><span className={styles.titleArrow}>↘</span>
        </span>
        <span className={styles.titleLine} aria-hidden="true"><span data-contact-word>{contactCopy.introLines[2]}</span></span>
      </h2>
      <div className={styles.introNote}>
        <span className={styles.connectionDot} aria-hidden="true" />
        <p>{contactCopy.narrative}</p>
        <span className={styles.noteIndex} aria-hidden="true">(01—03)</span>
      </div>
    </header>
  );
}
