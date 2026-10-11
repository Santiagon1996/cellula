'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-linked identity transition: original wordmark travels toward the
 * navigation corner, scales down and gives way to CÉLULA's original symbol.
 * The mark stays above the gradients and is never recreated with a font.
 */
export function HomeIdentity() {
  const rootRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const wordmark = wordmarkRef.current;
    const symbol = symbolRef.current;
    const hero = document.querySelector<HTMLElement>('.home-hero');
    if (!wordmark || !symbol || !hero) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      gsap.set(wordmark, { autoAlpha: 0 });
      gsap.set(symbol, { autoAlpha: 1, scale: 1 });
      return;
    }

    // Keep the hero mark visible on first paint, symbol hidden until scrolling.
    gsap.set(wordmark, { autoAlpha: 1 });
    gsap.set(symbol, { autoAlpha: 0 });

    // Delta from the wordmark's centered bounding box to symbol's nav position.
    const offsetX = () => {
      const symbolRect = symbol.getBoundingClientRect();
      return symbolRect.left + symbolRect.width / 2 - window.innerWidth / 2;
    };
    const offsetY = () => {
      const symbolRect = symbol.getBoundingClientRect();
      return symbolRect.top + symbolRect.height / 2 - window.innerHeight / 2;
    };

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 0.82),
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(wordmark, {
        x: offsetX,
        y: offsetY,
        scale: 0.15,
        duration: 0.78,
      }, 0)
      .to(wordmark, { autoAlpha: 0, duration: 0.29 }, 0.59)
      .fromTo(symbol,
        { autoAlpha: 0, scale: 0.72 },
        { autoAlpha: 1, scale: 1, duration: 0.41, immediateRender: false },
        0.51,
      );
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="home-identity">
      <div className="home-identity__wordmark-anchor">
        <div ref={wordmarkRef} className="home-identity__wordmark">
          <h1 className="home-identity__heading">
            <Image
              src="/home/celula-wordmark.png"
              alt="Cél·ula"
              width={558}
              height={162}
              priority
              sizes="(max-width: 700px) 78vw, 700px"
            />
          </h1>
        </div>
      </div>
      <div ref={symbolRef} className="home-identity__symbol" aria-hidden="true">
        <Image src="/home/celula-symbol.png" alt="" width={378} height={280} sizes="90px" />
      </div>
    </div>
  );
}
