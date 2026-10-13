'use client';

import { useId, useRef, useState } from 'react';
import { aboutConcepts } from '../data/about-content';
import { useEcosystemMotion } from '../hooks/use-ecosystem-motion';
import type { AboutConceptId } from '../types';
import styles from '../styles/about.module.css';
import { AboutEcosystemNode } from './about-ecosystem-node';

export function AboutEcosystem() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<AboutConceptId>('crear');
  const id = useId();
  const headingId = `${id}-ecosystem-heading`;
  const panelId = `${id}-concept-panel`;
  const titleId = `${id}-concept-title`;
  const concept = aboutConcepts.find((item) => item.id === active) ?? aboutConcepts[0];

  useEcosystemMotion(rootRef, active);

  return (
    <section ref={rootRef} className={styles.ecosystem} aria-labelledby={headingId} data-about-act="connect">
      <header className={styles.ecosystemHeader}>
        <p className={`${styles.actLabel} font-mono font-normal`}>02 / CONECTAR</p>
        <h2 id={headingId} className={styles.ecosystemHeading}>Crear. Explorar.<br />Conectar.</h2>
        <p className={styles.ecosystemHint}>Elige una palabra y descubre cómo se relaciona con las demás.</p>
      </header>

      <div className={styles.organism} role="group" aria-label="Explora el ecosistema de Célula" data-about-organism>
        <svg className={styles.connectionSvg} viewBox="0 0 400 360" fill="none" aria-hidden="true" focusable="false">
          <path className={styles.connectionPath} data-about-connection="crear-explorar" d="M 100 115 C 150 72 220 70 295 95" />
          <path className={styles.connectionPath} data-about-connection="explorar-conectar" d="M 295 95 C 345 180 288 246 190 275" />
          <path className={styles.connectionPath} data-about-connection="conectar-crear" d="M 190 275 C 93 257 54 184 100 115" />
        </svg>
        {aboutConcepts.map((item) => (
          <AboutEcosystemNode key={item.id} concept={item} active={item.id === active} panelId={panelId} onSelect={setActive} />
        ))}
      </div>

      <div id={panelId} className={styles.ecosystemEditorial} role="region" aria-labelledby={titleId} data-about-editorial>
        <p className={`${styles.conceptNumber} font-mono font-normal`} aria-hidden="true">{concept.number} / {concept.label}</p>
        <h3 id={titleId} className={styles.conceptTitle}>{concept.title}</h3>
        <p className={styles.conceptDescription}>{concept.description}</p>
      </div>
    </section>
  );
}
