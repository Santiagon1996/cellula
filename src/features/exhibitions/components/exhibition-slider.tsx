'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import type { ExhibitionArtwork } from '../types';

type ExhibitionSliderProps = {
  artworks: readonly ExhibitionArtwork[];
};

export function ExhibitionSlider({ artworks }: ExhibitionSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef<(index: number) => void>(() => {});
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settled, setSettled] = useState(true);
  const [dragging, setDragging] = useState(false);
  const id = useId();

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || artworks.length === 0) return;

    const slides = Array.from(viewport.querySelectorAll<HTMLElement>('.exhibition-slider__slide'));
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let suppressClick = false;
    let touching = false;
    let pendingIndex: number | null = null;
    let drag: {
      id: number;
      startX: number;
      startScroll: number;
      lastX: number;
      lastTime: number;
      velocity: number;
      moved: boolean;
    } | null = null;

    const targetFor = (index: number) => {
      const frame = viewport.getBoundingClientRect();
      const slide = slides[index].getBoundingClientRect();
      const target = viewport.scrollLeft + slide.left + slide.width / 2 - frame.left - viewport.clientWidth / 2;
      return Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, target));
    };

    const nearestTo = (position = viewport.scrollLeft) => {
      let nearest = 0;
      let distance = Infinity;
      slides.forEach((_slide, index) => {
        const difference = Math.abs(targetFor(index) - position);
        if (difference < distance) {
          distance = difference;
          nearest = index;
        }
      });
      return nearest;
    };

    const activate = (index: number) => {
      activeRef.current = index;
      setActiveIndex(index);
    };

    const scheduleSettle = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, 180);
    };

    const settle = () => {
      if (drag || touching) return;
      // Keep the requested artwork when smooth scrolling pauses between frames.
      const index = pendingIndex ?? nearestTo();
      activate(index);
      const target = targetFor(index);
      if (Math.abs(viewport.scrollLeft - target) > 1) {
        viewport.scrollTo({ left: target, behavior: motion.matches ? 'instant' : 'smooth' });
        scheduleSettle();
        return;
      }
      pendingIndex = null;
      setSettled(true);
    };

    const navigate = (index: number) => {
      const next = Math.max(0, Math.min(slides.length - 1, index));
      pendingIndex = next;
      activate(next);
      setSettled(false);
      viewport.scrollTo({ left: targetFor(next), behavior: motion.matches ? 'instant' : 'smooth' });
      scheduleSettle();
    };
    navigateRef.current = navigate;

    const onScroll = () => {
      setSettled(false);
      activate(nearestTo());
      scheduleSettle();
    };

    const onTouchStart = () => {
      pendingIndex = null;
      touching = true;
      clearTimeout(timer);
    };
    const onTouchEnd = (event: TouchEvent) => {
      touching = event.touches.length > 0;
      if (!touching) scheduleSettle();
    };
    const onWheel = () => {
      pendingIndex = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const index = activeRef.current;
      const destinations: Record<string, number> = {
        ArrowLeft: index - 1,
        ArrowRight: index + 1,
        Home: 0,
        End: slides.length - 1,
      };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      navigate(destinations[event.key]);
    };

    // Touch uses the browser's native scrolling and momentum; mouse uses capture.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary || drag) return;
      if (event.target instanceof Element && event.target.closest('a, button')) return;
      pendingIndex = null;
      suppressClick = false;
      clearTimeout(timer);
      // Stop any pending smooth navigation at the position where the user grabs it.
      viewport.scrollTo({ left: viewport.scrollLeft, behavior: 'instant' });
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startScroll: viewport.scrollLeft,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocity: 0,
        moved: false,
      };
      viewport.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const distance = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(distance) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        viewport.dataset.dragging = 'true';
        setDragging(true);
        setSettled(false);
      }
      event.preventDefault();
      const now = performance.now();
      drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastTime);
      drag.lastX = event.clientX;
      drag.lastTime = now;
      viewport.scrollLeft = drag.startScroll - distance;
    };

    const endDrag = (event: Pick<PointerEvent, 'pointerId' | 'type'>) => {
      if (!drag || drag.id !== event.pointerId) return;
      const completed = drag;
      drag = null;
      viewport.dataset.dragging = 'false';
      setDragging(false);
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      if (completed.moved) {
        suppressClick = true;
        const velocity = event.type === 'pointerup' && performance.now() - completed.lastTime < 80
          ? completed.velocity : 0;
        // A short fling projects toward the next artwork; snap always ends centered.
        const momentum = Math.max(-viewport.clientWidth * 0.5, Math.min(viewport.clientWidth * 0.5, velocity * 160));
        navigate(nearestTo(viewport.scrollLeft - momentum));
      } else {
        scheduleSettle();
      }
    };

    const onBlur = () => {
      if (drag) endDrag({ pointerId: drag.id, type: 'pointercancel' });
    };

    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };

    const onResize = () => {
      if (drag) return;
      // Keep both endpoint artworks centered at every viewport width.
      viewport.style.setProperty('--gallery-inset', `${Math.max(0, (viewport.clientWidth - slides[0].getBoundingClientRect().width) / 2)}px`);
      viewport.scrollTo({ left: targetFor(pendingIndex ?? Math.min(activeRef.current, slides.length - 1)), behavior: 'instant' });
      scheduleSettle();
    };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    resizeObserver?.observe(viewport);
    resizeObserver?.observe(slides[0]);

    viewport.addEventListener('scroll', onScroll, { passive: true });
    viewport.addEventListener('wheel', onWheel, { passive: true });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });
    viewport.addEventListener('keydown', onKeyDown);
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    viewport.addEventListener('click', onClick, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', onBlur);
    onResize();

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      viewport.removeEventListener('scroll', onScroll);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
      viewport.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      viewport.removeEventListener('lostpointercapture', endDrag);
      viewport.removeEventListener('click', onClick, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('blur', onBlur);
      navigateRef.current = () => {};
    };
  }, [artworks]);

  if (artworks.length === 0) return <p>La selección estará disponible próximamente.</p>;
  const current = Math.min(activeIndex, artworks.length - 1);

  return (
    <section className="exhibition-slider" aria-label="Selección de obras" aria-roledescription="carrusel">
      <p id={`${id}-instructions`} className="exhibition-slider__hint font-mono font-normal">Desliza o arrastra para explorar. Detente para descubrir cada obra.</p>
      <div
        ref={viewportRef}
        id={`${id}-viewport`}
        className="exhibition-slider__viewport"
        tabIndex={0}
        aria-label="Galería de obras; usa las flechas para navegar"
        aria-describedby={`${id}-instructions`}
        data-dragging={dragging}
      >
        <div className="exhibition-slider__track">
          {artworks.map((artwork, index) => {
            const active = index === current;
            const revealed = active && settled && !dragging;
            return (
              <article
                key={artwork.id}
                className="exhibition-slider__slide"
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${artworks.length}: ${artwork.title}`}
                data-active={active}
                data-revealed={revealed}
              >
                <div className="exhibition-slider__artwork">
                  <Image
                    src={artwork.src}
                    alt={artwork.alt}
                    width={800}
                    height={1000}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 80vw, (max-width: 1400px) 34vw, 480px"
                    className="exhibition-slider__image"
                    draggable={false}
                  />
                  <div className="exhibition-slider__detail" aria-hidden={!revealed}>
                    <p className="exhibition-slider__technique font-mono font-normal">{artwork.technique}</p>
                    <h2>{artwork.title}</h2>
                    <p>{artwork.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <footer className="exhibition-slider__controls font-mono font-normal">
        <span className="exhibition-slider__counter" aria-hidden="true">{String(current + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}</span>
        <div className="exhibition-slider__navigation font-sans font-normal">
          <button type="button" aria-label="Obra anterior" aria-controls={`${id}-viewport`} disabled={current === 0} onClick={() => navigateRef.current(current - 1)}>←</button>
          <button type="button" aria-label="Obra siguiente" aria-controls={`${id}-viewport`} disabled={current === artworks.length - 1} onClick={() => navigateRef.current(current + 1)}>→</button>
        </div>
      </footer>
      <p className="exhibition-slider__status font-mono font-normal" aria-live="polite" aria-atomic="true">{settled && !dragging ? `Obra ${current + 1} de ${artworks.length}: ${artworks[current].title}` : ''}</p>
    </section>
  );
}
