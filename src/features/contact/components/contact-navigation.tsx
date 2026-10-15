import { useRef, type KeyboardEvent } from 'react';
import { contactCopy, contactPanels } from '../data/contact-content';
import type { ContactPanelId } from '../types';
import styles from '../styles/contact.module.css';

export function ContactNavigation({ active, onSelect }: {
  active: ContactPanelId;
  onSelect: (id: ContactPanelId) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % contactPanels.length; break;
      case 'ArrowLeft': next = (index - 1 + contactPanels.length) % contactPanels.length; break;
      case 'Home': next = 0; break;
      case 'End': next = contactPanels.length - 1; break;
      default: return;
    }
    event.preventDefault();
    onSelect(contactPanels[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={contactCopy.navigationLabel} className={styles.navigation}>
      {contactPanels.map((panel, index) => (
        <button
          key={panel.id}
          ref={(element) => { tabRefs.current[index] = element; }}
          type="button" role="tab" id={`contact-tab-${panel.id}`}
          aria-controls={`contact-panel-${panel.id}`} aria-selected={active === panel.id}
          tabIndex={active === panel.id ? 0 : -1}
          onClick={() => onSelect(panel.id)} onKeyDown={(event) => navigate(event, index)}
          className={styles.tab}
        >
          <span className={styles.tabNumber} aria-hidden="true">{panel.index}</span>
          <span>{panel.label}</span><span className={styles.tabMark} aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
  );
}
