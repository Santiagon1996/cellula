'use client';

import Image from 'next/image';
import { useCallback, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Laboratory, LaboratorySelection } from '../types';
import { laboratoryViews } from '../data/laboratory-views';
import { laboratoryCopy } from '../data/laboratory-copy';
import { useImageWheel } from './use-image-wheel';
import styles from '../styles/image-wheel.module.css';

type Props = { laboratories: readonly Laboratory[]; blocked: boolean; onSelect: (selection: LaboratorySelection) => void };

export function LaboratoryImageWheel({ laboratories, blocked, onSelect }: Props) {
  const views = useMemo(() => laboratoryViews(laboratories), [laboratories]);
  const [front, setFront] = useState(0);
  const [exploring, setExploring] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null), sceneRef = useRef<HTMLDivElement>(null);
  const activate = useCallback((index: number, source: HTMLElement, trigger: HTMLElement) => {
    onSelect({ laboratory: views[index].laboratory, source, trigger });
  }, [views, onSelect]);
  const { move, select } = useImageWheel({ rootRef, sceneRef, views, exploring, blocked,
    onFront: setFront, onActivate: activate });
  const id = useId();
  const navigate = (index: number, focus = false) => {
    if (!views.length || blocked) return;
    const next = ((index % views.length) + views.length) % views.length;
    move(next);
    if (focus) rootRef.current?.querySelectorAll('button')[next]?.focus({ preventScroll: true });
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key === 'Escape') { setExploring(false); return; }
    if (event.key in direction || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      navigate(event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : front + direction[event.key], true);
    }
  };

  return (
    <section className={styles.wheel} aria-label="Rueda espacial de Laboratory" data-image-wheel>
      <header className={styles.header}>
        <p className={styles.kicker}>LABORATORY / ARCHIVO VISUAL</p>
        <h3>IMÁGENES<br />EN ÓRBITA.</h3>
        <p id={`${id}-hint`} className={styles.hint}>
          <span className={styles.desktopHint}>El cursor hace girar la rueda. El centro es una pausa.</span>
          <span className={styles.mobileHint}>{exploring ? 'Exploración activa: arrastra arriba o abajo. Sal con el botón, Escape o deslizando por los márgenes.' : 'La página se desplaza con normalidad. Activa «Explorar rueda» para girarla con el dedo.'}</span>
        </p>
      </header>
      {views.length ? <>
        <div className={styles.frame}>
          <div ref={rootRef} className={styles.clip} role="group" tabIndex={0} id={`${id}-wheel`}
            aria-label="Explorar la rueda de imágenes" aria-describedby={`${id}-hint`} onKeyDown={key}
            data-wheel-viewport data-exploring={exploring} data-blocked={blocked}>
            <div ref={sceneRef} className={styles.scene} data-wheel-scene>
              <ul className={styles.ring} role="list" data-wheel-ring>
                {views.map((view, index) => (
                  <li key={view.key} className={styles.card} data-wheel-card data-view-key={view.key} data-lab-id={view.laboratory.id}
                    style={{ '--wheel-ratio': view.image.width / view.image.height } as CSSProperties}>
                    <button type="button" aria-current={front === index ? 'true' : undefined}
                      aria-disabled={blocked || undefined}
                      aria-label={`${front === index ? 'Explorar' : 'Acercar'} ${view.laboratory.title}, vista ${view.number}`}
                      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) move(index); }}
                      onClick={event => select(index, event.currentTarget)}>
                      <span className={styles.media} data-wheel-media data-lab-media
                        data-flip-id={front === index ? `laboratory-${view.laboratory.id}` : `wheel-${view.key}`}>
                        <Image src={view.image.src} alt={view.image.alt} fill sizes="(max-width: 767px) 65vw, 380px" draggable={false} />
                      </span>
                      <span className={styles.caption}><span>{view.laboratory.title}</span><span>{String(view.number).padStart(2, '0')}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.controls}>
          <p role="status">{String(front + 1).padStart(2, '0')} / {String(views.length).padStart(2, '0')} — {views[front]?.laboratory.title}</p>
          <button className={styles.explore} type="button" aria-pressed={exploring} aria-controls={`${id}-wheel`}
            disabled={blocked || views.length < 2} onClick={() => setExploring(value => !value)}>{exploring ? 'Desplazar la página' : 'Explorar rueda'}</button>
          <div className={styles.arrows}>
            <button type="button" aria-label="Imagen anterior" aria-controls={`${id}-wheel`} disabled={blocked || views.length < 2} onClick={() => navigate(front - 1)}>←</button>
            <button type="button" aria-label="Imagen siguiente" aria-controls={`${id}-wheel`} disabled={blocked || views.length < 2} onClick={() => navigate(front + 1)}>→</button>
          </div>
        </div>
        <p className={styles.note}>Primera pulsación: acercar una vista. Con la vista de frente: abrir el proyecto.</p>
        <noscript><p className={styles.note}>Colección estática. Desplázate por las imágenes para consultar el archivo.</p></noscript>
      </> : <p className={styles.note}>{laboratoryCopy.empty}</p>}
    </section>
  );
}
