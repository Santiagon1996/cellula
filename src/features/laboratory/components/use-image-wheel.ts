'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import type { LaboratoryView } from '../data/laboratory-views';
import { angularCursorSpeed, dragRotation, imageWheelGeometry, imageWheelPose, wheelFront, wheelMomentum, wheelTarget } from './image-wheel-geometry';

type Options = {
  rootRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  views: readonly LaboratoryView[];
  exploring: boolean;
  blocked: boolean;
  onFront: (index: number) => void;
  onActivate: (index: number, source: HTMLElement, trigger: HTMLElement) => void;
};
type Press = { id: number; y: number; rotation: number; moved: boolean; samples: Array<{ time: number; rotation: number }> };

export function useImageWheel(options: Options) {
  const { rootRef, sceneRef, views } = options;
  const settings = useRef(options);
  const actions = useRef<{ move: (index: number) => void; select: (index: number, trigger: HTMLElement) => void; stop: () => void; unblock: () => void }>({
    move: () => {}, select: () => {}, stop: () => {}, unblock: () => {},
  });
  const move = useCallback((index: number) => actions.current.move(index), []);
  const select = useCallback((index: number, trigger: HTMLElement) => actions.current.select(index, trigger), []);

  useLayoutEffect(() => {
    const previous = settings.current;
    settings.current = options;
    if (options.blocked || previous.exploring !== options.exploring) actions.current.stop();
    if (previous.blocked && !options.blocked) actions.current.unblock();
  }, [options]);

  useLayoutEffect(() => {
    const root = rootRef.current, scene = sceneRef.current;
    if (!root || !scene) return;
    const cards = Array.from(scene.querySelectorAll<HTMLElement>('[data-wheel-card]'));
    const desktop = matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const state = { rotation: 0 };
    let geometry = imageWheelGeometry(views, 320, 600, desktop.matches ? 'horizontal' : 'vertical');
    let frame = 0, last = 0, speed = 0, target = 0, momentum = false, visible = true;
    let press: Press | null = null, suppressClick = false, selecting = false, active = -1;
    let navigation: gsap.core.Tween | undefined;
    const release = () => {
      const id = press?.id; press = null;
      if (id !== undefined && root.hasPointerCapture?.(id)) root.releasePointerCapture(id);
      root.dataset.dragging = 'false';
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; speed = 0; target = 0; last = 0; momentum = false;
      navigation?.kill(); navigation = undefined;
      if (press?.moved) suppressClick = true;
      release(); root.dataset.moving = 'false';
    };
    const draw = () => {
      const front = wheelFront(state.rotation, geometry);
      cards.forEach((card, index) => {
        const pose = imageWheelPose(index, state.rotation, geometry);
        card.style.transform = `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rotateX}deg) rotateY(${pose.rotateY}deg)`;
        card.dataset.depth = String(pose.z); card.dataset.angle = String(pose.angle);
        card.dataset.front = String(front === index);
      });
      root.dataset.rotation = String(state.rotation);
      if (front !== active) { active = front; settings.current.onFront(front); }
    };
    const measure = () => {
      stop();
      geometry = imageWheelGeometry(views, root.clientWidth || 320, root.clientHeight || 600, desktop.matches ? 'horizontal' : 'vertical');
      root.dataset.axis = geometry.axis; root.dataset.reduced = String(reduced.matches);
      root.dataset.radius = String(geometry.radius);
      scene.style.perspective = `${geometry.perspective}px`;
      cards.forEach((card, index) => {
        const size = geometry.dimensions[index];
        card.style.width = `${size.width}px`; card.style.height = `${size.height}px`;
        card.style.marginLeft = `${-size.width / 2}px`; card.style.marginTop = `${-size.height / 2}px`;
      });
      root.dataset.enhanced = 'true'; draw();
    };
    const unavailable = () => settings.current.blocked || selecting || !visible || document.hidden;
    const tick = (time: number) => {
      frame = 0;
      if (unavailable() || reduced.matches) { stop(); return; }
      const dt = last ? Math.min(.05, (time - last) / 1000) : 1 / 60; last = time;
      if (momentum) {
        const next = wheelMomentum(speed, dt); speed = next.velocity; state.rotation += next.distance;
      } else {
        const decay = Math.exp(-dt / .12), previous = speed;
        speed = target + (speed - target) * decay;
        state.rotation += target * dt + (previous - target) * .12 * (1 - decay);
      }
      draw();
      if (Math.abs(speed) < .003 && Math.abs(target) < .003) { stop(); return; }
      frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) { last = 0; root.dataset.moving = 'true'; frame = requestAnimationFrame(tick); }
    };
    const center = (index: number) => {
      if (settings.current.blocked || selecting || !views.length) return;
      stop();
      const rotation = wheelTarget(index, state.rotation, geometry);
      if (reduced.matches || !visible || document.hidden || Math.abs(rotation - state.rotation) < .001) {
        state.rotation = rotation; draw(); return;
      }
      root.dataset.moving = 'true';
      navigation = gsap.to(state, { rotation, duration: .5, ease: 'power3.out', onUpdate: draw,
        onComplete: () => { navigation = undefined; root.dataset.moving = 'false'; } });
    };
    actions.current = {
      move: center, stop, unblock: () => { selecting = false; },
      select: (index, trigger) => {
        if (suppressClick || settings.current.blocked || selecting) { suppressClick = false; return; }
        const rotation = wheelTarget(index, state.rotation, geometry);
        if (Math.abs(rotation - state.rotation) > .012) { center(index); return; }
        stop(); state.rotation = rotation; draw();
        const source = trigger.querySelector<HTMLElement>('[data-wheel-media]');
        if (!source) return;
        selecting = true;
        settings.current.onActivate(index, source, trigger);
      },
    };
    const pointerMove = (event: PointerEvent) => {
      if (unavailable() || reduced.matches || views.length < 2) return;
      if (press && press.id === event.pointerId) {
        const delta = event.clientY - press.y;
        if (!press.moved && Math.abs(delta) < 7) return;
        if (!press.moved) {
          press.moved = true; root.dataset.dragging = 'true';
          try { root.setPointerCapture?.(event.pointerId); } catch { release(); return; }
        }
        state.rotation = press.rotation + dragRotation(delta, geometry.radius);
        press.samples.push({ time: performance.now(), rotation: state.rotation });
        while (press.samples.length > 2 && performance.now() - press.samples[0].time > 100) press.samples.shift();
        draw(); return;
      }
      if (!desktop.matches || event.pointerType !== 'mouse' || event.buttons) return;
      navigation?.kill(); navigation = undefined;
      const rect = root.getBoundingClientRect();
      target = angularCursorSpeed((event.clientX - rect.left - rect.width / 2) / (rect.width / 2));
      momentum = false;
      if (target || Math.abs(speed) > .003) wake();
    };
    const down = (event: PointerEvent) => {
      suppressClick = false;
      if (desktop.matches || !settings.current.exploring || reduced.matches || unavailable() || views.length < 2 || event.isPrimary === false) return;
      stop();
      press = { id: event.pointerId, y: event.clientY, rotation: state.rotation, moved: false,
        samples: [{ time: performance.now(), rotation: state.rotation }] };
    };
    const up = (event: PointerEvent) => {
      if (!press || press.id !== event.pointerId) return;
      const previous = press; release();
      if (!previous.moved) return;
      suppressClick = true;
      if (event.type !== 'pointerup') { stop(); return; }
      const first = previous.samples[0], latest = previous.samples[previous.samples.length - 1];
      const elapsed = Math.max(.016, (latest.time - first.time) / 1000);
      speed = Math.max(-2.2, Math.min(2.2, (latest.rotation - first.rotation) / elapsed));
      momentum = true; target = 0;
      if (Math.abs(speed) > .01) wake();
    };
    const leave = (event: PointerEvent) => { if (event.pointerType === 'mouse' && !press) stop(); };
    const click = (event: MouseEvent) => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    };
    const focus = () => { speed = 0; target = 0; if (frame) cancelAnimationFrame(frame); frame = 0; root.dataset.moving = 'false'; };
    const visibility = () => { if (document.hidden) stop(); };
    const resize = new ResizeObserver(measure);
    const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; if (!visible) stop(); });
    const lostCapture = (event: PointerEvent) => { if (event.target === root && press?.id === event.pointerId) stop(); };
    measure(); resize.observe(root); intersection.observe(root);
    root.addEventListener('pointermove', pointerMove, { passive: true });
    root.addEventListener('pointerdown', down, { passive: true });
    root.addEventListener('pointerup', up, { passive: true }); root.addEventListener('pointercancel', up, { passive: true });
    root.addEventListener('pointerleave', leave); root.addEventListener('click', click, true); root.addEventListener('focusin', focus);
    root.addEventListener('lostpointercapture', lostCapture);
    document.addEventListener('visibilitychange', visibility);
    desktop.addEventListener('change', measure); reduced.addEventListener('change', measure);
    return () => {
      stop(); resize.disconnect(); intersection.disconnect();
      root.removeEventListener('pointermove', pointerMove); root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointerup', up); root.removeEventListener('pointercancel', up); root.removeEventListener('pointerleave', leave);
      root.removeEventListener('click', click, true); root.removeEventListener('focusin', focus); root.removeEventListener('lostpointercapture', lostCapture);
      document.removeEventListener('visibilitychange', visibility);
      desktop.removeEventListener('change', measure); reduced.removeEventListener('change', measure);
      actions.current = { move: () => {}, select: () => {}, stop: () => {}, unblock: () => {} };
    };
  }, [rootRef, sceneRef, views]);
  return { move, select };
}
