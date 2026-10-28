import { useLayoutEffect } from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContinuousBackground } from './continuous-background';

const motion = vi.hoisted(() => ({
  reduced: false,
  add: vi.fn(),
  revert: vi.fn(),
  timeline: vi.fn(),
  fromTo: vi.fn(),
  transitionOptions: [] as Array<{ scrollTrigger: Record<string, unknown> }>,
}));
let originalMatchMedia: PropertyDescriptor | undefined;

vi.mock('@gsap/react', () => ({
  useGSAP: (callback: () => (() => void) | undefined) => useLayoutEffect(callback, [callback]),
}));

vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    matchMedia: () => ({
      add: (query: string, callback: () => void) => {
        motion.add(query, callback);
        if (!motion.reduced) callback();
      },
      revert: motion.revert,
    }),
    timeline: (options: { scrollTrigger: Record<string, unknown> }) => {
      motion.timeline(options);
      motion.transitionOptions.push(options);
      return { fromTo: motion.fromTo };
    },
  },
}));

function renderBackground() {
  return render(
    <>
      <section className="home-hero">
        <div className="home-atmosphere" />
      </section>
      <ContinuousBackground />
      <section data-about-section data-chromatic-flow />
    </>,
  );
}

beforeEach(() => {
  originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn() });
  motion.reduced = false;
  motion.add.mockReset();
  motion.revert.mockReset();
  motion.timeline.mockReset();
  motion.fromTo.mockReset();
  motion.transitionOptions = [];
});

afterEach(() => {
  vi.clearAllMocks();
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else Reflect.deleteProperty(window, 'matchMedia');
});

describe('ContinuousBackground', () => {
  it('renders one decorative composition and links it to the real Home hero', () => {
    renderBackground();

    const composition = document.querySelector('[data-chromatic-composition="home-about"]');
    expect(composition).toBeInTheDocument();
    expect(composition?.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('[data-about-section][data-chromatic-flow]')).not.toBeNull();
  });

  it('creates one reversible scroll-scrubbed shader-to-background transition', () => {
    renderBackground();

    expect(motion.add).toHaveBeenCalledWith('(prefers-reduced-motion: no-preference)', expect.any(Function));
    expect(motion.transitionOptions).toHaveLength(1);
    expect(motion.timeline).toHaveBeenCalledOnce();
    expect(motion.transitionOptions[0].scrollTrigger).toMatchObject({
      id: 'continuous-background-home-about',
      trigger: document.querySelector('.home-hero'),
      start: 'top top',
      end: 'bottom 82%',
      scrub: 0.65,
      invalidateOnRefresh: true,
    });
    expect(motion.fromTo).toHaveBeenCalledTimes(2);
  });

  it('does not create scroll animation when reduced motion is preferred and reverts on unmount', () => {
    motion.reduced = true;
    const { unmount } = renderBackground();

    expect(motion.transitionOptions).toHaveLength(0);
    unmount();
    expect(motion.revert).toHaveBeenCalledOnce();
  });

  it('uses a static composition when matchMedia is unavailable', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    renderBackground();

    expect(motion.timeline).not.toHaveBeenCalled();
    expect(document.querySelector('[data-chromatic-composition="home-about"]')).toHaveStyle({ opacity: '1' });
  });
});
