import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidGradient } from './liquid-gradient';

type Uniforms = Record<string, { value: unknown }>;

const three = vi.hoisted(() => ({
  failCreation: false,
  failShader: false,
  animationLoop: null as FrameRequestCallback | null,
  uniforms: null as Uniforms | null,
  drawingTimes: [] as number[],
  createRenderer: vi.fn(),
  render: vi.fn(),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  setAnimationLoop: vi.fn(),
  disposeRenderer: vi.fn(),
  disposeGeometry: vi.fn(),
  disposeMaterial: vi.fn(),
}));

vi.mock('three', () => {
  class Vector2 {
    constructor(public x = 0, public y = 0) {}
    set(x: number, y: number) { this.x = x; this.y = y; return this; }
  }

  class Color {
    constructor(public value: string) {}
  }

  class WebGLRenderer {
    domElement: HTMLCanvasElement;
    debug = {
      checkShaderErrors: true,
      onShaderError: null as (() => void) | null,
    };
    private pixelRatio = 1;

    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      three.createRenderer();
      if (three.failCreation) throw new Error('WebGL is unavailable');
      this.domElement = canvas;
    }

    setPixelRatio(ratio: number) {
      this.pixelRatio = ratio;
      three.setPixelRatio(ratio);
    }

    setSize(width: number, height: number, updateStyle?: boolean) {
      this.domElement.width = Math.floor(width * this.pixelRatio);
      this.domElement.height = Math.floor(height * this.pixelRatio);
      three.setSize(width, height, updateStyle);
    }

    setDrawingBufferSize(width: number, height: number, pixelRatio: number) {
      this.setPixelRatio(pixelRatio);
      this.setSize(width, height, false);
    }

    getDrawingBufferSize(target: Vector2) {
      return target.set(this.domElement.width, this.domElement.height);
    }

    setAnimationLoop(callback: FrameRequestCallback | null) {
      three.animationLoop = callback;
      three.setAnimationLoop(callback);
    }

    render() {
      three.render();
      if (three.failShader) this.debug.onShaderError?.();
      three.drawingTimes.push(Number(three.uniforms?.u_time.value ?? 0));
    }

    dispose() { three.disposeRenderer(); }
  }

  class Scene {
    add() {}
    clear() {}
  }

  class OrthographicCamera {}

  class PlaneGeometry {
    dispose() { three.disposeGeometry(); }
  }

  class ShaderMaterial {
    uniforms: Uniforms;
    constructor({ uniforms }: { uniforms: Uniforms }) {
      this.uniforms = uniforms;
      three.uniforms = uniforms;
    }
    dispose() { three.disposeMaterial(); }
  }

  class Mesh {
    frustumCulled = true;
  }

  return {
    Vector2,
    Color,
    WebGLRenderer,
    Scene,
    OrthographicCamera,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    SRGBColorSpace: 'srgb',
  };
});

