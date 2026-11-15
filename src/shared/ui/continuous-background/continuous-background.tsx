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
    const intro = document.querySelector<HTMLElement>('[data-chromatic-intro]');
    const copy = intro?.querySelector<HTMLElement>('[data-introduction-copy]');
    const composition = compositionRef.current;
    if (!hero || !atmosphere || !intro || !copy || !composition) return;
    if (typeof window.matchMedia !== 'function') return;

    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const slate = composition.querySelector<HTMLElement>('[data-chromatic-layer="slate"]');
      const overlap = composition.querySelector<HTMLElement>('[data-chromatic-layer="hero-overlap"]');
      const gradient = composition.querySelector<HTMLElement>('[data-chromatic-layer="intro-gradient"]');
      const cream = composition.querySelector<HTMLElement>('[data-chromatic-layer="cream"]');
      if (!slate || !overlap || !gradient || !cream) return;
      const root = rootRef.current;
      if (!root) return;
      root.dataset.chromaticMotion = 'true';

      const creamColor = getComputedStyle(document.documentElement).getPropertyValue('--color-cream').trim() || '#ede8e0';
      gsap.set(slate, { opacity: 1 });
      gsap.set(copy, { color: creamColor, opacity: 0, y: 12 });
      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      let sequenceStart = 0;
      let sequenceRange = 1;
      const getScrollProgress = () => Math.min(
        1,
        Math.max(0, (window.scrollY - sequenceStart) / sequenceRange),
      );

      const rebuildSequence = () => {
        const previousProgress = timeline.progress();
        timeline.clear();
        timeline
          .set(atmosphere, { opacity: 1, '--chromatic-edge-fade': '0%' }, 0)
          .set(overlap, { opacity: 0 }, 0)
          .set(gradient, { opacity: 0 }, 0)
          .set(cream, { opacity: 0 }, 0)
          .set(copy, { color: creamColor, opacity: 0, y: 12 }, 0);

        const heroTop = hero.getBoundingClientRect().top + window.scrollY;
        const heroBottom = heroTop + hero.getBoundingClientRect().height;
        const introTop = intro.getBoundingClientRect().top + window.scrollY;
        const introBottom = introTop + intro.getBoundingClientRect().height;
        const copyTop = copy.getBoundingClientRect().top + window.scrollY;
        const viewport = Math.max(window.innerHeight, 1);
        const range = Math.max(introBottom - heroTop, 1);
        sequenceStart = heroTop;
        sequenceRange = range;
        const at = (pageY: number) => Math.min(1, Math.max(0, (pageY - heroTop) / range));
        const minDuration = range * 0.015;

        const blendStart = at(heroTop + (heroBottom - heroTop) * 0.2);
        const heroEnd = at(heroBottom);
        const copyBottom = copyTop + copy.getBoundingClientRect().height;
        const copyStartY = Math.max(heroBottom, copyTop - viewport * 0.82);
        const copyRevealEndY = Math.min(introBottom, Math.max(copyStartY + minDuration, copyTop - viewport * 0.62));
        const copyFadeStartY = Math.max(copyRevealEndY, copyTop - viewport * 0.22);
        const copyFadeEndY = Math.min(introBottom, Math.max(copyFadeStartY + minDuration, copyTop + viewport * 0.18));
        const gradientStartY = Math.min(introBottom - minDuration, Math.max(copyFadeEndY, copyBottom + viewport * 0.2));
        const gradientEndY = introBottom;
        const creamStartY = gradientStartY + (gradientEndY - gradientStartY) * 0.55;

        const maskStartAt = at(heroTop);
        const blendStartAt = blendStart;
        const heroEndAt = heroEnd;
        const copyStartAt = at(copyStartY);
        const copyRevealEndAt = at(copyRevealEndY);
        const copyFadeStartAt = at(copyFadeStartY);
        const copyFadeEndAt = at(copyFadeEndY);
        const gradientStartAt = at(gradientStartY);
        const creamStartAt = at(creamStartY);

        timeline
          .fromTo(overlap, { opacity: 0 }, {
            opacity: 1, duration: Math.max(heroEndAt - blendStartAt, 0.001), immediateRender: false,
          }, blendStartAt)
          .fromTo(atmosphere, { '--chromatic-edge-fade': '0%' }, {
            '--chromatic-edge-fade': '48%',
            duration: Math.max(heroEndAt - maskStartAt, 0.001),
            ease: 'power2.out',
            immediateRender: false,
          }, maskStartAt)
          .fromTo(atmosphere, { opacity: 1 }, {
            opacity: 0.08, duration: Math.max(heroEndAt - blendStartAt, 0.001),
            ease: 'power2.out', immediateRender: false,
          }, blendStartAt)
          .fromTo(atmosphere, { opacity: 0.08 }, {
            opacity: 0, duration: Math.max(gradientStartAt - heroEndAt, 0.001), immediateRender: false,
          }, heroEndAt)
          .fromTo(overlap, { opacity: 1 }, {
            opacity: 0, duration: Math.max(gradientStartAt - heroEndAt, 0.001), immediateRender: false,
          }, heroEndAt)
          .fromTo(copy, { color: creamColor, opacity: 0, y: 12 }, {
            color: creamColor, opacity: 1, y: 0,
            duration: Math.max(copyRevealEndAt - copyStartAt, 0.001), immediateRender: false,
          }, copyStartAt)
          .to(copy, {
            opacity: 0, y: -8, duration: Math.max(copyFadeEndAt - copyFadeStartAt, 0.001),
          }, copyFadeStartAt)
          .fromTo(gradient, { opacity: 0 }, {
            opacity: 1, duration: Math.max(creamStartAt - gradientStartAt, 0.001), immediateRender: false,
          }, gradientStartAt)
          .fromTo(cream, { opacity: 0 }, {
            opacity: 1, duration: Math.max(1 - creamStartAt, 0.001), immediateRender: false,
          }, creamStartAt)
          .fromTo(gradient, { opacity: 1 }, {
            opacity: 0, duration: Math.max(1 - creamStartAt, 0.001), immediateRender: false,
          }, creamStartAt);

        timeline.progress(previousProgress);
      };

      rebuildSequence();
      ScrollTrigger.addEventListener('refreshInit', rebuildSequence);
      const trigger = ScrollTrigger.create({
        id: 'continuous-background-home-introduction-about',
        trigger: hero,
        start: 'top top',
        endTrigger: intro,
        end: 'bottom top',
        invalidateOnRefresh: true,
        // One measured scroll position controls every layer, including reverse scroll.
        // Native scrub is intentionally absent: this paused timeline is driven manually.
        onUpdate: () => timeline.progress(getScrollProgress()),
        onRefresh: () => timeline.progress(getScrollProgress()),
      });

      return () => {
        delete root.dataset.chromaticMotion;
        ScrollTrigger.removeEventListener('refreshInit', rebuildSequence);
        trigger.kill();
        timeline.kill();
      };
    });

    return () => media.revert();
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="continuous-background" aria-hidden="true">
      <div ref={compositionRef} className="continuous-background__composition" data-chromatic-composition="home-about">
        <div className="continuous-background__layer continuous-background__layer--slate" data-chromatic-layer="slate" />
        <div className="continuous-background__layer continuous-background__layer--hero-overlap" data-chromatic-layer="hero-overlap" />
        <div className="continuous-background__layer continuous-background__layer--intro-gradient" data-chromatic-layer="intro-gradient" />
        <div className="continuous-background__layer continuous-background__layer--cream" data-chromatic-layer="cream" />
      </div>
    </div>
  );
}
