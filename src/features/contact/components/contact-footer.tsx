import { contactCopy } from '../data/contact-content';
import styles from '../styles/contact.module.css';

export function ContactFooter() {
  return (
    <div className={styles.finale} data-contact-finale>
      <span className={styles.finaleIndex}>{contactCopy.finaleIndex}</span>
      <p className={styles.finaleStatement}>{contactCopy.finaleLines[0]}<br />{contactCopy.finaleLines[1]} <em>{contactCopy.finaleEmphasis}</em></p>
      <div className={styles.finaleBottom}>
        <p>{contactCopy.finaleDescription[0]}<br />{contactCopy.finaleDescription[1]}</p>
        <a href="#inicio" className={styles.backToTop}><span>{contactCopy.backToTop}</span><span aria-hidden="true">↑</span></a>
      </div>
    </div>
  );
}
