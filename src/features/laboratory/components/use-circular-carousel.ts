'use client';

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import type { Laboratory, LaboratorySelection } from '../types';
import {
  circularCardPose,
  circularGeometry,
  circularOffset,
  nearestCircularPosition,
  snapCircularPosition,
  wrapCircularIndex,
  type CircularOrientation,
} from './laboratory-circular-geometry';

type Options = {
  rootRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  laboratories: readonly Laboratory[];
  blocked: boolean;
  onSelect: (selection: LaboratorySelection) => void;
};

type Press = {
  id: number;
  x: number;
  y: number;
  position: number;
  moved: boolean;
  nativeScroll: boolean;
  pointerType: string;
  samples: Array<{ time: number; position: number }>;
};

export function useCircularCarousel({ rootRef, viewportRef, laboratories, blocked, onSelect }: Options) {
  const settings = useRef({ blocked, onSelect });
  const active = useRef<string | null>(laboratories[0]?.id ?? null);
  const selecting = useRef(false);
  const control = useRef<(direction: number) => void>(() => {});
  const choose = useRef<(selection: LaboratorySelection) => void>(() => {});
  const stop = useRef<() => void>(() => {});
  const [activeId, setActiveId] = useState<string | null>(laboratories[0]?.id ?? null);
  const [orientation, setOrientation] = useState<CircularOrientation>('vertical');

  useLayoutEffect(() => {
    const wasBlocked = settings.current.blocked;
    settings.current = { blocked, onSelect };
    if (blocked) stop.current();
    if (wasBlocked && !blocked) selecting.current = false;
  }, [blocked, onSelect]);

  const select = useCallback((selection: LaboratorySelection) => choose.current(selection), []);
  const navigate = useCallback((direction: number) => control.current(direction), []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport) return;
    const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-circular-card]'));
    const byId = new Map(laboratories.map((laboratory, index) => [laboratory.id, index]));
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 768px)');
    let axis: CircularOrientation = desktop.matches ? 'horizontal' : 'vertical';
    let geometry = circularGeometry({ count: laboratories.length, cardWidth: 220, cardHeight: 220, gap: 24, orientation: axis });
    let pitch = 244;
    let visible = true;
    let navigation: gsap.core.Tween | undefined;
    let destination: number | null = null;
    let press: Press | null = null;
    let suppressClick = false;
    const position = { value: active.current ? byId.get(active.current) ?? 0 : 0 };

    const unavailable = () => settings.current.blocked || selecting.current;
    const updateActive = (index: number) => {
      const id = laboratories[wrapCircularIndex(index, laboratories.length)]?.id ?? null;
      if (active.current !== id) {
        active.current = id;
        setActiveId(id);
      }
    };
    const draw = () => {
      cards.forEach((card) => {
        const index = byId.get(card.dataset.labId ?? '');
        if (index === undefined) return;
        const pose = circularCardPose(index, position.value, laboratories.length, geometry, axis);
        card.style.transform = `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rotateX}deg) rotateY(${pose.rotateY}deg) scale(${pose.scale})`;
        card.style.opacity = String(pose.opacity);
        card.style.zIndex = String(pose.zIndex);
        card.style.pointerEvents = pose.opacity < .05 ? 'none' : '';
      });
      viewport.dataset.position = String(position.value);
    };
    const stopNavigation = () => {
      navigation?.kill();
      navigation = undefined;
      destination = null;
    };
    const releaseCapture = (id: number) => {
      if (viewport.hasPointerCapture?.(id)) viewport.releasePointerCapture(id);
    };
    const cancelPress = () => {
      if (!press) return;
      const previous = press;
      press = null;
      if (previous.moved) suppressClick = true;
      viewport.dataset.dragging = 'false';
      releaseCapture(previous.id);
    };
    const settle = () => {
      stopNavigation();
      cancelPress();
      position.value = active.current ? byId.get(active.current) ?? 0 : 0;
      draw();
    };
    const animateTo = (target: number, animate = true) => {
      stopNavigation();
      cancelPress();
      updateActive(Math.round(target));
      if (!animate || motion.matches || !visible || document.hidden || Math.abs(target - position.value) < .001) {
        position.value = wrapCircularIndex(target, laboratories.length);
        draw();
        return;
      }
      destination = target;
      navigation = gsap.to(position, {
        value: target,
        duration: .55,
        ease: 'power3.out',
        onUpdate: draw,
        onComplete: () => {
          navigation = undefined;
          destination = null;
          position.value = wrapCircularIndex(target, laboratories.length);
          draw();
        },
      });
    };
    const center = (index: number, animate = true) => {
      animateTo(nearestCircularPosition(index, position.value, laboratories.length), animate);
    };
    const measure = () => {
      const nextAxis: CircularOrientation = desktop.matches ? 'horizontal' : 'vertical';
      const first = cards[0];
      const width = first?.offsetWidth || 220;
      const height = first?.offsetHeight || 220;
      const gap = Number.parseFloat(getComputedStyle(viewport).getPropertyValue('--laboratory-circular-gap')) || 24;
      axis = nextAxis;
      root.dataset.orientation = axis;
      root.dataset.reducedMotion = String(motion.matches);
      setOrientation((previous) => previous === axis ? previous : axis);
      geometry = circularGeometry({ count: laboratories.length, cardWidth: width, cardHeight: height, gap, orientation: axis });
      pitch = (axis === 'vertical' ? height : width) + gap;
      const index = active.current ? byId.get(active.current) ?? 0 : 0;
      updateActive(index);
      settle();
    };
    const focusCard = (index: number) => {
      const card = cards.find((candidate) => candidate.dataset.labId === laboratories[wrapCircularIndex(index, laboratories.length)]?.id);
      const button = card?.matches('button') ? card : card?.querySelector<HTMLElement>('button');
      button?.focus({ preventScroll: true });
    };

    control.current = (direction) => {
      if (unavailable() || laboratories.length < 2 || !Number.isFinite(direction)) return;
      const amount = Math.trunc(direction);
      if (!amount) return;
      animateTo((destination ?? Math.round(position.value)) + amount);
    };
    choose.current = (selection) => {
      if (unavailable()) return;
      const index = byId.get(selection.laboratory.id);
      if (index === undefined || !selection.source.isConnected || !viewport.contains(selection.source)) return;
      if (Math.abs(circularOffset(index, position.value, laboratories.length)) > .015 || active.current !== selection.laboratory.id) {
        center(index);
        return;
      }
      // Flip always receives the real, front-facing card after all motion has stopped.
      selecting.current = true;
      stopNavigation();
      cancelPress();
      position.value = index;
      draw();
      settings.current.onSelect(selection);
    };
    stop.current = settle;

    const pointerDown = (event: PointerEvent) => {
      suppressClick = false;
      if (event.button !== 0 || event.isPrimary === false || press || unavailable()) return;
      stopNavigation();
      press = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        position: position.value,
        moved: false,
        nativeScroll: axis === 'vertical' && event.pointerType === 'touch',
        pointerType: event.pointerType,
        samples: [{ time: performance.now(), position: position.value }],
      };
    };
    const pointerMove = (event: PointerEvent) => {
      if (!press || press.id !== event.pointerId || unavailable()) return;
      const delta = axis === 'vertical' ? event.clientY - press.y : event.clientX - press.x;
      const cross = axis === 'vertical' ? event.clientX - press.x : event.clientY - press.y;
      if (press.nativeScroll) {
        if (Math.hypot(delta, cross) >= 8) { press.moved = true; suppressClick = true; }
        return;
      }
      if (!press.moved) {
        if (Math.abs(delta) < 8) return;
        if (press.pointerType !== 'mouse' && Math.abs(cross) > Math.abs(delta)) {
          suppressClick = true;
          press = null;
          return;
        }
        press.moved = true;
        viewport.dataset.dragging = 'true';
        try { viewport.setPointerCapture?.(event.pointerId); } catch { /* A cancelled pointer can lose capture before this event. */ }
      }
      event.preventDefault();
      position.value = press.position - delta / Math.max(1, pitch);
      const now = performance.now();
      press.samples.push({ time: now, position: position.value });
      while (press.samples.length > 2 && now - press.samples[0].time > 100) press.samples.shift();
      draw();
    };
    const pointerEnd = (event: PointerEvent) => {
      if (!press || press.id !== event.pointerId) return;
      const previous = press;
      press = null;
      viewport.dataset.dragging = 'false';
      releaseCapture(previous.id);
      if (!previous.moved) return;
      suppressClick = true;
      if (previous.nativeScroll) return;
      const first = previous.samples[0];
      const last = previous.samples[previous.samples.length - 1];
      const elapsed = (last.time - first.time) / 1000;
      const velocity = event.type === 'pointercancel' || elapsed < .008 ? 0 : (last.position - first.position) / elapsed;
      animateTo(snapCircularPosition(position.value, velocity), event.type !== 'pointercancel');
    };
    const lostCapture = (event: PointerEvent) => {
      if (event.target === viewport && press?.id === event.pointerId) {
        suppressClick ||= press.moved;
        settle();
      }
    };
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const keyDown = (event: KeyboardEvent) => {
      if (unavailable() || !laboratories.length || event.altKey || event.ctrlKey || event.metaKey) return;
      const forward = axis === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const backward = axis === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      let index: number;
      if (event.key === forward || event.key === backward) {
        control.current(event.key === forward ? 1 : -1);
        index = active.current ? byId.get(active.current) ?? 0 : 0;
      } else if (event.key === 'Home' || event.key === 'End') {
        index = event.key === 'Home' ? 0 : laboratories.length - 1;
        center(index);
      } else if (event.target === viewport && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        const card = cards.find((candidate) => candidate.dataset.labId === active.current);
        const source = card?.querySelector<HTMLElement>('[data-lab-media]');
        const laboratory = laboratories.find((item) => item.id === active.current);
        if (card && source && laboratory) choose.current({ laboratory, source, trigger: card.matches('button') ? card : card.querySelector<HTMLElement>('button') ?? viewport });
        return;
      } else return;
      event.preventDefault();
      if (event.target === viewport || (event.target instanceof Element && event.target.closest('[data-circular-card]'))) focusCard(index);
    };
    const preference = () => {
      root.dataset.reducedMotion = String(motion.matches);
      if (motion.matches) settle();
    };
    const visibility = () => { if (document.hidden) settle(); };
    const dragStart = (event: DragEvent) => event.preventDefault();
    const resetSuppression = () => { suppressClick = false; };
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(viewport);
    if (cards[0]) resize?.observe(cards[0]);
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) settle();
    });
    intersection?.observe(viewport);
    viewport.addEventListener('pointerdown', pointerDown);
    viewport.addEventListener('lostpointercapture', lostCapture);
    viewport.addEventListener('click', click, true);
    viewport.addEventListener('dragstart', dragStart);
    root.addEventListener('pointerdown', resetSuppression, true);
    root.addEventListener('keydown', keyDown);
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointercancel', pointerEnd);
    window.addEventListener('blur', settle);
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', visibility);
    desktop.addEventListener('change', measure);
    motion.addEventListener('change', preference);
    measure();

    return () => {
      stopNavigation();
      cancelPress();
      resize?.disconnect();
      intersection?.disconnect();
      viewport.removeEventListener('pointerdown', pointerDown);
      viewport.removeEventListener('lostpointercapture', lostCapture);
      viewport.removeEventListener('click', click, true);
      viewport.removeEventListener('dragstart', dragStart);
      root.removeEventListener('pointerdown', resetSuppression, true);
      root.removeEventListener('keydown', keyDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerEnd);
      window.removeEventListener('pointercancel', pointerEnd);
      window.removeEventListener('blur', settle);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', visibility);
      desktop.removeEventListener('change', measure);
      motion.removeEventListener('change', preference);
      control.current = () => {};
      choose.current = () => {};
      stop.current = () => {};
    };
  }, [laboratories, rootRef, viewportRef]);

  return { activeId, orientation, navigate, select };
}
