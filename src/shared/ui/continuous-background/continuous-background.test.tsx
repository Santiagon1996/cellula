import { useLayoutEffect } from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContinuousBackground } from './continuous-background';

type TriggerOptions = {
  id: string;
  trigger: Element;
  start: string;
  endTrigger: Element;
  end: string;
  invalidateOnRefresh: boolean;
  onUpdate: (self: { progress: number }) => void;
  onRefresh: (self: { progress: number }) => void;
};

const motion = vi.hoisted(() => ({
  reduced: false,
  add: vi.fn(),
  revert: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  timeline: vi.fn(),
  set: vi.fn(),
  cleanups: [] as Array<() => void>,
  timelines: [] as Array<{
    clear: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    fromTo: ReturnType<typeof vi.fn>;
    to: ReturnType<typeof vi.fn>;
    progress: ReturnType<typeof vi.fn>;
    kill: ReturnType<typeof vi.fn>;
  }>,
  triggers: [] as Array<{ options: TriggerOptions; kill: ReturnType<typeof vi.fn> }>,
}));
let originalMatchMedia: PropertyDescriptor | undefined;
let originalScrollY: PropertyDescriptor | undefined;

vi.mock('@gsap/react', () => ({
  useGSAP: (callback: () => (() => void) | undefined) => useLayoutEffect(callback, [callback]),
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    addEventListener: motion.addEventListener,
    removeEventListener: motion.removeEventListener,
    create: (options: TriggerOptions) => {
      const trigger = { options, kill: vi.fn() };
      motion.triggers.push(trigger);
      return trigger;
    },
  },
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    set: motion.set,
    timeline: vi.fn(() => {
      const timeline = {
        clear: vi.fn(),
        set: vi.fn(),
        fromTo: vi.fn(),
        to: vi.fn(),
        progress: vi.fn(),
        kill: vi.fn(),
      };
      timeline.clear.mockReturnValue(timeline);
      timeline.set.mockReturnValue(timeline);
      timeline.fromTo.mockReturnValue(timeline);
      timeline.to.mockReturnValue(timeline);
      motion.timelines.push(timeline);
      return timeline;
    }),
    matchMedia: () => ({
      add: (query: string, callback: () => (() => void) | undefined) => {
        motion.add(query, callback);
        if (!motion.reduced) {
          const cleanup = callback();
          if (cleanup) motion.cleanups.push(cleanup);
        }
      },
      revert: () => {
        motion.revert();
        motion.cleanups.splice(0).forEach((cleanup) => cleanup());
      },
    }),
  },
}));

function renderBackground() {
  return render(
    <>
      <section className="home-hero">
        <div className="home-atmosphere" />
      </section>
      <ContinuousBackground />
      <section data-about-section data-chromatic-flow>
        <div data-chromatic-intro>
          <p data-introduction-copy>Lorem ipsum</p>
        </div>
      </section>
    </>,
  );
}

beforeEach(() => {
  originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn() });
  motion.reduced = false;
  motion.add.mockReset();
  motion.revert.mockReset();
  motion.addEventListener.mockReset();
  motion.removeEventListener.mockReset();
  motion.timeline.mockReset();
  motion.set.mockReset();
  motion.timelines = [];
  motion.triggers = [];
  motion.cleanups = [];
  motion.timeline.mockImplementation(() => {
    const timeline = {
      clear: vi.fn(),
      set: vi.fn(),
      fromTo: vi.fn(),
      to: vi.fn(),
      progress: vi.fn(),
      kill: vi.fn(),
    };
    timeline.clear.mockReturnValue(timeline);
    timeline.set.mockReturnValue(timeline);
    timeline.fromTo.mockReturnValue(timeline);
    timeline.to.mockReturnValue(timeline);
    motion.timelines.push(timeline);
    return timeline;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else Reflect.deleteProperty(window, 'matchMedia');
  if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY);
  else Reflect.deleteProperty(window, 'scrollY');
});

