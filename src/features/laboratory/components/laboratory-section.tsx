'use client';

import { useCallback, useState } from 'react';
import { demoLaboratories } from '../data/laboratories';
import type { Laboratory, LaboratorySelection } from '../types';
import { LaboratoryCarousel } from './laboratory-carousel';
import { LaboratoryDetail } from './laboratory-detail';

export function LaboratorySection({ laboratories = demoLaboratories }: { laboratories?: readonly Laboratory[] }) {
  const [selection, setSelection] = useState<LaboratorySelection | null>(null);
  const select = useCallback((next: LaboratorySelection) => setSelection((current) => current ?? next), []);
  const close = useCallback(() => setSelection(null), []);
  const temporary = laboratories.length > 0 && laboratories.every((laboratory) => laboratory.temporary);

  return (
    <section id="laboratorios" className="laboratory-section" aria-labelledby="laboratory-heading">
      <header className="laboratory-section__header">
        <div>
          <p className="laboratory-section__eyebrow font-mono font-normal">LAB / {temporary ? 'MUESTRAS TEMPORALES' : 'ESTUDIOS ABIERTOS'}</p>
          <h2 id="laboratory-heading">Laboratorio</h2>
        </div>
        <p className="laboratory-section__intro">Forma, materia y nuevas maneras de crear.</p>
      </header>
      <div className="laboratory-section__body">
        <div className="laboratory-section__statement">
          <span className="laboratory-section__mark" aria-hidden="true" />
          <h3>Procesos abiertos.<br />Ideas en movimiento.</h3>
          <p>Un espacio para hacer preguntas y explorar lo que todav&iacute;a no tiene forma.</p>
        </div>
        <LaboratoryCarousel laboratories={laboratories} paused={selection !== null} onSelect={select} />
      </div>
      {selection && <LaboratoryDetail selection={selection} onClosed={close} />}
    </section>
  );
}
