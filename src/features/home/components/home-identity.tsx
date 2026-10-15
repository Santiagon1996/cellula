'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * One persistent identity whose visual state is derived only from scroll progress.
 * At the top, show the complete wordmark; as the hero scrolls away, move it
 * toward the nav corner and progressively reveal the original compact symbol.
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

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (progress: number) => {
      const t = clamp01(progress / 0.94);
      const symbolRect = symbol.getBoundingClientRect();
      const wordmarkWidth = wordmark.offsetWidth;
      const targetX = symbolRect.left + symbolRect.width / 2 - window.innerWidth / 2;
      const targetY = symbolRect.top + symbolRect.height / 2 - window.innerHeight / 2;
      const targetScale = symbolRect.width / Math.max(1, wordmarkWidth);
      const fadeWordmark = clamp01((t - 0.55) / 0.35);
      const fadeSymbol = clamp01((t - 0.55) / 0.35);

      gsap.set(wordmark, {
        x: targetX * t,
        y: targetY * t,
        scale: 1 - (1 - targetScale) * t,
        autoAlpha: reducedMotion ? (t < 0.5 ? 1 : 0) : 1 - fadeWordmark,
      });
      gsap.set(symbol, {
        scale: reducedMotion ? 1 : 0.86 + 0.14 * fadeSymbol,
        autoAlpha: reducedMotion ? (t >= 0.5 ? 1 : 0) : fadeSymbol,
      });
    };

    // Explicitly initialize the correct state instead of relying on the
    // starting position of a paused timeline / the browser's restored scroll.
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * 0.82),
      invalidateOnRefresh: true,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });

    render(trigger.progress);
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
              sizes="(max-width: 700px) 82vw, 670px"
            />
          </h1>
        </div>
      </div>
      <div ref={symbolRef} className="home-identity__symbol" aria-hidden="true">
        <Image
          src="/home/celula-symbol.png"
          alt=""
          width={378}
          height={280}
          sizes="90px"
          loading="eager"
        />
      </div>
    </div>
  );
}
