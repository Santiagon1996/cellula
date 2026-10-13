import { StrictMode, useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAboutScroll } from './use-about-scroll';

type Conditions = { reduced: boolean; compact: boolean; fine: boolean; all: boolean };
type VoidMock = ReturnType<typeof vi.fn<() => void>>;
type Resource = {
  active: boolean;
  target?: Element;
  trigger?: Element;
  kill: VoidMock;
  revert: () => void;
};
type MediaScope = {
  active: boolean;
  resources: Resource[];
  callback?: (context: { conditions: Conditions }) => (() => void) | undefined;
  cleanup?: () => void;
  update: () => void;
  revert: VoidMock;
};
type MotionOptions = { scrollTrigger?: { trigger?: Element }; clipPath?: string };

const motion = vi.hoisted(() => ({
  conditions: { reduced: false, compact: false, fine: true, all: true } as Conditions,
  media: [] as MediaScope[],
  current: undefined as MediaScope | undefined,
  resources: [] as Resource[],
  pointers: [] as Array<ReturnType<typeof vi.fn> & { tween: Resource }>,
  refresh: vi.fn(),
  unrelatedKill: vi.fn(),
}));

vi.mock('@gsap/react', async () => {
  const { useLayoutEffect } = await import('react');
  return { useGSAP: (callback: () => (() => void) | undefined) => useLayoutEffect(() => callback(), [callback]) };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: motion.refresh,
    getAll: () => [{ kill: motion.unrelatedKill }],
    killAll: motion.unrelatedKill,
  },
}));

vi.mock('gsap', () => {
  function resource(target?: Element, options?: MotionOptions, restore?: () => void): Resource {
    const item: Resource = {
      active: true,
      target,
      trigger: options?.scrollTrigger?.trigger,
      kill: vi.fn(() => { item.active = false; }),
      revert: () => { item.kill(); restore?.(); },
    };
    motion.current?.resources.push(item);
    motion.resources.push(item);
    return item;
  }

  return { default: {
    registerPlugin: vi.fn(),
    matchMedia: () => {
      const clear = () => {
        scope.cleanup?.();
        scope.cleanup = undefined;
        scope.resources.forEach((item) => item.revert());
        scope.resources = [];
      };
      const scope: MediaScope = {
        active: true,
        resources: [],
        update: () => {
          if (!scope.active || !scope.callback) return;
          clear();
          motion.current = scope;
          scope.cleanup = scope.callback({ conditions: { ...motion.conditions } });
          motion.current = undefined;
        },
        revert: vi.fn(() => { clear(); scope.active = false; }),
      };
      motion.media.push(scope);
      return {
        add: (_queries: Record<string, string>, callback: MediaScope['callback']) => {
          scope.callback = callback;
          scope.update();
        },
        revert: scope.revert,
      };
    },
    timeline: (options: MotionOptions) => {
      resource(undefined, options);
      const timeline = {
        to: (target: Element | null) => { if (target) resource(target); return timeline; },
        fromTo: (target: Element | null) => { if (target) resource(target); return timeline; },
      };
      return timeline;
    },
    fromTo: (target: HTMLElement, initial: MotionOptions, options: MotionOptions) => {
      const previous = target.getAttribute('style');
      if (initial.clipPath) target.style.clipPath = initial.clipPath;
      return resource(target, options, () => {
        if (previous === null) target.removeAttribute('style');
        else target.setAttribute('style', previous);
      });
    },
    quickTo: (target: Element) => {
      const follow = Object.assign(vi.fn(), { tween: resource(target) });
      motion.pointers.push(follow);
      return follow;
    },
  } };
});

function Harness() {
  const rootRef = useRef<HTMLElement>(null);
  useAboutScroll(rootRef);
  return (
    <>
      <div data-testid="unrelated"><span data-about-fragment>Otro componente</span></div>
      <section ref={rootRef} data-testid="about">
        <div data-about-act="decompose" data-testid="intro">
          <div data-about-wash />
          <h2 data-about-question>Una pregunta visible</h2>
          <span data-about-fragment>¿QUÉ</span><span data-about-fragment>ES</span><span data-about-fragment>CÉLULA?</span>
          <h3 data-about-declaration style={{ color: 'red' }}>Una declaración visible</h3>
        </div>
        <div data-about-act="transform">
          <span data-about-converge /><span data-about-converge /><span data-about-converge />
          <svg><path data-about-final-connection /></svg>
          <span data-about-orbit />
          <h3 data-about-final-statement>Un encuentro visible</h3>
        </div>
      </section>
    </>
  );
}

function setConditions(next: Partial<Conditions>) {
  act(() => {
    Object.assign(motion.conditions, next);
    motion.media.filter((media) => media.active).forEach((media) => media.update());
  });
}

function pointerMove(element: Element, pointerType = 'mouse') {
  const event = new MouseEvent('pointermove', { bubbles: true, clientX: 60, clientY: 40 });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(element, event);
}

function activeResources() {
  return motion.resources.filter((resource) => resource.active);
}

let originalFonts: PropertyDescriptor | undefined;

beforeEach(() => {
  motion.conditions = { reduced: false, compact: false, fine: true, all: true };
  motion.media = [];
  motion.resources = [];
  motion.pointers = [];
  motion.current = undefined;
  motion.refresh.mockReset();
  motion.unrelatedKill.mockReset();
  originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
  Object.defineProperty(document, 'fonts', { configurable: true, value: undefined });
});

afterEach(() => {
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  else Reflect.deleteProperty(document, 'fonts');
});

