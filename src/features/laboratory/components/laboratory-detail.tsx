'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LaboratorySelection } from '../types';
import { useLaboratoryDetail } from './use-laboratory-detail';

type LaboratoryDetailProps = {
  selection: LaboratorySelection;
  /** The source, page lock and focus are restored before this callback. */
  onClosed: () => void;
};

export function LaboratoryDetail({ selection, onClosed }: LaboratoryDetailProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const close = useLaboratoryDetail({ selection, onClosed, rootRef, coverRef, closeRef });
  const laboratory = selection.laboratory;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={rootRef}
      className="laboratory-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-lab-detail
      data-phase="opening"
    >
      <button
        ref={closeRef}
        type="button"
        className="laboratory-detail__close font-mono font-medium"
        aria-label="Cerrar laboratorio"
        title="Cerrar laboratorio"
        onClick={close}
      >
        <span aria-hidden="true">&#215;</span>
        CERRAR
      </button>

      <header className="laboratory-detail__hero">
        <div
          ref={coverRef}
          className="laboratory-detail__cover"
          data-lab-detail-cover
          data-flip-id={`laboratory-${laboratory.id}`}
        >
          <Image
            {...laboratory.coverImage}
            alt={laboratory.coverImage.alt}
            className="laboratory-detail__cover-image"
            sizes="100vw"
            draggable={false}
            loading="eager"
          />
        </div>
        <div className="laboratory-detail__hero-editorial" data-lab-editorial>
          <p className="laboratory-detail__category font-mono font-normal">{laboratory.category}</p>
          <h2 id={titleId}>{laboratory.title}</h2>
          <p className="laboratory-detail__standfirst">{laboratory.shortDescription}</p>
          {laboratory.temporary && <p className="laboratory-detail__temporary font-mono font-normal">ESTUDIO TEMPORAL</p>}
        </div>
      </header>

      <div className="laboratory-detail__editorial" data-lab-editorial>
        <section className="laboratory-detail__introduction" aria-label="Sobre el laboratorio">
          <p className="laboratory-detail__description">{laboratory.description}</p>
          {(laboratory.year || laboratory.credits?.length) && (
            <dl className="laboratory-detail__credits font-mono font-normal">
              {laboratory.year && <div><dt>A&Ntilde;O</dt><dd>{laboratory.year}</dd></div>}
              {laboratory.credits?.length ? <div><dt>CR&Eacute;DITOS</dt><dd>{laboratory.credits.map((credit) => <span key={credit}>{credit}</span>)}</dd></div> : null}
            </dl>
          )}
        </section>

        {!!laboratory.gallery.length && (
          <section className="laboratory-detail__gallery" aria-label="Galeria del laboratorio">
            {laboratory.gallery.map((image, index) => (
              <figure key={`${image.src}-${index}`}>
                <Image {...image} alt={image.alt} className="laboratory-detail__gallery-image" sizes="(max-width: 700px) 100vw, 90vw" />
                <figcaption className="font-mono font-normal"><span>{String(index + 1).padStart(2, '0')}</span>{image.alt}</figcaption>
              </figure>
            ))}
          </section>
        )}
        <footer className="laboratory-detail__footer font-mono font-normal">
          <span>C&Eacute;LULA / LABORATORIO</span>
          <span>{laboratory.category}</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
