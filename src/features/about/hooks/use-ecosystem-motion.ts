'use client';

import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { AboutConceptId } from '../types';

gsap.registerPlugin(useGSAP);

// Every state retains one move and one cubic segment per connection. GSAP
// can interpolate their numbers without a path morphing plugin.
type Curve = readonly [number, number, number, number, number, number, number, number];
type Offset = readonly [number, number];

const connections: Record<AboutConceptId, readonly Curve[]> = {
  crear: [
    [100, 115, 148, 56, 234, 65, 295, 95],
    [295, 95, 336, 181, 276, 247, 190, 275],
    [190, 275, 81, 263, 48, 201, 100, 115],
  ],
  explorar: [
    [100, 115, 151, 89, 209, 38, 295, 95],
    [295, 95, 352, 163, 293, 231, 190, 275],
    [190, 275, 91, 257, 57, 182, 100, 115],
  ],
  conectar: [
    [100, 115, 151, 72, 217, 74, 295, 95],
    [295, 95, 331, 177, 292, 274, 190, 275],
    [190, 275, 98, 298, 44, 182, 100, 115],
  ],
};

const offsets: Record<AboutConceptId, Record<AboutConceptId, Offset>> = {
  crear: { crear: [-6, -4], explorar: [5, 3], conectar: [3, 5] },
  explorar: { crear: [-4, 5], explorar: [6, -5], conectar: [-5, 3] },
  conectar: { crear: [-5, -3], explorar: [6, -2], conectar: [2, 7] },
};
const ends: readonly (readonly [AboutConceptId, AboutConceptId])[] = [
  ['crear', 'explorar'], ['explorar', 'conectar'], ['conectar', 'crear'],
];

export function useEcosystemMotion(rootRef: RefObject<HTMLElement | null>, active: AboutConceptId) {
  const activeRef = useRef(active);
  const selectRef = useRef<((id: AboutConceptId) => void) | null>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-about-node]'));
    const paths = Array.from(root.querySelectorAll<SVGPathElement>('[data-about-connection]'));
    const organism = root.querySelector<HTMLElement>('[data-about-organism]');
    const media = gsap.matchMedia();

    media.add({
      all: '(min-width: 0px)',
      reduced: '(prefers-reduced-motion: reduce)',
      finePointer: '(hover: hover) and (pointer: fine)',
      wide: '(min-width: 800px)',
    }, (context) => {
      const { reduced, finePointer, wide } = context.conditions as Record<string, boolean>;
      let selected = activeRef.current;
      const listeners: Array<() => void> = [];
      const distance = reduced ? 0 : wide ? 1.75 : 1;
      const activeScale = reduced ? 1.015 : wide ? 1.12 : 1.08;
      const inactiveScale = reduced ? 1 : 0.96;

      const offset = (id: AboutConceptId): Offset => {
        const [x, y] = offsets[selected][id];
        return [x * distance, y * distance];
      };
      const curve = (index: number) => {
        const bounds = organism?.getBoundingClientRect();
        const horizontal = 400 / (bounds?.width || 400);
        const vertical = 360 / (bounds?.height || 360);
        const [startId, endId] = ends[index];
        const start = offset(startId);
        const end = offset(endId);
        const values = connections[selected][index].map((value, coordinate) => {
          const shift = coordinate < 4 ? start : end;
          return value + (coordinate % 2 ? shift[1] * vertical : shift[0] * horizontal);
        });
        return `M ${values[0]} ${values[1]} C ${values.slice(2).join(' ')}`;
      };

      // Function destinations are reevaluated by invalidate(). Restarting
      // this one timeline reads the current geometry on rapid selections,
      // while keeping a fixed number of tweens in the media context.
      const timeline = gsap.timeline({ paused: true, defaults: { duration: 0.62, ease: 'power3.out' } });
      nodes.forEach((node) => {
        const nodeId = node.dataset.aboutNode as AboutConceptId;
        timeline.to(node, {
          scale: () => nodeId === selected ? activeScale : inactiveScale,
          x: () => offset(nodeId)[0],
          y: () => offset(nodeId)[1],
        }, 0);
      });
      paths.forEach((path, index) => {
        timeline.to(path, {
          attr: { d: () => curve(index) },
          opacity: () => ends[index].includes(selected) ? 1 : 0.42,
          ease: 'power2.inOut',
        }, 0);
      });
      const select = (id: AboutConceptId, initial = false) => {
        if (selected === id && !initial) return;
        selected = id;
        timeline.invalidate().restart();
        if (reduced || initial) timeline.progress(1).pause();
      };

      selectRef.current = select;
      select(activeRef.current, true);

      // Selection owns the outer button. Pointer motion owns its decorative
      // child, keeping these transforms independent and text steady.
      if (finePointer && !reduced) {
        for (const node of nodes) {
          const shape = node.querySelector<HTMLElement>('[data-about-shape]');
          if (!shape) continue;
          const followX = gsap.quickTo(shape, 'x', { duration: 0.45, ease: 'power3.out' });
          const followY = gsap.quickTo(shape, 'y', { duration: 0.45, ease: 'power3.out' });
          const turn = gsap.quickTo(shape, 'rotation', { duration: 0.5, ease: 'power3.out' });
          const growX = gsap.quickTo(shape, 'scaleX', { duration: 0.35, ease: 'power2.out' });
          const growY = gsap.quickTo(shape, 'scaleY', { duration: 0.35, ease: 'power2.out' });

          const enter = (event: PointerEvent) => {
            if (event.pointerType !== 'touch') { growX(1.025); growY(1.025); }
          };
          const move = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            const bounds = node.getBoundingClientRect();
            const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5));
            const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5));
            followX(x * 5);
            followY(y * 5);
            turn(x * 3);
          };
          const leave = () => {
            followX(0);
            followY(0);
            turn(0);
            growX(1);
            growY(1);
          };
          node.addEventListener('pointerenter', enter);
          node.addEventListener('pointermove', move);
          node.addEventListener('pointerleave', leave);
          node.addEventListener('pointercancel', leave);
          listeners.push(() => {
            node.removeEventListener('pointerenter', enter);
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerleave', leave);
            node.removeEventListener('pointercancel', leave);
          });
        }
      }

      return () => {
        if (selectRef.current === select) selectRef.current = null;
        listeners.forEach((remove) => remove());
        timeline.kill();
      };
    });

    return () => media.revert();
  }, { scope: rootRef });

  useGSAP(() => {
    activeRef.current = active;
    selectRef.current?.(active);
  }, { scope: rootRef, dependencies: [active] });
}
