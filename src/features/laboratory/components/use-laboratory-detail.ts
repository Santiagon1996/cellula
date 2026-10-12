'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import type { LaboratorySelection } from '../types';

gsap.registerPlugin(Flip);

type DetailOptions = {
  selection: LaboratorySelection;
  onClosed: () => void;
  rootRef: RefObject<HTMLDivElement | null>;
  coverRef: RefObject<HTMLDivElement | null>;
  closeRef: RefObject<HTMLButtonElement | null>;
};

type SavedStyle = { element: HTMLElement; property: string; value: string; priority: string };

function changeStyle(element: HTMLElement, property: string, value: string): SavedStyle {
  const previous = { element, property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property) };
  element.style.setProperty(property, value);
  return previous;
}

function restoreStyle({ element, property, value, priority }: SavedStyle) {
  if (value) element.style.setProperty(property, value, priority);
  else element.style.removeProperty(property);
}

function lockBackground(root: HTMLElement) {
  const body = document.body;
  const html = document.documentElement;
  const gap = Math.max(0, window.innerWidth - html.clientWidth);
  const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
  const styles = [
    changeStyle(body, 'overflow', 'hidden'),
    changeStyle(html, 'overflow', 'hidden'),
    changeStyle(body, 'overscroll-behavior', 'none'),
    changeStyle(html, 'overscroll-behavior', 'none'),
  ];
  if (gap) styles.push(changeStyle(body, 'padding-right', `${padding + gap}px`));

  const toggle = document.querySelector<HTMLElement>('[aria-controls="home-navigation-panel"]');
  const navigation = toggle?.closest<HTMLElement>('[data-phase]');
  const background = new Set(document.querySelectorAll<HTMLElement>('main, .home-identity'));
  if (navigation) background.add(navigation);
  const inert = Array.from(background).filter((element) => !element.contains(root)).map((element) => {
    const previous = element.getAttribute('inert');
    element.setAttribute('inert', '');
    return { element, previous };
  });

  return () => {
    styles.forEach(restoreStyle);
    for (const { element, previous } of inert) {
      if (previous === null) element.removeAttribute('inert');
      else element.setAttribute('inert', previous);
    }
  };
}

/** A partially clipped carousel card must keep its visible bounds during the Flip. */
function sourceClip(source: HTMLElement) {
  const rect = source.getBoundingClientRect();
  let left = Math.max(0, rect.left);
  let right = Math.min(window.innerWidth, rect.right);
  let top = Math.max(0, rect.top);
  let bottom = Math.min(window.innerHeight, rect.bottom);
  for (let ancestor = source.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    const bounds = ancestor.getBoundingClientRect();
    if (/(hidden|clip|auto|scroll)/.test(style.overflowX)) {
      left = Math.max(left, bounds.left + ancestor.clientLeft);
      right = Math.min(right, bounds.right - ancestor.clientLeft);
    }
    if (/(hidden|clip|auto|scroll)/.test(style.overflowY)) {
      top = Math.max(top, bounds.top + ancestor.clientTop);
      bottom = Math.min(bottom, bounds.bottom - ancestor.clientTop);
    }
  }
  const percent = (value: number, size: number) => Math.min(100, Math.max(0, value / Math.max(1, size) * 100));
  return `inset(${percent(top - rect.top, rect.height)}% ${percent(rect.right - right, rect.width)}% ${percent(rect.bottom - bottom, rect.height)}% ${percent(left - rect.left, rect.width)}%)`;
}

