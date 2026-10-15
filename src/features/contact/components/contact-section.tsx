'use client';

import { useRef, useState } from 'react';
import { contactChannels } from '../data/contact-content';
import { useContactMotion } from '../hooks/use-contact-motion';
import type { ContactChannels, ContactPanelId } from '../types';
import { ContactIntro } from './contact-intro';
import { ContactStage } from './contact-stage';
import { ContactFooter } from './contact-footer';
import styles from '../styles/contact.module.css';

export function ContactSection({ channels = contactChannels }: { channels?: ContactChannels }) {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<ContactPanelId>('conversemos');
  useContactMotion(rootRef, active);

  return (
    <section ref={rootRef} id="contacto" className={styles.section} aria-labelledby="contact-title" data-contact-section>
      <div className={styles.inner}>
        <ContactIntro />
        <ContactStage active={active} onSelect={setActive} channels={channels} />
        <ContactFooter />
      </div>
    </section>
  );
}