describe('ContinuousBackground', () => {
  it('precomposes the Hero overlap, vertical introduction gradient, and Cream finish', () => {
    renderBackground();

    expect(document.querySelector('[data-chromatic-composition="home-about"]')).toBeInTheDocument();
    expect(document.querySelector('[data-chromatic-layer="slate"]')).toBeInTheDocument();
    expect(document.querySelector('[data-chromatic-layer="hero-overlap"]')).toBeInTheDocument();
    expect(document.querySelector('[data-chromatic-layer="intro-gradient"]')).toBeInTheDocument();
    expect(document.querySelector('[data-chromatic-layer="cream"]')).toBeInTheDocument();
    expect(document.querySelector('.continuous-background')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('.continuous-background')).toHaveAttribute('data-chromatic-motion', 'true');
  });

  it('coordinates the reversible Hero blend, paragraph, and Cream transition with one measured trigger', () => {
    renderBackground();

    expect(motion.add).toHaveBeenCalledWith('(prefers-reduced-motion: no-preference)', expect.any(Function));
    expect(motion.timelines).toHaveLength(1);
    expect(motion.triggers).toHaveLength(1);
    const trigger = motion.triggers[0]!;
    expect(trigger.options).toMatchObject({
      id: 'continuous-background-home-introduction-about',
      trigger: document.querySelector('.home-hero'),
      start: 'top top',
      endTrigger: document.querySelector('[data-chromatic-intro]'),
      end: 'bottom top',
      invalidateOnRefresh: true,
    });
    expect(trigger.options).not.toHaveProperty('scrub');
    expect(trigger.options).not.toHaveProperty('animation');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    trigger.options.onUpdate({ progress: 0.42 });
    expect(motion.timelines[0]!.progress).toHaveBeenLastCalledWith(0);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0.42 });
    trigger.options.onUpdate({ progress: 0.42 });
    expect(motion.timelines[0]!.progress).toHaveBeenLastCalledWith(0.42);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0.18 });
    trigger.options.onUpdate({ progress: 0.18 });
    expect(motion.timelines[0]!.progress).toHaveBeenLastCalledWith(0.18);
    trigger.options.onRefresh({ progress: 0.42 });
    expect(motion.timelines[0]!.progress).toHaveBeenLastCalledWith(0.18);

    expect(motion.set).toHaveBeenCalledWith(document.querySelector('[data-chromatic-layer="slate"]'), { opacity: 1 });
    expect(motion.timelines[0]!.set).toHaveBeenCalledWith(
      document.querySelector('.home-atmosphere'),
      { opacity: 1, '--chromatic-edge-fade': '0%' },
      0,
    );
    const animatedTargets = motion.timelines[0]!.fromTo.mock.calls.map(([target]) => target);
    expect(animatedTargets).toEqual(expect.arrayContaining([
      document.querySelector('[data-chromatic-layer="hero-overlap"]'),
      document.querySelector('[data-chromatic-layer="intro-gradient"]'),
      document.querySelector('[data-chromatic-layer="cream"]'),
      document.querySelector('.home-atmosphere'),
      document.querySelector('[data-introduction-copy]'),
    ]));
    const heroFade = motion.timelines[0]!.fromTo.mock.calls.find(
      ([target, , vars]) => target === document.querySelector('.home-atmosphere') && vars.opacity === 0.08,
    );
    expect(heroFade?.[2]).toMatchObject({ opacity: 0.08, ease: 'power2.out', immediateRender: false });
    expect(motion.timelines[0]!.fromTo).toHaveBeenCalledWith(
      document.querySelector('.home-atmosphere'),
      { '--chromatic-edge-fade': '0%' },
      expect.objectContaining({ '--chromatic-edge-fade': '48%', ease: 'power2.out', immediateRender: false }),
      expect.any(Number),
    );
    expect(motion.timelines[0]!.to).toHaveBeenCalledWith(
      document.querySelector('[data-introduction-copy]'),
      expect.objectContaining({ opacity: 0, y: -8 }),
      expect.any(Number),
    );
    expect(motion.addEventListener).toHaveBeenCalledWith('refreshInit', expect.any(Function));
  });

  it('does not create scroll animation when reduced motion is preferred and cleans up on unmount', () => {
    motion.reduced = true;
    const { unmount } = renderBackground();

    expect(motion.timelines).toHaveLength(0);
    expect(motion.triggers).toHaveLength(0);
    expect(document.querySelector('.continuous-background')).not.toHaveAttribute('data-chromatic-motion');
    unmount();
    expect(motion.revert).toHaveBeenCalledOnce();
  });

  it('kills the single ScrollTrigger and removes its refresh handler on unmount', () => {
    const { unmount } = renderBackground();
    const trigger = motion.triggers[0]!;
    const refreshHandler = motion.addEventListener.mock.calls[0]![1];

    unmount();

    expect(trigger.kill).toHaveBeenCalledOnce();
    expect(motion.removeEventListener).toHaveBeenCalledWith('refreshInit', refreshHandler);
    expect(motion.timelines[0]!.kill).toHaveBeenCalledOnce();
  });
});
