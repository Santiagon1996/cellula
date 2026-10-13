'use client';

import { useRef } from 'react';
import { AboutIntro } from './about-intro';
import { AboutEcosystem } from './about-ecosystem';
import { AboutFinale } from './about-finale';
import { useAboutScroll } from '../hooks/use-about-scroll';
import styles from '../styles/about.module.css';

export function AboutSection() {
  const rootRef = useRef<HTMLElement>(null);
  useAboutScroll(rootRef);

  return (
    <section ref={rootRef} id="laboratorio" className={styles.section} aria-labelledby="home-about-title" data-about-section>
      <AboutIntro />
      <AboutEcosystem />
      <AboutFinale />
    </section>
  );
}
