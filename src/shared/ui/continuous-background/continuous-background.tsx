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
    const identityHeading = document.querySelector<HTMLElement>('[data-about-identity] h2');
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
      const paragraphs = Array.from(copy.querySelectorAll<HTMLElement>('[data-introduction-paragraph]'));
      gsap.set(copy, { color: creamColor });
      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      let sequenceStart = 0;
      let sequenceRange = 1;
      const getScrollProgress = () => Math.min(
        1,
        Math.max(0, (window.scrollY - sequenceStart) / sequenceRange),
      );

      const rebuildSequence = () => {
        timeline.clear();
        timeline
          .set(atmosphere, { opacity: 1, '--chromatic-edge-fade': '0%' }, 0)
          .set(overlap, { opacity: 0 }, 0)
          .set(gradient, { opacity: 1 }, 0)
          .set(cream, { opacity: 0 }, 0)
          .set([copy, ...paragraphs], { opacity: 1, y: 0 }, 0)
          .set(copy, { color: creamColor }, 0);

        // Measure layout without translations left by the previous scroll position.
        gsap.set([copy, ...paragraphs], { opacity: 1, y: 0 });
        const heroTop = hero.getBoundingClientRect().top + window.scrollY;
        const heroBottom = heroTop + hero.getBoundingClientRect().height;
        const introTop = intro.getBoundingClientRect().top + window.scrollY;
        const introBottom = introTop + intro.getBoundingClientRect().height;
        const viewport = Math.max(window.innerHeight, 1);
        const headingTop = identityHeading ? identityHeading.getBoundingClientRect().top + window.scrollY : introBottom;
        const range = Math.max(headingTop - heroTop, introBottom - heroTop, 1);
        sequenceStart = heroTop;
        sequenceRange = range;
        const at = (pageY: number) => Math.min(1, Math.max(0, (pageY - heroTop) / range));

        const blendStart = at(heroTop + (heroBottom - heroTop) * 0.2);
        const heroEnd = at(heroBottom);
        const copyBounds = copy.getBoundingClientRect();
        const copyBottom = copyBounds.bottom + window.scrollY;
        // A long introduction remains in document flow. Each paragraph is fully
        // revealed before its top enters the reading area and fades only after
        // its last line has passed it. Short copy can share a single envelope.
        const readingTargets = copyBounds.height <= viewport * 0.76 || !paragraphs.length ? [copy] : paragraphs;
        for (const target of readingTargets) {
          const bounds = target.getBoundingClientRect();
          const top = bounds.top + window.scrollY;
          const bottom = top + bounds.height;
          const revealStart = at(top - viewport * 0.94);
          const revealEnd = at(top - viewport * 0.78);
          const fadeStart = at(Math.max(top - viewport * 0.78, bottom - viewport * 0.16));
          const fadeEnd = at(bottom + viewport * 0.02);
          timeline
            .set(target, { opacity: 0, y: 12 }, 0)
            .fromTo(target, { opacity: 0, y: 12 }, {
              opacity: 1, y: 0, duration: Math.max(revealEnd - revealStart, 0.001), immediateRender: false,
            }, revealStart)
            .to(target, { opacity: 0, y: -8, duration: Math.max(fadeEnd - fadeStart, 0.001) }, fadeStart);
        }
        // The existing full-viewport layer now follows a continuous spatial
        // blend in the measured editorial gap. Text remains over Slate; the
        // heading reaches an already Cream surface. No section owns a seam.
        const editorialGap = Math.max(headingTop - copyBottom, 1);
        const bandStart = copyBottom + editorialGap * 0.12;
        const bandEnd = headingTop - editorialGap * 0.12;

        const maskStartAt = at(heroTop);
        const blendStartAt = blendStart;
        const heroEndAt = heroEnd;
        const atmosphereEndAt = at(copyBottom - viewport * 0.16);
        const creamStartAt = at(bandEnd);

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
            opacity: 0, duration: Math.max(atmosphereEndAt - heroEndAt, 0.001), immediateRender: false,
          }, heroEndAt)
          .fromTo(overlap, { opacity: 1 }, {
            opacity: 0, duration: Math.max(atmosphereEndAt - heroEndAt, 0.001), immediateRender: false,
          }, heroEndAt)
          .fromTo(gradient, {
            '--chromatic-transition-start': `${bandStart - heroTop}px`,
            '--chromatic-transition-end': `${bandEnd - heroTop}px`,
          }, {
            '--chromatic-transition-start': `${bandStart - heroTop - range}px`,
            '--chromatic-transition-end': `${bandEnd - heroTop - range}px`,
            duration: 1, immediateRender: false,
          }, 0)
          .fromTo(cream, { opacity: 0 }, {
            opacity: 1, duration: Math.max(1 - creamStartAt, 0.001), immediateRender: false,
          }, creamStartAt);

        timeline.progress(getScrollProgress());
        // A paused timeline at exactly zero need not render its starting set.
        // Initialize the same measured blend explicitly, also on restored scroll.
        gsap.set(gradient, {
          opacity: 1,
          '--chromatic-transition-start': `${bandStart - window.scrollY}px`,
          '--chromatic-transition-end': `${bandEnd - window.scrollY}px`,
        });
      };

      rebuildSequence();
      ScrollTrigger.addEventListener('refreshInit', rebuildSequence);
      const trigger = ScrollTrigger.create({
        id: 'continuous-background-home-introduction-about',
        trigger: hero,
        start: 'top top',
        endTrigger: identityHeading ?? intro,
        end: identityHeading ? 'top top' : 'bottom top',
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
