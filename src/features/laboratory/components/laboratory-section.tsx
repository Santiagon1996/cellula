'use client';

import { useCallback, useState } from 'react';
import { demoLaboratories } from '../data/laboratories';
import { laboratoryCopy } from '../data/laboratory-copy';
import type { Laboratory, LaboratorySelection } from '../types';
import { LaboratoryCircularCarousel } from './laboratory-circular-carousel';
import { LaboratoryDetail } from './laboratory-detail';

export function LaboratorySection({ laboratories = demoLaboratories }: { laboratories?: readonly Laboratory[] }) {
  const [selection, setSelection] = useState<LaboratorySelection | null>(null);
  const select = useCallback((next: LaboratorySelection) => setSelection((current) => current ?? next), []);
  const close = useCallback(() => setSelection(null), []);
  const temporary = laboratories.length > 0 && laboratories.every((laboratory) => laboratory.temporary);

  return (
    <section id="laboratorios" className="laboratory-section laboratory-section--circular" aria-labelledby="laboratory-heading">
      <header className="laboratory-section__header">
        <div>
          <p className="laboratory-section__eyebrow font-mono font-normal">LAB / {temporary ? 'MUESTRAS TEMPORALES' : 'ESTUDIOS ABIERTOS'}</p>
          <h2 id="laboratory-heading">{laboratoryCopy.title}</h2>
        </div>
        <p className="laboratory-section__intro font-mono font-normal">{laboratoryCopy.description}</p>
      </header>
      <div className="laboratory-section__body">
        <div className="laboratory-section__statement">
          <span className="laboratory-section__mark" aria-hidden="true" />
          <h3>{laboratoryCopy.statement[0]}<br />{laboratoryCopy.statement[1]}</h3>
          <p className="font-mono font-normal">{laboratoryCopy.invitation}</p>
        </div>
        <LaboratoryCircularCarousel laboratories={laboratories} blocked={selection !== null} onSelect={select} />
      </div>
      {selection && <LaboratoryDetail selection={selection} onClosed={close} />}
    </section>
  );
}
