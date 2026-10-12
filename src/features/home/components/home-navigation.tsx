'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { HomeNavigationContent } from './home-navigation-content';
import { useHomeNavigationMotion, type NavigationPhase } from './use-home-navigation-motion';
import styles from './home-navigation.module.css';

/** Keep the document in place so ScrollTrigger continues to use its current scroll. */
function lockPage(root: HTMLElement) {
  const body = document.body;
  const html = document.documentElement;
  const gap = Math.max(0, window.innerWidth - html.clientWidth);
  const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
  const changes: [HTMLElement, string, string][] = [
    [body, 'overflow', 'hidden'],
    [body, 'overscroll-behavior', 'none'],
    [html, 'overflow', 'hidden'],
    [html, 'overscroll-behavior', 'none'],
    [root, '--nav-scrollbar-gap', `${gap}px`],
  ];
  if (gap) changes.push([body, 'padding-right', `${padding + gap}px`]);

  const previousStyles = changes.map(([element, property, value]) => {
    const previous = element.style.getPropertyValue(property);
    const priority = element.style.getPropertyPriority(property);
    element.style.setProperty(property, value);
    return { element, property, previous, priority };
  });
  const background = Array.from(document.querySelectorAll<HTMLElement>('main, .home-identity'))
    .filter((element) => !element.contains(root))
    .map((element) => {
      const inert = element.getAttribute('inert');
      element.setAttribute('inert', '');
      return { element, inert };
    });

  return () => {
    for (const { element, property, previous, priority } of previousStyles) {
      if (previous) element.style.setProperty(property, previous, priority);
      else element.style.removeProperty(property);
    }
    for (const { element, inert } of background) {
      if (inert === null) element.removeAttribute('inert');
      else element.setAttribute('inert', inert);
    }
  };
}

function focusDestination(href: string) {
  const destination = document.getElementById(href.slice(1));
  if (!destination) return;
  if (window.location.hash !== href) window.history.pushState(null, '', href);
  destination.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });

  // Sections are not normally focusable. Remove the temporary tab stop on blur.
  const hadTabIndex = destination.hasAttribute('tabindex');
  if (!hadTabIndex) destination.setAttribute('tabindex', '-1');
  const restore = () => {
    destination.removeEventListener('blur', restore);
    if (!hadTabIndex) destination.removeAttribute('tabindex');
  };
  destination.addEventListener('blur', restore, { once: true });
  destination.focus({ preventScroll: true });
  return restore;
}

export function HomeNavigation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const desiredOpenRef = useRef(false);
  const phaseRef = useRef<NavigationPhase>('closed');
  const unlockRef = useRef<(() => void) | null>(null);
  const destinationRef = useRef<string | null>(null);
  const restoreDestinationRef = useRef<(() => void) | undefined>(undefined);
  const [phase, setPhase] = useState<NavigationPhase>('closed');
  const [expanded, setExpanded] = useState(false);

  const onPhaseChange = useCallback((nextPhase: NavigationPhase) => {
    // An old completion must not unlock a menu that has just reversed direction.
    if (nextPhase === 'closed' && desiredOpenRef.current) return;
    if (nextPhase === 'open' && !desiredOpenRef.current) return;
    phaseRef.current = nextPhase;
    setPhase(nextPhase);

    if (nextPhase === 'closed') {
      unlockRef.current?.();
      unlockRef.current = null;
      const destination = destinationRef.current;
      destinationRef.current = null;
      if (destination) {
        restoreDestinationRef.current?.();
        restoreDestinationRef.current = focusDestination(destination);
      } else {
        buttonRef.current?.focus({ preventScroll: true });
      }
    }
  }, []);

  const { setOpen } = useHomeNavigationMotion({
    rootRef, panelRef, surfaceRef, buttonRef, onPhaseChange,
  });

  const requestOpen = useCallback((open: boolean, keepDestination = false) => {
    desiredOpenRef.current = open;
    setExpanded(open);
    if (!keepDestination) destinationRef.current = null;
    if (open && rootRef.current && !unlockRef.current) {
      unlockRef.current = lockPage(rootRef.current);
    }
    buttonRef.current?.focus({ preventScroll: true });
    setOpen(open);
  }, [setOpen]);

  const onNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    destinationRef.current = event.currentTarget.getAttribute('href');
    requestOpen(false, true);
  }, [requestOpen]);

  useEffect(() => {
    // Wait for React to remove inert before moving focus into the revealed links.
    if (phase === 'open' && desiredOpenRef.current) {
      panelRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => {
    const focusableElements = () => {
      const button = buttonRef.current;
      if (!button) return [];
      const links = phaseRef.current === 'open'
        ? Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])
        : [];
      return [button, ...links];
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!unlockRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        requestOpen(false);
      } else if (event.key === 'Tab') {
        const elements = focusableElements();
        const index = elements.indexOf(document.activeElement as HTMLButtonElement | HTMLAnchorElement);
        if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === elements.length - 1)) {
          event.preventDefault();
          elements[event.shiftKey ? elements.length - 1 : 0]?.focus({ preventScroll: true });
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (unlockRef.current && !rootRef.current?.contains(event.target as Node)) {
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      unlockRef.current?.();
      unlockRef.current = null;
      restoreDestinationRef.current?.();
    };
  }, [requestOpen]);

  const modal = phase !== 'closed';

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-phase={phase}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal ? true : undefined}
      aria-label={modal ? 'Navegación de Célula' : undefined}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.toggle} font-mono font-medium`}
        data-open={expanded}
        aria-expanded={expanded}
        aria-controls="home-navigation-panel"
        aria-label={expanded ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => requestOpen(!desiredOpenRef.current)}
      >
        <span className={styles.toggleLabel} aria-hidden="true">
          <span data-state="closed">MENÚ</span>
          <span data-state="open">CERRAR</span>
        </span>
        <span className={styles.toggleMark} aria-hidden="true">
          <span data-nav-toggle-stroke />
          <span data-nav-toggle-stroke />
        </span>
      </button>
      <div
        ref={panelRef}
        id="home-navigation-panel"
        className={styles.panel}
        aria-hidden={phase !== 'open'}
        inert={phase !== 'open'}
      >
        <svg
          ref={surfaceRef}
          className={styles.surface}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path data-nav-shape d="M 1000 0 Z" />
        </svg>
        <HomeNavigationContent onNavigate={onNavigate} />
      </div>
    </div>
  );
}
