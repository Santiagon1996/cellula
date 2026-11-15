import { useId } from 'react';
import { aboutCopy } from '../data/about-content';
import styles from '../styles/about.module.css';

export function AboutIdentity() {
  const headingId = `${useId()}-identity-heading`;

  return (
    <section
      className={styles.identity}
      aria-labelledby={headingId}
      data-about-identity
      data-editorial-status="pending-validation"
    >
      <h2 id={headingId} className={styles.identityHeading}>{aboutCopy.definitionTitle}</h2>
      <p className={styles.identityParagraph}>{aboutCopy.decomposeDescription}</p>
      <p className={`${styles.identityParagraph} ${styles.identityParagraphSecondary}`}>
        {aboutCopy.connectDescription}
      </p>
    </section>
  );
}
