import { aboutCopy, aboutValues } from '../data/about-content';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import styles from '../styles/about.module.css';
import { AboutWarpTitle } from './warp-text/about-warp-title';

export function AboutIntro() {
  return (
    <div className={styles.intro} data-about-act="decompose" data-chromatic-intro>
      <div className={styles.introWash} aria-hidden="true" data-about-wash />
      <div className={styles.actLabel}>
        <span>{aboutCopy.introActLabel}</span>
        <span>{aboutCopy.introLabel}</span>
      </div>
      <div className={styles.questionStage}>
        <p className={styles.introAnnotation}>{aboutCopy.introAnnotation}</p>
        <AboutWarpTitle id="home-about-title" className={styles.question} text={aboutCopy.question} />
        <div className={styles.introFootnote}>
          <p>{aboutCopy.connectDescription}</p>
          <span className={styles.scrollNote}>{aboutCopy.scrollLabel} <span><ArrowIcon direction="down" /></span></span>
        </div>
      </div>
      <div className={styles.declarationStage}>
        <span className={styles.declarationIndex} aria-hidden="true">(01 — 03)</span>
        <h3 className={styles.declaration} data-about-declaration>
          <span className={styles.visuallyHidden}>{aboutCopy.declaration}</span>
          {aboutCopy.declarationLines.map((line, index) => (
            <span key={line} aria-hidden="true">{index ? <em>{line}</em> : line}</span>
          ))}
        </h3>
        <p className={styles.decomposeDescription}>{aboutCopy.decomposeDescription}</p>
        <div className={styles.values}>
          <p className={styles.valuesLabel}>{aboutCopy.valuesLabel}</p>
          <ul className={styles.valuesList} aria-label={aboutCopy.valuesAriaLabel}>
            {aboutValues.map((value) => <li key={value}>{value}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
