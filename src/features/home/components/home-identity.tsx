'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Wordmark-to-symbol transition driven by vertical scroll.
 * Both original artwork files are provided by CÉLULA and stored locally.
 * The artwork crossfades; no font or synthetic logo is substituted.
 */
export function HomeIdentity() {
  const rootRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const wordmark = wordmarkRef.current;
    const symbol = symbolRef.current;
    if (!wordmark || !symbol) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) {
      // No animation: keep the compact symbol in view while the page scrolls.
      gsap.set(wordmark, { autoAlpha: 0 });
      gsap.set(symbol, { autoAlpha: 1, scale: 1 });
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: document.getElementById('inicio'),
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 0.78),
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(wordmark, { scale: 0.42, y: '-32vh', x: '-25vw', autoAlpha: 0, duration: 0.8 }, 0)
      .fromTo(symbol, { autoAlpha: 0, scale: 0.66 }, { autoAlpha: 1, scale: 1, duration: 0.6 }, 0.34);
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="home-identity">
      <div ref={wordmarkRef} className="home-identity__wordmark">
        <h1 className="home-identity__heading">
          <Image
            src="/home/celula-wordmark.png"
            alt="Cél·ula"
            width={558}
            height={162}
            priority
            sizes="(max-width: 700px) 77vw, 700px"
          />
        </h1>
      </div>
      <div ref={symbolRef} className="home-identity__symbol" aria-hidden="true">
        <Image src="/home/celula-symbol.png" alt="" width={378} height={280} sizes="90px" />
      </div>
    </div>
  );
}
