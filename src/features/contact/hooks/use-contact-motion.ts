'use client';

import { useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContactPanelId } from '../types';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scroll, panel selection and pointer response own separate transforms. */
export function useContactMotion(rootRef: RefObject<HTMLElement | null>, active: ContactPanelId) {
  const activeRef = useRef(active);
  const selectRef = useRef<((id: ContactPanelId) => void) | null>(null);
  const introRevealed = useRef(false);
  const finaleRevealed = useRef(false);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const stage = root.querySelector<HTMLElement>('[data-contact-stage]');
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-contact-panel]'));
    const reveals = panels.flatMap((panel) => Array.from(panel.querySelectorAll<HTMLElement>('[data-contact-reveal]')));
    const panelStyles = new Map([...panels, ...reveals].map((element) => [element, element.getAttribute('style')]));
    const normalizePanels = () => {
      for (const [element, style] of panelStyles) {
        if (style === null) element.removeAttribute('style');
        else element.setAttribute('style', style);
      }
    };
    const media = gsap.matchMedia();
    let disposed = false;

    media.add({
      all: '(min-width: 0px)',
      reduced: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)',
    }, (context) => {
      let selected = activeRef.current;
      let departing = selected;
      let transitioning = false;
      const reduced = !!context.conditions?.reduced;
      const removers: Array<() => void> = [];
      const pointerTweens: gsap.core.Tween[] = [];
      let transition: gsap.core.Timeline | undefined;
      let prepareTransition: (() => void) | undefined;

      // A preference change during a transition must expose the latest React
      // selection immediately, with CSS owning the resting panel visibility.
      normalizePanels();

      if (!reduced && panels.length) {
        transition = gsap.timeline({
          paused: true,
          onComplete: () => {
            transitioning = false;
            normalizePanels();
          },
        });
        const motions = panels.map((panel) => {
          const id = panel.dataset.contactPanel as ContactPanelId;
          transition!.to(panel, {
            yPercent: () => id === departing ? -105 : 0,
            opacity: () => id === departing ? 0 : 1,
            duration: 0.72,
            ease: 'power3.inOut',
          }, 0);
          const content = Array.from(panel.querySelectorAll<HTMLElement>('[data-contact-reveal]'));
          if (content.length) {
            transition!.to(content, {
              y: 0,
              opacity: 1,
              duration: 0.36,
              stagger: { amount: 0.12 },
              ease: 'power3.out',
            }, 0.3);
          }
          return {
            panel, id,
            y: gsap.quickSetter(panel, 'yPercent'),
            opacity: gsap.quickSetter(panel, 'opacity'),
            content: content.map((element) => ({
              y: gsap.quickSetter(element, 'y', 'px'),
              opacity: gsap.quickSetter(element, 'opacity'),
            })),
          };
        });
        prepareTransition = () => {
          motions.forEach(({ panel, id, y, opacity, content }) => {
            panel.style.visibility = id === selected || id === departing ? 'visible' : 'hidden';
            y(id === selected ? 105 : 0);
            opacity(id === selected ? 0 : 1);
            content.forEach((item) => {
              item.y(id === selected ? 22 : 0);
              item.opacity(id === selected ? 0 : 1);
            });
          });
        };
      }

      const select = (id: ContactPanelId) => {
        if (id === selected) return;
        // Finish the previous destination before retargeting. One reusable
        // timeline means repeated clicks cannot accumulate competing tweens.
        if (transitioning) transition?.progress(1).pause();
        departing = selected;
        selected = id;
        if (!transition) {
          normalizePanels();
          return;
        }
        transitioning = true;
        prepareTransition?.();
        transition.invalidate().restart();
        // Render the initial mask position before the browser paints the new
        // data-active state, including when the GSAP ticker was sleeping.
        transition.render(0, false, true);
      };
      selectRef.current = select;

      if (!reduced) {
        const words = root.querySelectorAll<HTMLElement>('[data-contact-word]');
        const finale = root.querySelector<HTMLElement>('[data-contact-finale]');
        if (words.length && !introRevealed.current) {
          gsap.fromTo(words, { yPercent: 110, rotation: 2 }, {
            yPercent: 0,
            rotation: 0,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power3.out',
            onComplete: () => { introRevealed.current = true; },
            scrollTrigger: {
              id: 'contact-intro', trigger: root, start: 'top 88%', once: true,
            },
          });
        }
        if (finale && !finaleRevealed.current) {
          gsap.fromTo(finale, { y: 24, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power3.out',
            onComplete: () => { finaleRevealed.current = true; },
            scrollTrigger: {
              id: 'contact-finale', trigger: finale, start: 'top 94%', once: true,
            },
          });
        }

        const art = root.querySelector<HTMLElement>('[data-contact-art]');
        if (stage && art && context.conditions?.fine) {
          const moveX = gsap.quickTo(art, 'x', { duration: 0.5, ease: 'power3.out' });
          const moveY = gsap.quickTo(art, 'y', { duration: 0.5, ease: 'power3.out' });
          pointerTweens.push(moveX.tween, moveY.tween);
          const move = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            const bounds = stage.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
            const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
            moveX(Math.max(-8, Math.min(8, x * 16)));
            moveY(Math.max(-8, Math.min(8, y * 16)));
          };
          const leave = () => { moveX(0); moveY(0); };
          stage.addEventListener('pointermove', move, { passive: true });
          stage.addEventListener('pointerleave', leave);
          stage.addEventListener('pointercancel', leave);
          window.addEventListener('blur', leave);
          removers.push(() => {
            stage.removeEventListener('pointermove', move);
            stage.removeEventListener('pointerleave', leave);
            stage.removeEventListener('pointercancel', leave);
            window.removeEventListener('blur', leave);
          });
        }
      }

      return () => {
        if (selectRef.current === select) selectRef.current = null;
        removers.forEach((remove) => remove());
        pointerTweens.forEach((tween) => tween.kill());
        transition?.kill();
        normalizePanels();
      };
    });

    void document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, { scope: rootRef });

  useGSAP(() => {
    activeRef.current = active;
    selectRef.current?.(active);
  }, { scope: rootRef, dependencies: [active] });
}
