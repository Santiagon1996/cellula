'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { Props as WarpTextProps } from './WarpText';
import styles from './warp-title.module.css';

const WarpText = lazy<ComponentType<WarpTextProps>>(() => import('./WarpText').catch(() => ({ default: () => null })));
const POINTER_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export type AboutWarpTitleProps = { text: string; id?: string; className?: string };

/** Only the first, real next/font family is eligible for the GPU text texture. */
export async function loadAcidFont(element: HTMLElement, text: string): Promise<string | null> {
  const family = getComputedStyle(element).getPropertyValue('--font-acid').split(',')[0]?.trim();
  if (!family || !document.fonts?.load) return null;
  const computed = getComputedStyle(element);
  const request = `${computed.fontWeight || '700'} ${computed.fontSize || '96px'} ${family}`;
  try {
    const faces = await document.fonts.load(request, text);
    await document.fonts.ready;
    return faces.some(face => face.status === 'loaded') && document.fonts.check(request, text) ? family : null;
  } catch { return null; }
}

export function AboutWarpTitle({ text, id, className }: AboutWarpTitleProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const [active, setActive] = useState(false);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [painted, setPainted] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setPainted(true), []);
  const onError = useCallback(() => { setFailed(true); setPainted(false); }, []);
  const split = text.lastIndexOf(' ');
  const lines = split > 0 ? `${text.slice(0, split)}\n${text.slice(split + 1)}` : text;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function' || typeof IntersectionObserver === 'undefined') return;
    const fine = window.matchMedia(POINTER_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    let disposed = false;
    let inView = false;
    let request = 0;
    const update = () => {
      if (disposed) return;
      const allowed = inView && fine.matches && !motion.matches && !document.hidden;
      setActive(allowed);
      if (!allowed) {
        request += 1;
        setPainted(false);
        return;
      }
      const version = ++request;
      void loadAcidFont(root, text).then(family => {
        if (disposed || version !== request) return;
        setFontFamily(family);
        if (!family) setFailed(true);
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: 0 });
    observer.observe(root);
    fine.addEventListener('change', update);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      disposed = true;
      request += 1;
      observer.disconnect();
      fine.removeEventListener('change', update);
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [text]);

  const ready = active && painted && !failed;
  const state = failed ? 'failed' : ready ? 'ready' : active ? 'loading' : 'fallback';
  return (
    <h2 ref={rootRef} id={id} className={[styles.title, className].filter(Boolean).join(' ')} aria-label={text} data-about-warp-state={state} data-about-warp-font={fontFamily ?? undefined}>
      <span className={styles.fallback} data-about-title-fallback>{lines}</span>
      <span className={styles.visual} aria-hidden="true">
        {active && fontFamily && !failed && (
          <Suspense fallback={null}>
            <WarpText
              text={lines}
              color="currentColor"
              warpStrength={0.055}
              warpScale={1.5}
              speed={0.45}
              lens="bulge"
              pointerInfluence={0.4}
              pointerStrength={0.3}
              refraction={0.012}
              chromatic={0.15}
              idleDrift={0}
              ripple
              clickRipple
              intro={false}
              fontFamily={fontFamily}
              fontSize="inherit"
              fontWeight={700}
              letterSpacing="-0.06em"
              lineHeight={0.9}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', minHeight: 0 }}
              onReady={onReady}
              onError={onError}
            />
          </Suspense>
        )}
      </span>
    </h2>
  );
}
