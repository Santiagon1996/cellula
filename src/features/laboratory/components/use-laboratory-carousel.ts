'use client';

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import type { Laboratory, LaboratorySelection } from '../types';
import { dragExceeded, loopPosition, wrapLoop } from './laboratory-loop';

type Options = {
  rootRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  laboratories: readonly Laboratory[];
  paused: boolean;
  userPaused: boolean;
  speed: number;
  onSelect: (selection: LaboratorySelection) => void;
};

export function useLaboratoryCarousel({ rootRef, viewportRef, laboratories, paused, userPaused, speed, onSelect }: Options) {
  const settings = useRef({ paused, userPaused, speed, onSelect });
  const control = useRef<(direction: number) => void>(() => {});
  const stop = useRef<() => void>(() => {});
  const selecting = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const wasPaused = settings.current.paused;
    settings.current = { paused, userPaused, speed, onSelect };
    if (paused || userPaused) stop.current();
    if (wasPaused && !paused) {
      selecting.current = false;
    }
  }, [paused, userPaused, speed, onSelect]);

  const select = useCallback((selection: LaboratorySelection) => {
    if (selecting.current || settings.current.paused) return;
    selecting.current = true;
    stop.current();
    settings.current.onSelect(selection);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport || !laboratories.length) return;
    const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-laboratory-card]'));
    const setters = cards.map((card) => gsap.quickSetter(card, 'y', 'px'));
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const rate = { value: 1 };
    const position = { value: 0 };
    let step = 1;
    let height = 1;
    let visible = typeof IntersectionObserver === 'undefined';
    let focused = false;
    let keyboard = false;
    let hovering = false;
    let suppressClick = false;
    let suppressTimer: ReturnType<typeof setTimeout> | undefined;
    let navigation: gsap.core.Tween | undefined;
    let drag: { id: number; x: number; y: number; offset: number; moved: boolean } | null = null;

    const stopNavigation = () => {
      navigation?.kill();
      navigation = undefined;
    };
    const draw = () => {
      cards.forEach((_card, index) => setters[index](loopPosition(position.value, index, step, cards.length)));
      viewport.dataset.offset = String(position.value);
    };
    const center = (index: number, animate = true) => {
      stopNavigation();
      const target = viewport.clientHeight / 2 - height / 2;
      const current = loopPosition(position.value, index, step, cards.length);
      const distance = target - current;
      if (!animate || motion.matches) {
        position.value += distance;
        draw();
      } else {
        navigation = gsap.to(position, { value: position.value + distance, duration: 0.55, ease: 'power2.inOut', onUpdate: draw, onComplete: () => { navigation = undefined; } });
      }
    };
    const nearest = () => {
      const target = viewport.clientHeight / 2 - height / 2;
      let closest = 0;
      let distance = Infinity;
      cards.forEach((_card, index) => {
        const difference = Math.abs(loopPosition(position.value, index, step, cards.length) - target);
        if (difference < distance) { closest = index; distance = difference; }
      });
      return closest;
    };
    const resize = () => {
      const oldStep = step;
      height = cards[0].getBoundingClientRect().height || 1;
      step = height + (Number.parseFloat(getComputedStyle(viewport).getPropertyValue('--laboratory-gap')) || 24);
      position.value = oldStep > 1 ? position.value / oldStep * step : viewport.clientHeight / 2 - height / 2;
      stopNavigation();
      draw();
    };
    const tick = (_time: number, delta: number) => {
      if (!visible || document.hidden || motion.matches || settings.current.paused || settings.current.userPaused || selecting.current || focused || drag || navigation?.isActive()) return;
      position.value = wrapLoop(position.value - Math.max(0, settings.current.speed) * Math.min(delta, 64) / 1000 * rate.value, step * cards.length);
      draw();
    };
    const changeRate = () => {
      if (!visible || document.hidden) return;
      gsap.to(rate, { value: hovering ? 0.12 : 1, duration: motion.matches ? 0 : 0.6, overwrite: true, ease: 'power2.out' });
    };
    const pointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      hovering = event.target instanceof Element && !!event.target.closest('[data-laboratory-card]');
      changeRate();
    };
    const pointerOut = (event: PointerEvent) => {
      hovering = event.relatedTarget instanceof Element && viewport.contains(event.relatedTarget) && !!event.relatedTarget.closest('[data-laboratory-card]');
      changeRate();
    };
    const pointerInput = () => {
      keyboard = false;
      focused = false;
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.isPrimary === false || drag || settings.current.paused || selecting.current) return;
      pointerInput();
      suppressClick = false;
      clearTimeout(suppressTimer);
      stopNavigation();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: position.value, moved: false };
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved && !dragExceeded(drag.x, drag.y, event.clientX, event.clientY)) return;
      drag.moved = true;
      viewport.dataset.dragging = 'true';
      if (!viewport.hasPointerCapture?.(event.pointerId)) viewport.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      position.value = drag.offset + event.clientY - drag.y;
      draw();
    };
    const pointerEnd = (event: Pick<PointerEvent, 'pointerId'>) => {
      if (!drag || drag.id !== event.pointerId) return;
      const moved = drag.moved;
      drag = null;
      viewport.dataset.dragging = 'false';
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      if (moved) {
        suppressClick = true;
        clearTimeout(suppressTimer);
        suppressTimer = setTimeout(() => { suppressClick = false; }, 350);
      }
    };
    const lostCapture = (event: PointerEvent) => {
      if (event.target === viewport) pointerEnd(event);
    };
    stop.current = () => {
      stopNavigation();
      if (drag) pointerEnd({ pointerId: drag.id });
    };
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-copy="true"]') : null;
      if (!card) return;
      const laboratory = laboratories[Number(card.dataset.labIndex)];
      const source = card.querySelector<HTMLElement>('[data-lab-media]');
      if (laboratory && source) select({ laboratory, source, trigger: viewport });
    };
    const focusIn = (event: FocusEvent) => {
      if (settings.current.paused || selecting.current) return;
      focused = keyboard || (event.target instanceof Element && event.target.matches(':focus-visible'));
      if (drag) return;
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-laboratory-card]') : null;
      if (card && focused) center(cards.indexOf(card), false);
    };
    const focusOut = (event: FocusEvent) => {
      if (settings.current.paused || selecting.current) return;
      if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) focused = false;
    };
    const keyDown = (event: KeyboardEvent) => {
      keyboard = true;
      focused = true;
      if (event.key === 'Tab') {
        const originalButtons = cards
          .filter((card) => card.dataset.copy !== 'true')
          .map((card) => card.querySelector<HTMLButtonElement>('button'))
          .filter((button): button is HTMLButtonElement => button !== null);
        const actions = Array.from(root.querySelectorAll<HTMLButtonElement>('.laboratory-carousel__actions button:not(:disabled)'));
        const targets: HTMLElement[] = [viewport, ...originalButtons, ...actions];
        const current = event.target instanceof HTMLElement ? targets.indexOf(event.target) : -1;
        const next = current >= 0 ? targets[current + (event.shiftKey ? -1 : 1)] : undefined;
        if (next && (next === viewport || originalButtons.includes(next as HTMLButtonElement))) {
          event.preventDefault();
          next.focus({ preventScroll: true });
        }
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const card = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-laboratory-card]') : null;
        if (card && !settings.current.paused && !selecting.current) {
          const nextIndex = wrapLoop(Number(card.dataset.labIndex) + direction, laboratories.length);
          const next = cards.find((candidate) => candidate.dataset.copy !== 'true' && Number(candidate.dataset.labIndex) === nextIndex);
          next?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
        } else control.current(direction);
      } else if (event.target === viewport && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        const card = cards[nearest()];
        const source = card.querySelector<HTMLElement>('[data-lab-media]');
        const trigger = card.querySelector<HTMLElement>('button') ?? viewport;
        if (source) select({ laboratory: laboratories[Number(card.dataset.labIndex)], source, trigger });
      }
    };
    const blur = () => { stop.current(); };
    const visibility = () => {
      if (document.hidden) {
        stop.current();
        gsap.killTweensOf(rate);
      } else changeRate();
    };
    const preference = () => {
      if (motion.matches) {
        stopNavigation();
        gsap.killTweensOf(rate);
        rate.value = hovering ? 0.12 : 1;
      }
      root.dataset.reducedMotion = String(motion.matches);
      setReducedMotion(motion.matches);
    };
    control.current = (direction) => {
      if (settings.current.paused || selecting.current) return;
      center(wrapLoop(nearest() + direction, cards.length));
    };

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(viewport);
    observer?.observe(cards[0]);
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        stop.current();
        gsap.killTweensOf(rate);
      } else changeRate();
    });
    intersection?.observe(viewport);
    viewport.addEventListener('pointerover', pointerOver);
    viewport.addEventListener('pointerout', pointerOut);
    viewport.addEventListener('pointerdown', pointerDown);
    viewport.addEventListener('pointerup', pointerEnd);
    viewport.addEventListener('pointercancel', pointerEnd);
    viewport.addEventListener('lostpointercapture', lostCapture);
    viewport.addEventListener('click', click, true);
    root.addEventListener('focusin', focusIn);
    root.addEventListener('focusout', focusOut);
    root.addEventListener('keydown', keyDown);
    root.addEventListener('pointerdown', pointerInput);
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointercancel', pointerEnd);
    window.addEventListener('blur', blur);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    resize();
    preference();
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      observer?.disconnect();
      intersection?.disconnect();
      stop.current();
      gsap.killTweensOf(rate);
      clearTimeout(suppressTimer);
      viewport.removeEventListener('pointerover', pointerOver);
      viewport.removeEventListener('pointerout', pointerOut);
      viewport.removeEventListener('pointerdown', pointerDown);
      viewport.removeEventListener('pointerup', pointerEnd);
      viewport.removeEventListener('pointercancel', pointerEnd);
      viewport.removeEventListener('lostpointercapture', lostCapture);
      viewport.removeEventListener('click', click, true);
      root.removeEventListener('focusin', focusIn);
      root.removeEventListener('focusout', focusOut);
      root.removeEventListener('keydown', keyDown);
      root.removeEventListener('pointerdown', pointerInput);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerEnd);
      window.removeEventListener('pointercancel', pointerEnd);
      window.removeEventListener('blur', blur);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      control.current = () => {};
      stop.current = () => {};
    };
  }, [laboratories, rootRef, viewportRef, select]);

  return { select, reducedMotion, navigate: (direction: number) => control.current(direction) };
}
