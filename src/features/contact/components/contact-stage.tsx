import { contactCopy, contactPanels } from '../data/contact-content';
import type { ContactChannels, ContactPanelId } from '../types';
import { ContactNavigation } from './contact-navigation';
import { ContactPanel } from './contact-panel';
import styles from '../styles/contact.module.css';

export function ContactStage({ active, onSelect, channels }: {
  active: ContactPanelId;
  onSelect: (id: ContactPanelId) => void;
  channels: ContactChannels;
}) {
  const current = contactPanels.find((panel) => panel.id === active)!;
  return (
    <div className={styles.module}>
      <ContactNavigation active={active} onSelect={onSelect} />
      <div className={styles.stage} data-contact-stage data-mode={active}>
        <div className={styles.stageLabel} aria-hidden="true">
          <span>{contactCopy.stageLabel}</span><span>{current.index} / 03</span>
        </div>
        <div className={styles.artworkFrame} aria-hidden="true">
          <div className={styles.artwork} data-contact-art>
            <span className={styles.cellOne} data-contact-orbit />
            <span className={styles.cellTwo} data-contact-orbit />
            <span className={styles.cellThree} data-contact-orbit />
            <span className={styles.artCross}>+</span>
            <span className={styles.artCaption}>{contactCopy.artCaption}</span>
          </div>
        </div>
        <div className={styles.panelWindow}>
          {contactPanels.map((panel) => <ContactPanel key={panel.id} panel={panel} active={panel.id === active} channels={channels} />)}
        </div>
        <div className={styles.stageBaseline} aria-hidden="true">
          <span>{contactCopy.stageBaseline}</span><span>↗</span>
        </div>
      </div>
      <p className={styles.moduleNote}>{contactCopy.moduleNote}</p>
    </div>
  );
}
