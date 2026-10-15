import { contactCopy, getContactActions } from '../data/contact-content';
import type { ContactChannels, ContactPanelContent } from '../types';
import styles from '../styles/contact.module.css';

export function ContactPanel({ panel, active, channels }: {
  panel: ContactPanelContent;
  active: boolean;
  channels: ContactChannels;
}) {
  const actions = getContactActions(panel.id, channels);
  return (
    <div
      role="tabpanel" id={`contact-panel-${panel.id}`} aria-labelledby={`contact-tab-${panel.id}`}
      aria-hidden={!active} inert={!active} tabIndex={0} className={styles.panel}
      data-contact-panel={panel.id} data-active={active}
    >
      <p className={styles.panelKicker} data-contact-reveal>{panel.kicker}</p>
      <h3 className={styles.panelTitle} data-contact-reveal>{panel.title}</h3>
      <p className={styles.panelDescription} data-contact-reveal>{panel.description}</p>
      <div className={styles.actions} data-contact-reveal>
        {actions.length ? actions.map((action) => (
          <a key={action.href} href={action.href} className={styles.contactLink}
            aria-label={action.external ? `${action.label} (abre una pestaña nueva)` : undefined}
            {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <span>{action.label}</span><span aria-hidden="true">↗</span>
          </a>
        )) : (
          <p className={styles.pending}>
            <span className={styles.pendingDot} aria-hidden="true" />
            {panel.id === 'conectemos' ? contactCopy.pendingSocials : contactCopy.pendingEmail}
          </p>
        )}
      </div>
    </div>
  );
}
