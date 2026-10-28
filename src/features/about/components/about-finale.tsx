import { useId } from 'react';
import { aboutCopy, aboutMaterial } from '../data/about-content';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import styles from '../styles/about.module.css';
import { AboutMaterial } from './about-material';

export function AboutFinale() {
  const headingId = `${useId()}-finale-heading`;
  const hasMaterial = aboutMaterial.images.some((image) => image.src);

  return (
    <section className={styles.finale} aria-labelledby={headingId} data-about-act="transform" data-material-ready={hasMaterial}>
      <div className={styles.actLabel}>
        <span>{aboutCopy.finaleActLabel}</span>
        <span>{aboutCopy.finaleLabel}</span>
      </div>
      <div className={styles.finaleComposition}>
        {hasMaterial ? <AboutMaterial images={aboutMaterial.images} /> : <div className={styles.finaleOrganism} aria-hidden="true">
          <svg className={styles.finaleConnections} viewBox="0 0 400 360" fill="none">
            <path data-about-final-connection d="M 95 100 C 160 40 260 40 310 110 M 310 110 C 310 210 290 280 210 275 M 210 275 C 95 275 40 200 95 100" />
          </svg>
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalOrbit} data-about-orbit />
          <span className={styles.organismCaption}>{aboutCopy.organismCaption}</span>
        </div>}
        <div className={styles.finaleEditorial}>
          <p className={styles.finaleKicker}>{aboutCopy.finaleKicker}</p>
          <h3 id={headingId} className={styles.finaleStatement} data-about-final-statement>
            <span className={styles.visuallyHidden}>{aboutCopy.finale}</span>
            {aboutCopy.finaleLines.map((line, index) => (
              <span key={line} aria-hidden="true">
                {index === aboutCopy.finaleLines.length - 1 ? <em>{line}</em> : line}
              </span>
            ))}
          </h3>
          <p className={styles.finaleDescription} data-editorial-status="pending-validation">{aboutCopy.finaleSupport}</p>
        </div>
      </div>
      <a className={styles.exhibitionLink} href="#exposiciones">
        <span>{aboutCopy.exhibitionLinkLabel}</span>
        <span><ArrowIcon direction="down-right" /></span>
      </a>
    </section>
  );
}
