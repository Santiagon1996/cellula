'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Independent, reversible acts. Geometry is read only at setup / refresh. */
export function useAboutScroll(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = gsap.matchMedia();
    let disposed = false;

    media.add({
      reduced: '(prefers-reduced-motion: reduce)',
      compact: '(max-width: 767px)',
      fine: '(hover: hover) and (pointer: fine)',
      all: '(min-width: 0px)',
    }, (context) => {
      if (context.conditions?.reduced) return;
      const compact = !!context.conditions?.compact;
      const intro = root.querySelector<HTMLElement>('[data-about-act="decompose"]');
      const declaration = root.querySelector<HTMLElement>('[data-about-declaration]');
      const finale = root.querySelector<HTMLElement>('[data-about-act="transform"]');
      const shapes = root.querySelectorAll<HTMLElement>('[data-about-converge]');
      if (!intro || !declaration || !finale) return;

      // The official Warp Text owns the graphical title. Only its separate
      // HTML fallback receives a small reveal on compact/coarse screens.
      const fallback = root.querySelector('[data-about-title-fallback]');
      if (fallback && (compact || !context.conditions?.fine)) {
        gsap.fromTo(fallback, { y: 12 }, {
          y: 0, duration: .7, ease: 'power2.out',
          scrollTrigger: { id: 'about-question-fallback', trigger: intro, start: 'top 85%', once: true },
        });
      }

      gsap.fromTo(declaration, { clipPath: 'inset(0% 0% 100% 0%)', y: 26 }, {
        clipPath: 'inset(0% 0% 0% 0%)', y: 0, ease: 'none',
        scrollTrigger: { id: 'about-declaration', trigger: declaration, start: 'top 95%', end: 'top 63%', scrub: .4, invalidateOnRefresh: true },
      });

      const transform = gsap.timeline({ scrollTrigger: {
        id: 'about-transform', trigger: finale, start: 'top 80%', end: 'center 48%',
        scrub: .7, invalidateOnRefresh: true,
      } });
      shapes.forEach((shape, index) => {
        transform.to(shape, {
          x: () => (shape.parentElement?.clientWidth ?? 0) * (.45 + index * .045) - shape.offsetLeft - shape.offsetWidth / 2,
          y: () => (shape.parentElement?.clientHeight ?? 0) * (.42 + index * .04) - shape.offsetTop - shape.offsetHeight / 2,
          rotation: index % 2 ? -32 : 24, scale: 1.12, opacity: .92, borderRadius: '50%',
          duration: 1, ease: 'none',
        }, index * .07);
      });
      const connection = root.querySelector('[data-about-final-connection]');
      const orbit = root.querySelector('[data-about-orbit]');
      const statement = root.querySelector('[data-about-final-statement]');
      if (connection) transform.to(connection, { opacity: .18, strokeDasharray: '2 6', duration: .8, ease: 'none' }, .15);
      if (orbit) transform.to(orbit, { scale: 1.45, opacity: .95, rotation: 45, duration: 1, ease: 'none' }, .1);
      if (statement) transform.fromTo(statement, { y: compact ? 16 : 32 }, { y: 0, duration: .8, ease: 'none' }, .22);

      const material = root.querySelector<HTMLElement>('[data-about-material]');
      const photographs = root.querySelectorAll<HTMLElement>('[data-about-material-image]');
      if (material && photographs.length) {
        const matter = gsap.timeline({ scrollTrigger: {
          id: 'about-matter', trigger: material, start: 'top 90%', end: 'bottom 40%',
          scrub: .6, invalidateOnRefresh: true,
        } });
        photographs.forEach((photograph, index) => {
          matter.fromTo(photograph,
            { y: compact ? 12 : 36 + index * 10, opacity: .65, rotation: compact ? 0 : index % 2 ? 3 : -3 },
            { y: compact ? -4 : -12 - index * 6, opacity: 1, rotation: 0, duration: 1, ease: 'none' }, index * .15);
        });
      }
    });

    // Local fonts may settle after hydration. Refresh once, never on scroll.
    void document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, { scope: rootRef });
}