describe('useAboutScroll lifecycle', () => {
  it('owns only About targets and removes pointer effects and resources on unmount', () => {
    const { unmount } = render(<Harness />);
    const root = screen.getByTestId('about');
    const intro = screen.getByTestId('intro');
    const declaration = screen.getByRole('heading', { name: 'Una declaración visible' });
    expect(activeResources().length).toBeGreaterThan(0);
    for (const resource of activeResources()) {
      if (resource.target) expect(root.contains(resource.target)).toBe(true);
      if (resource.trigger) expect(root.contains(resource.trigger)).toBe(true);
    }
    expect(screen.getByTestId('unrelated').querySelector('[style]')).toBeNull();

    pointerMove(intro, 'touch');
    motion.pointers.forEach((follow) => expect(follow).not.toHaveBeenCalled());
    pointerMove(intro);
    motion.pointers.forEach((follow) => expect(follow).toHaveBeenCalled());
    fireEvent.pointerLeave(intro);
    motion.pointers.forEach((follow) => expect(follow).toHaveBeenLastCalledWith(0));

    unmount();
    expect(activeResources()).toHaveLength(0);
    expect(declaration.style.clipPath).toBe('');
    expect(declaration.style.color).toBe('red');
    motion.pointers.forEach((follow) => { follow.mockClear(); expect(follow.tween.kill).toHaveBeenCalled(); });
    pointerMove(intro);
    fireEvent.pointerLeave(intro);
    fireEvent(window, new Event('blur'));
    motion.pointers.forEach((follow) => expect(follow).not.toHaveBeenCalled());
    expect(motion.unrelatedKill).not.toHaveBeenCalled();
  });

  it('leaves editorial content intact and creates no animations when reduced motion is enabled', () => {
    motion.conditions.reduced = true;
    const { unmount } = render(<Harness />);
    expect(activeResources()).toHaveLength(0);
    expect(motion.pointers).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Una pregunta visible' })).toBeVisible();
    const declaration = screen.getByRole('heading', { name: 'Una declaración visible' });
    expect(declaration).toBeVisible();
    expect(declaration.style.clipPath).toBe('');
    expect(screen.getByRole('heading', { name: 'Un encuentro visible' })).toBeVisible();
    unmount();
    expect(motion.media.every((media) => !media.active)).toBe(true);
  });

  it('reverts normal motion when preferences change and recreates it without stale listeners', () => {
    const { unmount } = render(<Harness />);
    const intro = screen.getByTestId('intro');
    const previousResources = [...activeResources()];
    const previousPointers = [...motion.pointers];
    setConditions({ reduced: true });
    expect(activeResources()).toHaveLength(0);
    expect(previousResources.every((resource) => !resource.active)).toBe(true);
    expect(screen.getByRole('heading', { name: 'Una declaración visible' }).style.clipPath).toBe('');
    previousPointers.forEach((follow) => follow.mockClear());
    pointerMove(intro);
    expect(previousPointers.every((follow) => follow.mock.calls.length === 0)).toBe(true);

    setConditions({ reduced: false });
    expect(activeResources().length).toBeGreaterThan(0);
    const restoredPointers = motion.pointers.slice(previousPointers.length);
    pointerMove(intro);
    restoredPointers.forEach((follow) => expect(follow).toHaveBeenCalledTimes(1));
    previousPointers.forEach((follow) => expect(follow).not.toHaveBeenCalled());
    unmount();
    expect(activeResources()).toHaveLength(0);
    expect(motion.unrelatedKill).not.toHaveBeenCalled();
  });

  it('keeps scroll motion available on compact screens while removing desktop pointer listeners', () => {
    const { unmount } = render(<Harness />);
    const intro = screen.getByTestId('intro');
    const desktopPointers = [...motion.pointers];
    setConditions({ compact: true });
    expect(activeResources().length).toBeGreaterThan(0);
    desktopPointers.forEach((follow) => follow.mockClear());
    pointerMove(intro);
    desktopPointers.forEach((follow) => expect(follow).not.toHaveBeenCalled());
    expect(motion.pointers).toEqual(desktopPointers);
    unmount();
    expect(activeResources()).toHaveLength(0);
  });

  it('survives StrictMode setup and cleanup without duplicate active effects', () => {
    const { unmount } = render(<StrictMode><Harness /></StrictMode>);
    expect(motion.media.filter((media) => media.active)).toHaveLength(1);
    expect(motion.media.some((media) => !media.active)).toBe(true);
    const activePointers = motion.pointers.filter((follow) => follow.tween.active);
    const oldPointers = motion.pointers.filter((follow) => !follow.tween.active);
    pointerMove(screen.getByTestId('intro'));
    activePointers.forEach((follow) => expect(follow).toHaveBeenCalledTimes(1));
    oldPointers.forEach((follow) => expect(follow).not.toHaveBeenCalled());
    unmount();
    expect(activeResources()).toHaveLength(0);
    expect(motion.media.every((media) => !media.active)).toBe(true);
    expect(motion.unrelatedKill).not.toHaveBeenCalled();
  });

  it('refreshes geometry once fonts settle and ignores a font completion after unmount', async () => {
    let settle!: () => void;
    const ready = new Promise<void>((resolve) => { settle = resolve; });
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
    const first = render(<Harness />);
    await act(async () => { settle(); await ready; });
    expect(motion.refresh).toHaveBeenCalledTimes(1);
    first.unmount();

    let settleLater!: () => void;
    const pending = new Promise<void>((resolve) => { settleLater = resolve; });
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: pending } });
    const second = render(<Harness />);
    second.unmount();
    await act(async () => { settleLater(); await pending; });
    expect(motion.refresh).toHaveBeenCalledTimes(1);
  });
});
