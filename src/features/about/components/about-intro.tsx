import { aboutCopy } from '../data/about-content';
import styles from '../styles/about.module.css';

export function AboutIntro() {
  return (
    <div className={styles.intro} data-about-act="decompose">
      <div className={styles.introWash} aria-hidden="true" data-about-wash />
      <div className={styles.actLabel}>
        <span>01 / DESCOMPONER</span>
        <span>UNA IDENTIDAD EN TRANSFORMACIÓN</span>
      </div>
      <div className={styles.questionStage}>
        <p className={styles.introAnnotation}>UNA PREGUNTA ABIERTA</p>
        <h2 id="home-about-title" className={styles.question}>
          <span className={styles.visuallyHidden}>{aboutCopy.question}</span>
          <span className={styles.questionVisual} aria-hidden="true" data-about-question>
            <span className={styles.questionRow}>
              <span className={styles.fragment} data-about-fragment>¿QUÉ</span>
              <span className={`${styles.fragment} ${styles.fragmentSmall}`} data-about-fragment>ES</span>
            </span>
            <span className={`${styles.fragment} ${styles.fragmentCell}`} data-about-fragment>CÉLULA?</span>
          </span>
        </h2>
        <div className={styles.introFootnote}>
          <p>{aboutCopy.introduction}</p>
          <span className={styles.scrollNote}>SIGUE LA PREGUNTA <span aria-hidden="true">↓</span></span>
        </div>
      </div>
      <div className={styles.declarationStage}>
        <span className={styles.declarationIndex} aria-hidden="true">(01 — 03)</span>
        <h3 className={styles.declaration} data-about-declaration>
          <span className={styles.visuallyHidden}>{aboutCopy.declaration}</span>
          <span aria-hidden="true">NO SOMOS</span>
          <span aria-hidden="true">UNA SOLA <em>COSA.</em></span>
        </h3>
        <p className={styles.decomposeDescription}>{aboutCopy.decomposeDescription}</p>
        <p className={styles.pendingNotice}>{aboutCopy.pendingNotice}</p>
      </div>
    </div>
  );
}
