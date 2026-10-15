'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export type NavigationPhase = 'closed' | 'opening' | 'open' | 'closing';

type NavigationMotionOptions = {
  rootRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  surfaceRef: RefObject<SVGSVGElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onPhaseChange: (phase: NavigationPhase) => void;
};

type Point = readonly [x: number, y: number];

// The same eight cubic segments are used throughout the transition. The
// intermediate outline is asymmetric; the final outline extends beyond the
// viewport so its rounded corners cannot leave gaps at the screen edges.
const flowingOutline: readonly Point[] = [
  [560, -85], [1060, -15], [1160, 380], [1045, 930],
  [455, 1150], [-90, 980], [-165, 390], [25, 20],
];
const coveredOutline: readonly Point[] = [
  [500, -150], [1150, -150], [1150, 500], [1150, 1150],
  [500, 1150], [-150, 1150], [-150, 500], [-150, -150],
];

function mixPoint(from: Point, to: Point, amount: number): Point {
  return [from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount];
}

function liquidPath(origin: Point, progress: number) {
  const expansion = Math.min(1, progress / 0.76);
  const settling = Math.max(0, (progress - 0.76) / 0.24);
  const points = flowingOutline.map((point, index) =>
    mixPoint(mixPoint(origin, point, expansion), coveredOutline[index], settling),
  );
  let path = `M ${points[0][0]} ${points[0][1]}`;

  // Convert a closed Catmull-Rom outline to cubic Beziers. No path plugin or
  // allocations of animation objects are needed during a frame or resize.
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index + points.length - 1) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const after = points[(index + 2) % points.length];
    const controlA: Point = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const controlB: Point = [
      next[0] - (after[0] - current[0]) / 6,
      next[1] - (after[1] - current[1]) / 6,
    ];
    path += ` C ${controlA[0]} ${controlA[1]} ${controlB[0]} ${controlB[1]} ${next[0]} ${next[1]}`;
  }

  return `${path} Z`;
}

export function useHomeNavigationMotion({
  rootRef, panelRef, surfaceRef, buttonRef, onPhaseChange,
}: NavigationMotionOptions) {
  const targetOpenRef = useRef(false);
  const phaseChangeRef = useRef(onPhaseChange);
  const controlRef = useRef<((open: boolean) => void) | null>(null);

  useEffect(() => {
    phaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useGSAP(() => {
    const panel = panelRef.current;
    const surface = surfaceRef.current;
    const button = buttonRef.current;
    const shape = surface?.querySelector<SVGPathElement>('[data-nav-shape]');
    if (!panel || !surface || !button || !shape) return;

    const rows = panel.querySelectorAll<HTMLElement>('[data-nav-row]');
    const details = panel.querySelectorAll<HTMLElement>('[data-nav-reveal]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coverage = { progress: 0 };
    let origin: Point = [1000, 0];

    const drawShape = () => {
      shape.setAttribute('d', liquidPath(origin, coverage.progress));
    };
    const updateGeometry = () => {
      const viewport = surface.getBoundingClientRect();
      const trigger = button.getBoundingClientRect();
      const width = Math.max(1, viewport.width || window.innerWidth);
      const height = Math.max(1, viewport.height || window.innerHeight);
      origin = [
        ((trigger.left + trigger.width / 2 - viewport.left) / width) * 1000,
        ((trigger.top + trigger.height / 2 - viewport.top) / height) * 1000,
      ];
      drawShape();
    };

    gsap.set(rows, { autoAlpha: 0, y: 32 });
    gsap.set(details, { autoAlpha: 0, y: 14 });
    updateGeometry();

    // A single timeline means repeated clicks simply change its direction.
    // Reversing hides all content before the liquid surface retreats.
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        if (targetOpenRef.current) phaseChangeRef.current('open');
      },
      onReverseComplete: () => {
        if (!targetOpenRef.current) phaseChangeRef.current('closed');
      },
    });
    timeline
      .to(coverage, { progress: 0.76, duration: 0.55, ease: 'power2.inOut', onUpdate: drawShape }, 0)
      .to(coverage, { progress: 1, duration: 0.27, ease: 'power2.out', onUpdate: drawShape }, 0.55)
      .to(rows, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.055, ease: 'power2.out' }, 0.83)
      .to(details, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.045, ease: 'power2.out' }, 1);

    const applyTarget = (open: boolean) => {
      // The page lock may have just removed a scrollbar and shifted the
      // trigger. Read its position before starting either direction.
      updateGeometry();
      if (reducedMotion.matches) {
        timeline.pause().progress(open ? 1 : 0, true);
        drawShape();
        phaseChangeRef.current(open ? 'open' : 'closed');
        return;
      }

      // A direction change can happen before the next GSAP frame. Pause at
      // an endpoint so an invisible timeline cannot continue after closing,
      // or leave reopening stuck while already positioned at its final frame.
      if ((!open && timeline.time() === 0) || (open && timeline.progress() === 1)) {
        timeline.pause();
        phaseChangeRef.current(open ? 'open' : 'closed');
        return;
      }

      phaseChangeRef.current(open ? 'opening' : 'closing');
      if (open) timeline.play();
      else timeline.reverse();
    };
    const handleMotionPreference = () => {
      // Finish the requested state immediately when reduction is enabled.
      // Returning to normal motion leaves the current endpoint intact.
      if (reducedMotion.matches) applyTarget(targetOpenRef.current);
    };
    controlRef.current = applyTarget;

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateGeometry);
    resizeObserver?.observe(surface);
    resizeObserver?.observe(button);
    window.addEventListener('resize', updateGeometry);
    reducedMotion.addEventListener('change', handleMotionPreference);
    if (targetOpenRef.current) applyTarget(true);

    return () => {
      controlRef.current = null;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateGeometry);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      timeline.kill();
    };
  }, { scope: rootRef });

  const setOpen = useCallback((open: boolean) => {
    if (targetOpenRef.current === open) return;
    targetOpenRef.current = open;
    controlRef.current?.(open);
  }, []);

  return { setOpen };
}