describe('LiquidGradient', () => {
  let hidden: boolean;
  let reducedMotion: boolean;
  let width: number;
  let height: number;
  let top: number;
  let left: number;
  const frames = { get size() { return three.animationLoop ? 1 : 0; } };
  let mediaListeners: Set<(event: MediaQueryListEvent) => void>;
  let intersections: MockIntersectionObserver[];
  let resizes: MockResizeObserver[];

  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();

    constructor(private callback: IntersectionObserverCallback) {
      intersections.push(this);
    }

    emit(isIntersecting: boolean) {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
  }

  class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();

    constructor(private callback: ResizeObserverCallback) {
      resizes.push(this);
    }

    emit() {
      this.callback([], this as unknown as ResizeObserver);
    }
  }

  async function initialize() {
    await act(async () => {
      intersections.forEach((observer) => observer.emit(true));
      await vi.dynamicImportSettled();
    });
  }

  function advanceFrame(timestamp: number) {
    act(() => {
      three.animationLoop?.(timestamp);
    });
  }

  async function setReducedMotion(matches: boolean) {
    await act(async () => {
      reducedMotion = matches;
      mediaListeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
      await vi.dynamicImportSettled();
    });
  }

  function setHidden(value: boolean) {
    act(() => {
      hidden = value;
      document.dispatchEvent(new Event('visibilitychange'));
    });
  }

  function animationTime() {
    return three.drawingTimes.at(-1) ?? 0;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    three.failCreation = false;
    three.failShader = false;
    three.animationLoop = null;
    three.uniforms = null;
    three.drawingTimes = [];
    hidden = false;
    reducedMotion = false;
    width = 1200;
    height = 800;
    top = 0;
    left = 0;
    mediaListeners = new Set();
    intersections = [];
    resizes = [];

    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => new DOMRect(left, top, width, height));
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() { return reducedMotion; },
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.add(listener);
      }),
      removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.delete(listener);
      }),
    })));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('includes the decorative shader poster in server HTML before hydration', () => {
    const html = renderToStaticMarkup(<LiquidGradient priority />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const root = document.body.firstElementChild!;

    expect(root.getAttribute('data-renderer')).toBe('fallback');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[data-liquid-poster]')).not.toBeNull();
    expect(root.querySelector('canvas')?.style.opacity).not.toBe('1');
    expect(three.createRenderer).not.toHaveBeenCalled();
  });

  it('retains the initial poster and hides the canvas before the first successful render', () => {
    const { container } = render(<LiquidGradient />);

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('[data-liquid-poster]')).not.toBeNull();
    expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    expect(three.render).not.toHaveBeenCalled();
  });

  it('keeps a palette-matched poster when default colours are supplied explicitly', () => {
    const { container } = render(<LiquidGradient palette={['#f7b3d4', '#a1d6e4', '#fff1d7', '#c8b4e5']} />);

    expect(container.querySelector('[data-liquid-poster]')).not.toBeNull();
  });

  it('uses the custom CSS palette without showing an unrelated default poster', () => {
    const { container } = render(<LiquidGradient palette={['#111111', '#222222', '#333333', '#444444']} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('[data-liquid-poster]')).toBeNull();
    expect(root.style.getPropertyValue('--liquid-pink')).toBe('#111111');
    expect(root.style.getPropertyValue('--liquid-blue')).toBe('#222222');
    expect(root.style.getPropertyValue('--liquid-cream')).toBe('#333333');
    expect(root.style.getPropertyValue('--liquid-lavender')).toBe('#444444');
  });

  it('starts a visible priority background without waiting for IntersectionObserver', async () => {
    const { container } = render(<LiquidGradient priority />);
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(three.render).toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'webgl');

    act(() => intersections[0].emit(false));
    expect(frames.size).toBe(0);
  });

  it.each(['below', 'above', 'right', 'left', 'empty'] as const)('defers a priority background that is %s the viewport', async (position) => {
    if (position === 'below') top = window.innerHeight + 1;
    if (position === 'above') top = -height - 1;
    if (position === 'right') left = window.innerWidth + 1;
    if (position === 'left') left = -width - 1;
    if (position === 'empty') width = 0;
    const { container } = render(<LiquidGradient priority />);
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(frames.size).toBe(0);

    width = 1200;
    await initialize();
    expect(three.createRenderer).toHaveBeenCalledOnce();
  });

  it('initializes without IntersectionObserver support and still follows page visibility', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<LiquidGradient />);
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'webgl');
    expect(three.createRenderer).toHaveBeenCalledOnce();
    setHidden(true);
    expect(frames.size).toBe(0);
    setHidden(false);
    expect(frames.size).toBe(1);
  });

  it('paints the decorative canvas as soon as visible, without waiting for scroll', async () => {
    const { container } = render(<LiquidGradient className="custom-background" />);
    three.render.mockImplementationOnce(() => {
      expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
      expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    });
    await initialize();
    const root = container.firstElementChild!;
    const canvas = container.querySelector('canvas')!;

    expect(root).toHaveClass('custom-background');
    expect(root).toHaveAttribute('data-renderer', 'webgl');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(three.render).toHaveBeenCalled();
    expect(canvas.style.opacity).toBe('1');
    expect(frames.size).toBe(1);
  });

  it('defers GPU initialization while the component has not entered the viewport', async () => {
    const { container } = render(<LiquidGradient />);
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);

    await initialize();
    expect(three.createRenderer).toHaveBeenCalledOnce();
  });

  it('advances time independently of scrolling, including frames over 50 ms apart', async () => {
    render(<LiquidGradient />);
    await initialize();
    advanceFrame(100);
    const firstTime = animationTime();
    advanceFrame(300);

    expect(animationTime() - firstTime).toBeCloseTo(0.2);
    expect(three.render.mock.calls.length).toBeGreaterThan(1);
  });

  it('honors the reusable animation speed', async () => {
    render(<LiquidGradient speed={2} />);
    await initialize();
    advanceFrame(100);
    const firstTime = animationTime();
    advanceFrame(300);

    expect(animationTime() - firstTime).toBeCloseTo(0.4);
  });

  it('cancels scheduled rendering offscreen and resumes without elapsed hidden time', async () => {
    render(<LiquidGradient />);
    await initialize();
    advanceFrame(100);
    advanceFrame(300);
    const beforePause = animationTime();
    act(() => intersections[0].emit(false));
    const drawsBeforePause = three.render.mock.calls.length;

    expect(frames.size).toBe(0);
    advanceFrame(5000);
    expect(three.render).toHaveBeenCalledTimes(drawsBeforePause);

    await initialize();
    advanceFrame(5100);
    const resumedTime = animationTime();
    expect(resumedTime - beforePause).toBeLessThanOrEqual(0.101);
    advanceFrame(5300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });

  it('cancels rendering in a hidden tab and resumes without jumping forward', async () => {
    render(<LiquidGradient />);
    await initialize();
    advanceFrame(100);
    advanceFrame(300);
    const beforePause = animationTime();
    setHidden(true);
    const drawsBeforePause = three.render.mock.calls.length;

    expect(frames.size).toBe(0);
    advanceFrame(10000);
    expect(three.render).toHaveBeenCalledTimes(drawsBeforePause);

    setHidden(false);
    advanceFrame(10100);
    const resumedTime = animationTime();
    expect(resumedTime - beforePause).toBeLessThanOrEqual(0.101);
    advanceFrame(10300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });

  it('uses the fallback without initializing WebGL when reduced motion is requested', async () => {
    reducedMotion = true;
    const { container } = render(<LiquidGradient />);
    await initialize();

    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(frames.size).toBe(0);

    await setReducedMotion(false);
    expect(three.render).toHaveBeenCalled();
    expect(frames.size).toBe(1);
  });

  it('reacts to motion preference changes without continuing GPU rendering', async () => {
    const { container } = render(<LiquidGradient />);
    await initialize();
    advanceFrame(100);
    advanceFrame(300);
    const pausedTime = animationTime();
    await setReducedMotion(true);
    const pausedDraws = three.render.mock.calls.length;
    advanceFrame(5000);

    expect(frames.size).toBe(0);
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(three.render).toHaveBeenCalledTimes(pausedDraws);

    await setReducedMotion(false);
    advanceFrame(5100);
    const resumedTime = animationTime();
    expect(resumedTime - pausedTime).toBeLessThanOrEqual(0.101);
    advanceFrame(5300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });

  it('switches to the fallback when a frame detects reduced motion before its change event', async () => {
    const { container } = render(<LiquidGradient />);
    await initialize();
    const drawsBeforePause = three.render.mock.calls.length;
    reducedMotion = true;
    advanceFrame(100);

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('canvas')!.style.opacity).toBe('0');
    expect(frames.size).toBe(0);
    expect(three.render).toHaveBeenCalledTimes(drawsBeforePause);
  });

  it('sizes the drawing buffer again when its container changes size', async () => {
    const { container } = render(<LiquidGradient />);
    await initialize();
    const canvas = container.querySelector('canvas')!;
    const initialWidth = canvas.width;
    width = 390;
    height = 844;
    act(() => resizes[0].emit());

    expect(canvas.width).toBeLessThan(initialWidth);
    expect(canvas.height).toBeGreaterThan(canvas.width);
    const resolution = three.uniforms?.u_resolution.value as { x: number; y: number };
    expect(resolution.x).toBe(width);
    expect(resolution.y).toBe(height);
  });

  it('does not reset or repaint the drawing buffer for repeated identical resize notifications', async () => {
    render(<LiquidGradient />);
    await initialize();
    const sizeCount = three.setSize.mock.calls.length;
    const drawCount = three.render.mock.calls.length;

    act(() => {
      resizes[0].emit();
      resizes[0].emit();
      window.dispatchEvent(new Event('resize'));
    });

    expect(three.setSize).toHaveBeenCalledTimes(sizeCount);
    expect(three.render).toHaveBeenCalledTimes(drawCount);
  });

  it.each([
    [320, 568, 1],
    [375, 812, 2],
    [390, 844, 3],
    [430, 932, 3],
    [768, 1024, 2],
    [1024, 768, 2],
    [1440, 900, 2],
    [3840, 2160, 2],
  ])('bounds GPU pixels at %i by %i and DPR %i without changing shader aspect', async (testWidth, testHeight, dpr) => {
    width = testWidth;
    height = testHeight;
    vi.stubGlobal('devicePixelRatio', dpr);
    const { container } = render(<LiquidGradient />);
    await initialize();
    const canvas = container.querySelector('canvas')!;
    const ratio = three.setPixelRatio.mock.lastCall?.[0] as number;
    const resolution = three.uniforms?.u_resolution.value as { x: number; y: number };

    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(dpr);
    expect(ratio).toBeLessThanOrEqual(1.4);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(1_800_000);
    expect(resolution.x).toBe(testWidth);
    expect(resolution.y).toBe(testHeight);
    expect(resolution.x / resolution.y).toBe(testWidth / testHeight);
  });

  it('updates the drawing buffer when DPR changes without changing shader coordinates', async () => {
    width = 390;
    height = 844;
    const { container } = render(<LiquidGradient />);
    await initialize();
    const canvas = container.querySelector('canvas')!;
    const initialWidth = canvas.width;
    const initialSizeCount = three.setSize.mock.calls.length;
    vi.stubGlobal('devicePixelRatio', 3);

    act(() => {
      window.dispatchEvent(new Event('resize'));
      resizes[0].emit();
    });

    expect(canvas.width).toBeGreaterThan(initialWidth);
    expect(three.setSize).toHaveBeenCalledTimes(initialSizeCount + 1);
    const resolution = three.uniforms?.u_resolution.value as { x: number; y: number };
    expect(resolution.x).toBe(width);
    expect(resolution.y).toBe(height);
  });

  it('applies container changes on resume without drawing while the page is hidden', async () => {
    const { container } = render(<LiquidGradient />);
    await initialize();
    setHidden(true);
    const initialSizeCount = three.setSize.mock.calls.length;
    const drawCount = three.render.mock.calls.length;
    width = 430;
    height = 932;

    act(() => resizes[0].emit());
    expect(three.setSize).toHaveBeenCalledTimes(initialSizeCount);
    expect(three.render).toHaveBeenCalledTimes(drawCount);

    setHidden(false);
    expect(three.setSize).toHaveBeenCalledTimes(initialSizeCount + 1);
    expect(container.querySelector('canvas')!.height).toBeGreaterThan(container.querySelector('canvas')!.width);
    expect(three.render.mock.calls.length).toBeGreaterThan(drawCount);
  });

  it('retains the visible fallback if WebGL initialization fails', async () => {
    three.failCreation = true;
    const { container } = render(<LiquidGradient />);
    await initialize();

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    expect(three.render).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('keeps the fallback and frees GPU resources if shader compilation fails', async () => {
    three.failShader = true;
    const { container } = render(<LiquidGradient />);
    await initialize();

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it('returns to the poster and releases resources once if a later render throws', async () => {
    const { container, unmount } = render(<LiquidGradient />);
    await initialize();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'webgl');
    three.render.mockImplementationOnce(() => { throw new Error('Frame rendering failed'); });

    advanceFrame(100);

    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('[data-liquid-poster]')).not.toBeNull();
    expect(container.querySelector('canvas')!.style.opacity).toBe('0');
    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    const drawCount = three.render.mock.calls.length;
    act(() => intersections[0].emit(true));
    unmount();
    advanceFrame(300);
    expect(three.render).toHaveBeenCalledTimes(drawCount);
    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
  });

  it('shows the fallback during context loss and repaints after context restoration', async () => {
    const { container } = render(<LiquidGradient />);
    await initialize();
    const canvas = container.querySelector('canvas')!;
    const drawsBeforeLoss = three.render.mock.calls.length;
    const lost = new Event('webglcontextlost', { cancelable: true });
    act(() => {
      canvas.dispatchEvent(lost);
    });

    expect(lost.defaultPrevented).toBe(true);
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(canvas.style.opacity).toBe('0');
    expect(frames.size).toBe(0);
    advanceFrame(5000);
    expect(three.render).toHaveBeenCalledTimes(drawsBeforeLoss);

    await act(async () => {
      canvas.dispatchEvent(new Event('webglcontextrestored'));
    });

    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'webgl');
    expect(canvas.style.opacity).toBe('1');
    expect(three.render.mock.calls.length).toBeGreaterThan(drawsBeforeLoss);
    expect(frames.size).toBe(1);
  });

  it('releases renderer, material, geometry, observers and listeners on unmount', async () => {
    const { unmount } = render(<LiquidGradient />);
    await initialize();
    const drawsBeforeUnmount = three.render.mock.calls.length;
    unmount();

    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
    expect(intersections[0].disconnect).toHaveBeenCalledOnce();
    expect(resizes[0].disconnect).toHaveBeenCalledOnce();
    expect(mediaListeners.size).toBe(0);
    expect(frames.size).toBe(0);
    advanceFrame(100);
    expect(three.render).toHaveBeenCalledTimes(drawsBeforeUnmount);
  });

  it('avoids allocating GPU resources after unmount during its lazy import', async () => {
    const { unmount } = render(<LiquidGradient />);
    act(() => intersections[0].emit(true));
    unmount();
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('does not allocate resources when reduced motion becomes active during the import', async () => {
    const { container } = render(<LiquidGradient />);
    act(() => {
      intersections[0].emit(true);
      expect(three.createRenderer).not.toHaveBeenCalled();
      reducedMotion = true;
      mediaListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(container.querySelector('[data-liquid-poster]')).not.toBeNull();
    expect(frames.size).toBe(0);

    await setReducedMotion(false);
    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(1);
  });

  it('does not allocate resources when the tab becomes hidden during the import', async () => {
    const { container } = render(<LiquidGradient />);
    act(() => {
      intersections[0].emit(true);
      expect(three.createRenderer).not.toHaveBeenCalled();
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-renderer', 'fallback');
    expect(frames.size).toBe(0);

    setHidden(false);
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(1);
  });

  it('allocates and disposes a single active surface across a StrictMode effect remount', async () => {
    const { unmount } = render(<StrictMode><LiquidGradient /></StrictMode>);
    await initialize();
    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(1);

    unmount();
    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
    expect(mediaListeners.size).toBe(0);
    expect(frames.size).toBe(0);
    intersections.forEach((observer) => expect(observer.disconnect).toHaveBeenCalledOnce());
    resizes.forEach((observer) => expect(observer.disconnect).toHaveBeenCalledOnce());
  });

  it('ignores a queued context restoration after unmount and disposes each resource once', async () => {
    const { container, unmount } = render(<LiquidGradient />);
    await initialize();
    const canvas = container.querySelector('canvas')!;
    act(() => {
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    });
    const drawsBeforeUnmount = three.render.mock.calls.length;
    act(() => {
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      unmount();
    });
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(three.createRenderer).toHaveBeenCalledOnce();
    expect(three.render).toHaveBeenCalledTimes(drawsBeforeUnmount);
    expect(three.disposeGeometry).toHaveBeenCalledOnce();
    expect(three.disposeMaterial).toHaveBeenCalledOnce();
    expect(three.disposeRenderer).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });
});
