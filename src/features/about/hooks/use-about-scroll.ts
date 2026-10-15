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
      const fragments = root.querySelectorAll<HTMLElement>('[data-about-fragment]');
      const declaration = root.querySelector<HTMLElement>('[data-about-declaration]');
      const finale = root.querySelector<HTMLElement>('[data-about-act="transform"]');
      const shapes = root.querySelectorAll<HTMLElement>('[data-about-converge]');
      if (!intro || fragments.length !== 3 || !declaration || !finale || shapes.length !== 3) return;

      const decompose = gsap.timeline({ scrollTrigger: {
        id: 'about-decompose', trigger: intro, start: 'top 65%', end: 'bottom 30%',
        scrub: .65, invalidateOnRefresh: true,
      } });
      decompose
        .to(fragments[0], { x: compact ? -8 : -16, y: compact ? 12 : 65, rotation: -7, scale: .94, duration: .65, ease: 'none' }, .25)
        .to(fragments[1], { x: compact ? 16 : 95, y: compact ? -18 : -45, rotation: 9, scale: compact ? 1.15 : 1.3, duration: .65, ease: 'none' }, .28)
        .to(fragments[2], { x: compact ? 2 : 35, y: compact ? 25 : 95, rotation: -3, scale: .93, opacity: .68, duration: .65, ease: 'none' }, .32)
        .to(root.querySelector('[data-about-wash]'), { opacity: .15, duration: .65, ease: 'none' }, .35);

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
      transform
        .to(root.querySelector('[data-about-final-connection]'), { opacity: .18, strokeDasharray: '2 6', duration: .8, ease: 'none' }, .15)
        .to(root.querySelector('[data-about-orbit]'), { scale: 1.45, opacity: .95, rotation: 45, duration: 1, ease: 'none' }, .1)
        .fromTo(root.querySelector('[data-about-final-statement]'), { y: compact ? 16 : 32 }, { y: 0, duration: .8, ease: 'none' }, .22);

      if (!context.conditions?.fine || compact) return;
      const question = root.querySelector<HTMLElement>('[data-about-question]');
      if (!question) return;
      // Cursor owns the visual wrapper; scroll owns its fragment children.
      const moveX = gsap.quickTo(question, 'x', { duration: .65, ease: 'power3.out' });
      const moveY = gsap.quickTo(question, 'y', { duration: .65, ease: 'power3.out' });
      const move = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        const rect = intro.getBoundingClientRect();
        moveX(((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 14);
        moveY(((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 10);
      };
      const leave = () => { moveX(0); moveY(0); };
      intro.addEventListener('pointermove', move, { passive: true });
      intro.addEventListener('pointerleave', leave);
      window.addEventListener('blur', leave);
      return () => {
        intro.removeEventListener('pointermove', move);
        intro.removeEventListener('pointerleave', leave);
        window.removeEventListener('blur', leave);
        moveX.tween.kill();
        moveY.tween.kill();
      };
    });

    // Local fonts may settle after hydration. Refresh once, never on scroll.
    void document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, { scope: rootRef });
}
