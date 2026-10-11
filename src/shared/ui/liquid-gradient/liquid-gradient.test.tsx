import { act, cleanup, render } from '@testing-library/react';
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
      this.domElement.width = Math.round(width * this.pixelRatio);
      this.domElement.height = Math.round(height * this.pixelRatio);
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
    mediaListeners = new Set();
    intersections = [];
    resizes = [];

    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);
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

  it('paints the decorative canvas as soon as visible, without waiting for scroll', async () => {
    const { container } = render(<LiquidGradient className="custom-background" />);
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
    expect(resolution.x).toBe(canvas.width);
    expect(resolution.y).toBe(canvas.height);
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