export function useLaboratoryDetail({ selection, onClosed, rootRef, coverRef, closeRef }: DetailOptions) {
  const closeActionRef = useRef<(() => void) | null>(null);
  const onClosedRef = useRef(onClosed);
  useLayoutEffect(() => { onClosedRef.current = onClosed; }, [onClosed]);

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    const cover = coverRef.current;
    const button = closeRef.current;
    if (!rootElement || !cover || !button) return;
    const root = rootElement;

    const { source, trigger } = selection;
    const initialState = Flip.getState(source);
    const initialClip = sourceClip(source);
    const sourceImage = source.querySelector('img');
    const coverImage = cover.querySelector('img');
    if (sourceImage && coverImage) {
      const style = getComputedStyle(sourceImage);
      coverImage.style.objectFit = style.objectFit || 'cover';
      coverImage.style.objectPosition = style.objectPosition || '50% 50%';
      coverImage.style.transform = style.transform || 'none';
    }

    const unlock = lockBackground(root);
    const sourceVisibility = changeStyle(source, 'visibility', 'hidden');
    const editorial = Array.from(root.querySelectorAll<HTMLElement>('[data-lab-editorial]'));
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<gsap.core.Animation>();
    let phase: 'opening' | 'open' | 'closing' = 'opening';
    let revision = 0;
    let disposed = false;
    let restored = false;
    let completed = false;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const track = <T extends gsap.core.Animation>(animation: T): T => { animations.add(animation); return animation; };
    const killMotion = () => {
      revision += 1;
      animations.forEach((animation) => animation.kill());
      animations.clear();
    };
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.closest('[inert]') && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none');

    const onKeyDown = (event: KeyboardEvent) => {
      if (disposed || completed) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        const elements = focusables();
        const first = elements[0] ?? button;
        const last = elements.at(-1) ?? button;
        if (!root.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!disposed && !completed && !root.contains(event.target as Node)) button.focus({ preventScroll: true });
    };
    const restore = () => {
      if (restored) return;
      restored = true;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      media.removeEventListener('change', onMotionChange);
      restoreStyle(sourceVisibility);
      unlock();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
    const finishClose = () => {
      if (disposed || completed) return;
      completed = true;
      root.style.visibility = 'hidden';
      killMotion();
      restore();
      onClosedRef.current();
    };
    const settleOpen = () => {
      if (disposed || completed || phase === 'closing') return;
      phase = 'open';
      root.dataset.phase = 'open';
      gsap.set(cover, { clearProps: 'transform,width,height,top,left,position,minWidth,minHeight,maxWidth,maxHeight', clipPath: 'inset(0% 0% 0% 0%)' });
      if (coverImage) gsap.set(coverImage, { clearProps: 'transform' });
      gsap.set(root, { backgroundColor: 'var(--color-cream)' });
      track(gsap.to(editorial, { autoAlpha: 1, y: 0, duration: media.matches ? 0 : 0.35, overwrite: true }));
    };

    const shrink = () => {
      if (disposed || completed || phase !== 'closing') return;
      killMotion();
      const expected = revision;
      const bounds = source.getBoundingClientRect();
      if (!source.isConnected || bounds.width <= 0 || bounds.height <= 0 || media.matches) {
        finishClose();
        return;
      }
      track(gsap.to(root, { backgroundColor: 'transparent', duration: 0.55 }));
      track(gsap.to(cover, { clipPath: sourceClip(source), duration: 0.65, ease: 'power3.inOut' }));
      if (coverImage) track(gsap.to(coverImage, { transform: sourceImage ? getComputedStyle(sourceImage).transform || 'none' : 'none', duration: 0.65, ease: 'power3.inOut' }));
      // getState(source) would complete its cancelled opening Flip before fitting.
      const fit = Flip.fit(cover, source, {
        scale: false,
        duration: 0.65,
        ease: 'power3.inOut',
        onComplete: () => { if (expected === revision) finishClose(); },
      });
      if (fit && 'kill' in fit) track(fit as gsap.core.Tween);
      else finishClose();
    };

    function close() {
      if (disposed || completed || phase === 'closing') return;
      phase = 'closing';
      root.dataset.phase = 'closing';
      killMotion();
      if (media.matches) { finishClose(); return; }
      const expected = revision;
      track(gsap.to(editorial, { autoAlpha: 0, y: 16, duration: 0.22, overwrite: true }));
      track(gsap.to(root, {
        scrollTop: 0,
        duration: root.scrollTop ? 0.3 : 0.22,
        ease: 'power2.inOut',
        onComplete: () => { if (expected === revision) shrink(); },
      }));
    }

    function onResize() {
      if (disposed || completed) return;
      // Removing the document scrollbar also emits visualViewport resize.
      if (viewportWidth === window.innerWidth && viewportHeight === window.innerHeight) return;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      if (phase === 'opening') { killMotion(); settleOpen(); }
      else if (phase === 'closing') {
        // Retarget a live close from its current geometry to the resized card.
        root.scrollTop = 0;
        gsap.set(editorial, { autoAlpha: 0 });
        shrink();
      }
    }

    function onMotionChange() {
      if (disposed || completed || !media.matches) return;
      killMotion();
      if (phase === 'closing') finishClose();
      else if (phase === 'opening') settleOpen();
      else gsap.set(editorial, { autoAlpha: 1, y: 0 });
    }

    closeActionRef.current = close;
    root.dataset.phase = 'opening';
    root.style.visibility = '';
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    media.addEventListener('change', onMotionChange);
    button.focus({ preventScroll: true });
    gsap.set(editorial, { autoAlpha: 0, y: 22 });
    gsap.set(root, { backgroundColor: 'transparent' });
    gsap.set(cover, { clipPath: initialClip });
    if (media.matches) settleOpen();
    else {
      const expected = revision;
      track(gsap.to(root, { backgroundColor: 'var(--color-cream)', duration: 0.55 }));
      track(gsap.to(cover, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut' }));
      if (coverImage) track(gsap.to(coverImage, { transform: 'none', duration: 0.8, ease: 'power3.inOut' }));
      track(Flip.from(initialState, {
        targets: cover,
        scale: false,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => { if (expected === revision) settleOpen(); },
      }));
    }

    return () => {
      disposed = true;
      closeActionRef.current = null;
      killMotion();
      restore();
      gsap.set([cover, ...editorial], { clearProps: 'all' });
      if (coverImage) gsap.set(coverImage, { clearProps: 'transform' });
      root.style.backgroundColor = '';
      root.style.visibility = '';
    };
  }, [selection, rootRef, coverRef, closeRef]);

  return useCallback(() => closeActionRef.current?.(), []);
}
