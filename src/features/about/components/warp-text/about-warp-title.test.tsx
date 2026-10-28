import { StrictMode, useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AboutWarpTitle, loadAcidFont } from './about-warp-title';

const engine = vi.hoisted(() => ({ mounts: vi.fn(), cleanup: vi.fn() }));
vi.mock('./WarpText', () => ({ default: function TestWarpText({ onReady }: { onReady?: () => void }) {
  useEffect(() => { engine.mounts(); onReady?.(); return engine.cleanup; }, [onReady]);
  return <span data-testid="warp-engine" />;
} }));

const title = '¿QUÉ ES CÈL·LULA?';
let intersect: IntersectionObserverCallback;
let disconnect: ReturnType<typeof vi.fn>;
let fine: MediaQueryList;
let reduced: MediaQueryList;
let load: ReturnType<typeof vi.fn>;
let originalFonts: PropertyDescriptor | undefined;

function query(matches: boolean): MediaQueryList {
  const events = new EventTarget();
  return {
    matches, media: '', onchange: null,
    addEventListener: vi.fn(events.addEventListener.bind(events)),
    removeEventListener: vi.fn(events.removeEventListener.bind(events)),
    dispatchEvent: events.dispatchEvent.bind(events), addListener() {}, removeListener() {},
  };
}
function visible(isIntersecting = true) {
  act(() => intersect([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}
function mount() {
  const view = render(<AboutWarpTitle text={title} id="home-about-title" />);
  const heading = screen.getByRole('heading', { level: 2, name: title });
  heading.style.setProperty('--font-acid', '"Acid Test", Arial');
  heading.style.fontWeight = '700';
  heading.style.fontSize = '96px';
  return { ...view, heading };
}

beforeEach(() => {
  engine.mounts.mockClear(); engine.cleanup.mockClear();
  disconnect = vi.fn();
  fine = query(true); reduced = query(false);
  vi.stubGlobal('matchMedia', vi.fn((value: string) => value.includes('prefers-reduced-motion') ? reduced : fine));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe() {} disconnect = disconnect;
  });
  originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
  load = vi.fn(async () => [{ status: 'loaded' }]);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load, check: vi.fn(() => true), ready: Promise.resolve() } });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  else Reflect.deleteProperty(document, 'fonts');
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe('About Warp title progressive enhancement', () => {
  it('keeps one semantic HTML title and does not load a renderer before intersection', () => {
    const { heading } = mount();
    expect(heading).toHaveAttribute('data-about-warp-state', 'fallback');
    expect(heading.querySelector('[data-about-title-fallback]')).toHaveTextContent(title);
    expect(heading.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
    expect(engine.mounts).not.toHaveBeenCalled();
  });

  it('loads the actual Acid family before mounting WebGL and retains HTML until first paint', async () => {
    let finish!: (value: { status: string }[]) => void;
    load.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { heading } = mount();
    visible();
    expect(load).toHaveBeenCalledWith('700 96px "Acid Test"', title);
    expect(heading).toHaveAttribute('data-about-warp-state', 'loading');
    expect(engine.mounts).not.toHaveBeenCalled();
    await act(async () => { finish([{ status: 'loaded' }]); });
    await screen.findByTestId('warp-engine');
    expect(heading).toHaveAttribute('data-about-warp-state', 'ready');
    expect(heading).toHaveAttribute('data-about-warp-font', '"Acid Test"');
    expect(heading.querySelector('[data-about-title-fallback]')).toHaveTextContent(title);
  });

  it('uses HTML for touch/mobile and reduced motion without downloading the renderer', async () => {
    Object.defineProperty(fine, 'matches', { configurable: true, value: false });
    const { heading } = mount();
    visible();
    expect(load).not.toHaveBeenCalled();
    expect(heading).toHaveAttribute('data-about-warp-state', 'fallback');
    Object.defineProperty(fine, 'matches', { configurable: true, value: true });
    Object.defineProperty(reduced, 'matches', { configurable: true, value: true });
    act(() => fine.dispatchEvent(new Event('change')));
    expect(load).not.toHaveBeenCalled();
    expect(engine.mounts).not.toHaveBeenCalled();
  });

  it('unmounts GPU resources offscreen, in a hidden tab and when motion preferences change', async () => {
    const { heading } = mount();
    visible(); await screen.findByTestId('warp-engine');
    visible(false);
    expect(engine.cleanup).toHaveBeenCalled();
    expect(heading).toHaveAttribute('data-about-warp-state', 'fallback');
    visible(); await screen.findByTestId('warp-engine');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(screen.queryByTestId('warp-engine')).not.toBeInTheDocument();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await screen.findByTestId('warp-engine');
    Object.defineProperty(reduced, 'matches', { configurable: true, value: true });
    act(() => reduced.dispatchEvent(new Event('change')));
    expect(screen.queryByTestId('warp-engine')).not.toBeInTheDocument();
    expect(heading).toHaveAttribute('data-about-warp-state', 'fallback');
  });

  it.each(['reject', 'empty'])('keeps the title legible when the real font cannot be loaded (%s)', async failure => {
    if (failure === 'reject') load.mockRejectedValue(new Error('Font unavailable'));
    else load.mockResolvedValue([]);
    const { heading } = mount();
    await act(async () => visible());
    expect(heading).toHaveAttribute('data-about-warp-state', 'failed');
    expect(engine.mounts).not.toHaveBeenCalled();
    expect(heading.querySelector('[data-about-title-fallback]')).toHaveTextContent(title);
  });

  it('does not accept an unnamed fallback family and disconnects its observers/listeners', async () => {
    const { heading, unmount } = mount();
    heading.style.removeProperty('--font-acid');
    expect(await loadAcidFont(heading, title)).toBeNull();
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(fine.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(reduced.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(load).not.toHaveBeenCalled();
  });

  it('hydrates the same semantic HTML in Strict Mode without replacing server nodes', async () => {
    const element = <StrictMode><AboutWarpTitle text={title} id="about-test" /></StrictMode>;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    const heading = container.querySelector('h2');
    const fallback = container.querySelector('[data-about-title-fallback]');
    document.body.appendChild(container);
    const errors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: error => errors.push(error) }); });
      expect(errors).toEqual([]);
      expect(container.querySelector('h2')).toBe(heading);
      expect(container.querySelector('[data-about-title-fallback]')).toBe(fallback);
      expect(container.querySelector('canvas')).toBeNull();
      expect(load).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
