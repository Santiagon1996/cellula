'use client';

import { useId, useRef } from 'react';
import type { Laboratory, LaboratorySelection } from '../types';
import { laboratoryCopy } from '../data/laboratory-copy';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import { LaboratoryCircularCard } from './laboratory-circular-card';
import { useCircularCarousel } from './use-circular-carousel';

type Props = {
  laboratories: readonly Laboratory[];
  blocked: boolean;
  onSelect: (selection: LaboratorySelection) => void;
};

/** One DOM image per study; the manual movement engine is shared by both axes. */
export function LaboratoryCircularCarousel({ laboratories, blocked, onSelect }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const { activeId, orientation, navigate, select } = useCircularCarousel({ rootRef, viewportRef, laboratories, blocked, onSelect });
  const activeIndex = Math.max(0, laboratories.findIndex((laboratory) => laboratory.id === activeId));

  if (!laboratories.length) return <p className="laboratory-circular-empty font-mono font-normal">{laboratoryCopy.empty}</p>;

  return (
    <div
      ref={rootRef}
      className="laboratory-circular"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Estudios del laboratorio"
      data-orientation={orientation}
      data-blocked={blocked}
    >
      <p id={`${id}-instructions`} className="laboratory-circular__instructions font-mono font-normal">
        <span className="laboratory-circular__hint-mobile">{laboratoryCopy.mobileHint}</span>
        <span className="laboratory-circular__hint-desktop">{laboratoryCopy.desktopHint}</span>
      </p>
      <div
        ref={viewportRef}
        id={`${id}-viewport`}
        className="laboratory-circular__viewport"
        role="group"
        tabIndex={0}
        aria-label="Galería de laboratorios"
        aria-describedby={`${id}-instructions`}
        data-dragging="false"
      >
        {laboratories.map((laboratory, index) => (
          <LaboratoryCircularCard
            key={laboratory.id}
            laboratory={laboratory}
            index={index}
            total={laboratories.length}
            active={laboratory.id === activeId}
            blocked={blocked}
            onSelect={select}
          />
        ))}
      </div>
      <div className="laboratory-circular__controls font-mono font-medium">
        <p className="laboratory-circular__position" aria-live="polite" aria-atomic="true">
          <span className="laboratory-circular__count">{String(activeIndex + 1).padStart(2, '0')} / {String(laboratories.length).padStart(2, '0')}</span>
          <span className="laboratory-circular__active-title">{laboratories[activeIndex].title}</span>
        </p>
        <div className="laboratory-circular__actions">
          <button type="button" aria-label="Laboratorio anterior" aria-controls={`${id}-viewport`} disabled={blocked || laboratories.length < 2} onClick={() => navigate(-1)}>
            <span className="laboratory-circular__arrow-vertical"><ArrowIcon direction="up" /></span><span className="laboratory-circular__arrow-horizontal"><ArrowIcon direction="left" /></span>
          </button>
          <button type="button" aria-label="Laboratorio siguiente" aria-controls={`${id}-viewport`} disabled={blocked || laboratories.length < 2} onClick={() => navigate(1)}>
            <span className="laboratory-circular__arrow-vertical"><ArrowIcon direction="down" /></span><span className="laboratory-circular__arrow-horizontal"><ArrowIcon direction="right" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
