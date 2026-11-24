import { aboutIntroductionParagraphs } from '../data/about-content';
import styles from '../styles/about.module.css';

export function AboutIntro() {
  return (
    <div className={styles.intro} data-chromatic-intro>
      <div className={styles.introParagraph} data-introduction-copy>
        {aboutIntroductionParagraphs.map((paragraph, index) => (
          <p key={paragraph} data-introduction-paragraph className={index === 4 ? styles.introClosing : undefined}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
