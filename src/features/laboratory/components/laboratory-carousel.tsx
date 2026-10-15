'use client';

import { useId, useRef, useState } from 'react';
import type { Laboratory, LaboratorySelection } from '../types';
import { LaboratoryCard } from './laboratory-card';
import { useLaboratoryCarousel } from './use-laboratory-carousel';

type LaboratoryCarouselProps = {
  laboratories: readonly Laboratory[];
  paused: boolean;
  onSelect: (selection: LaboratorySelection) => void;
  speed?: number;
};

export function LaboratoryCarousel({ laboratories, paused, onSelect, speed = 28 }: LaboratoryCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [userPaused, setUserPaused] = useState(false);
  const id = useId();
  const { select, navigate, reducedMotion } = useLaboratoryCarousel({ rootRef, viewportRef, laboratories, paused, userPaused, speed, onSelect });
  const repetitions = laboratories.length ? Math.max(1, Math.ceil(3 / laboratories.length)) : 0;
  const motionPaused = userPaused || reducedMotion;
  const pauseLabel = reducedMotion ? 'Movimiento reducido activo' : userPaused ? 'Reanudar movimiento' : 'Pausar movimiento';

  if (!laboratories.length) return <p className="laboratory-empty">Los estudios del laboratorio estar&aacute;n disponibles pronto.</p>;

  return (
    <div ref={rootRef} role="region" className="laboratory-carousel" aria-label="Estudios del laboratorio" aria-roledescription="carrusel" data-paused={paused || motionPaused}>
      <div ref={viewportRef} role="group" id={`${id}-viewport`} className="laboratory-carousel__viewport" tabIndex={0} aria-label="Galería de laboratorios" data-dragging="false">
        {Array.from({ length: repetitions }, (_value, repetition) => laboratories.map((laboratory, index) => (
          <LaboratoryCard key={`${repetition}-${laboratory.id}`} laboratory={laboratory} index={index} copy={repetition > 0} onSelect={select} />
        )))}
      </div>
      <div className="laboratory-carousel__controls">
        <span className="font-mono font-normal">{String(laboratories.length).padStart(2, '0')} / ESTUDIOS</span>
        <div className="laboratory-carousel__actions">
          <button type="button" aria-label="Laboratorio anterior" aria-controls={`${id}-viewport`} title="Laboratorio anterior" disabled={paused} onClick={() => navigate(-1)}>&#8593;</button>
          <button type="button" aria-label={pauseLabel} aria-pressed={motionPaused} title={pauseLabel} disabled={paused || reducedMotion} className="laboratory-carousel__pause" onClick={() => setUserPaused((value) => !value)}>{motionPaused ? <span aria-hidden="true">&#9654;</span> : <span aria-hidden="true">&#9208;</span>}</button>
          <button type="button" aria-label="Laboratorio siguiente" aria-controls={`${id}-viewport`} title="Laboratorio siguiente" disabled={paused} onClick={() => navigate(1)}>&#8595;</button>
        </div>
      </div>
    </div>
  );
}
