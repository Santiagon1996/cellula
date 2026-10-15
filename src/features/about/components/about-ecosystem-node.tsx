'use client';

import type { AboutConceptId } from '../types';
import styles from '../styles/about.module.css';

type AboutEcosystemNodeProps = {
  concept: { id: AboutConceptId; label: string; number: string };
  active: boolean;
  panelId: string;
  onSelect: (id: AboutConceptId) => void;
};

export function AboutEcosystemNode({ concept, active, panelId, onSelect }: AboutEcosystemNodeProps) {
  return (
    <button
      type="button"
      className={styles.node}
      data-about-node={concept.id}
      aria-pressed={active}
      aria-controls={panelId}
      onClick={() => onSelect(concept.id)}
    >
      <span className={styles.nodeShape} data-about-shape aria-hidden="true" />
      <span className={`${styles.nodeNumber} font-mono font-normal`} aria-hidden="true">{concept.number}</span>
      <span className={`${styles.nodeLabel} font-medium`}>{concept.label}</span>
    </button>
  );
}
