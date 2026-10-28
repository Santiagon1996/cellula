'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

export function ContinuousBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const hero = document.querySelector<HTMLElement>('.home-hero');
    const atmosphere = hero?.querySelector<HTMLElement>('.home-atmosphere');
    const composition = compositionRef.current;
    if (!hero || !atmosphere || !composition) return;

    if (typeof window.matchMedia !== 'function') {
      composition.style.opacity = '1';
      return;
    }

    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const transition = gsap.timeline({
        scrollTrigger: {
          id: 'continuous-background-home-about',
          trigger: hero,
          start: 'top top',
          end: 'bottom 82%',
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });

      transition.fromTo(composition, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'none' }, 0);
      transition.fromTo(atmosphere, { opacity: 1 }, { opacity: 0, duration: 1, ease: 'none' }, 0);
    });

    return () => media.revert();
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="continuous-background" aria-hidden="true">
      <div
        ref={compositionRef}
        className="continuous-background__composition"
        data-chromatic-composition="home-about"
      />
    </div>
  );
}
