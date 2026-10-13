import { aboutCopy } from '../data/about-content';
import styles from '../styles/about.module.css';

export function AboutFinale() {
  return (
    <div className={styles.finale} data-about-act="transform">
      <div className={styles.actLabel}>
        <span>03 / TRANSFORMAR</span>
        <span>LO QUE PUEDE SER</span>
      </div>
      <div className={styles.finaleComposition}>
        <div className={styles.finaleOrganism} aria-hidden="true">
          <svg className={styles.finaleConnections} viewBox="0 0 400 360" fill="none">
            <path data-about-final-connection d="M 95 100 C 160 40 260 40 310 110 M 310 110 C 310 210 290 280 210 275 M 210 275 C 95 275 40 200 95 100" />
          </svg>
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalShape} data-about-converge />
          <span className={styles.finalOrbit} data-about-orbit />
          <span className={styles.organismCaption}>TRES IMPULSOS / UN ENCUENTRO</span>
        </div>
        <div className={styles.finaleEditorial}>
          <p className={styles.finaleKicker}>LA FORMA NUNCA ES DEFINITIVA</p>
          <h3 className={styles.finaleStatement} data-about-final-statement>
            <span className={styles.visuallyHidden}>{aboutCopy.finale}</span>
            <span aria-hidden="true">LAS IDEAS</span>
            <span aria-hidden="true">CAMBIAN CUANDO</span>
            <span aria-hidden="true">SE <em>ENCUENTRAN.</em></span>
          </h3>
          <p className={styles.finaleDescription}>{aboutCopy.transformDescription}</p>
        </div>
      </div>
      <a className={styles.exhibitionLink} href="#exposiciones">
        <span>{aboutCopy.exhibitionLinkLabel}</span>
        <span aria-hidden="true">↘</span>
      </a>
    </div>
  );
}
