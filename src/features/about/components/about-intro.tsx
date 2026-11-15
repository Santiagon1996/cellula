import { aboutCopy } from '../data/about-content';
import styles from '../styles/about.module.css';

export function AboutIntro() {
  return (
    <div className={styles.intro} data-chromatic-intro>
      <p className={styles.introParagraph} data-introduction-copy>{aboutCopy.introduction}</p>
    </div>
  );
}
