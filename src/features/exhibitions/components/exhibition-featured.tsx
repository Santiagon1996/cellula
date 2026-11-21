'use client';

import { useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { featuredExhibition } from '../data/featured-exhibition';

/** A photographic introduction to the existing gallery; no carousel state is owned here. */
export function ExhibitionFeatured() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const blurred = root.querySelector('[data-featured-blurred]');
      const mediaLayer = root.querySelector('.exhibition-featured__media');
      if (!blurred || !mediaLayer) return;
      const reveal = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'exhibition-featured-reveal',
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      // One viewport crossing: focus, hold, defocus, then dissolve into the gallery's Cream.
      // The sharp base stays opaque; only the photographic blur layer controls focus.
      reveal
        .fromTo(mediaLayer, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0)
        .fromTo(blurred, { opacity: 1 }, { opacity: 0, duration: 0.4 }, 0)
        .to(blurred, { opacity: 1, duration: 0.2 }, 0.7)
        .to(mediaLayer, { opacity: 0, duration: 0.1 }, 0.9);
      return () => {
        reveal.scrollTrigger?.kill();
        reveal.kill();
      };
    });
    return () => media.revert();
  }, { scope: rootRef });

  const image = featuredExhibition.image;
  const style = {
    '--featured-position': image.position,
    '--featured-position-mobile': image.mobilePosition,
  } as CSSProperties;

  return (
    <header ref={rootRef} className="exhibition-featured" style={style}
      data-featured-exhibition data-editorial-status={featuredExhibition.editorialStatus}>
      <div className="exhibition-featured__media">
        <Image src={image.src} alt={image.alt} fill sizes="(max-aspect-ratio: 9/5) 180svh, 100vw"
          className="exhibition-featured__image exhibition-featured__sharp" data-featured-sharp />
        <Image src={image.blurredSrc} alt="" aria-hidden="true" fill sizes="100vw" unoptimized
          className="exhibition-featured__image exhibition-featured__blurred" data-featured-blurred />
      </div>
      <div className="exhibition-featured__editorial">
        <p className="exhibition-featured__label">{featuredExhibition.label}</p>
        <h2 className="exhibition-featured__title" aria-label={featuredExhibition.coverTitle.join(' ')}>{featuredExhibition.coverTitle.map((line, index) => (
          <span key={line}>{index > 0 ? ' ' : ''}{line}</span>
        ))}</h2>
      </div>
      <div className="exhibition-featured__caption">
        <p>{featuredExhibition.coverCaption}</p>
      </div>
    </header>
  );
}
