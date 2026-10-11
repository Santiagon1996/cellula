import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FluidGradientCanvas } from './fluid-gradient-canvas';
import { HomeAtmosphere } from './home-atmosphere';

function createWebGL() {
  return {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLES: 4,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => 'Shader compilation failed'),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn((_program: unknown, name: string) => ({ name })),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    useProgram: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    drawArrays: vi.fn(),
    deleteBuffer: vi.fn(),
  };
}

type WebGLMock = ReturnType<typeof createWebGL>;

describe('FluidGradientCanvas', () => {
  let gl: WebGLMock;
  let now: number;
  let hidden: boolean;
  let reducedMotion: boolean;
  let nextFrameId: number;
  let frames: Map<number, FrameRequestCallback>;
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

    constructor() {
      resizes.push(this);
    }
  }

  function advanceFrame(timestamp: number) {
    act(() => {
      now = timestamp;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(timestamp));
    });
  }

  function setReducedMotion(matches: boolean) {
    act(() => {
      reducedMotion = matches;
      const event = { matches } as MediaQueryListEvent;
      mediaListeners.forEach((listener) => listener(event));
    });
  }

  function setHidden(value: boolean) {
    act(() => {
      hidden = value;
      document.dispatchEvent(new Event('visibilitychange'));
    });
  }

  function animationTime() {
    const calls = gl.uniform1f.mock.calls as unknown as [{ name: string }, number][];
    const times = calls.filter(([location]) => location.name === 'u_time');
    return times.at(-1)?.[1] ?? 0;
  }

  beforeEach(() => {
    gl = createWebGL();
    now = 0;
    hidden = false;
    reducedMotion = false;
    nextFrameId = 0;
    frames = new Map();
    mediaListeners = new Set();
    intersections = [];
    resizes = [];

    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockReturnValue(800);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(gl as unknown as WebGLRenderingContext);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
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

  it('renders a decorative atmosphere immediately, before any scroll or animation frame', () => {
    const { container } = render(<HomeAtmosphere />);
    const atmosphere = container.querySelector('.home-atmosphere');
    const canvas = container.querySelector('canvas')!;

    expect(atmosphere).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveClass('home-atmosphere__canvas');
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 6);
    expect(canvas.style.opacity).toBe('1');
    expect(frames.size).toBe(1);
  });

  it('advances animation at elapsed wall-clock speed even when frames take over 50 ms', () => {
    render(<FluidGradientCanvas />);
    advanceFrame(100);
    const firstTime = animationTime();
    advanceFrame(300);

    expect(animationTime() - firstTime).toBeCloseTo(0.2);
    expect(gl.drawArrays.mock.calls.length).toBeGreaterThan(1);
  });

  it('keeps a smooth drawing cadence when animation frames arrive at 60 Hz', () => {
    render(<FluidGradientCanvas />);
    for (let frame = 1; frame <= 60; frame += 1) {
      advanceFrame(frame * 1000 / 60);
    }

    const draws = gl.drawArrays.mock.calls.length;
    expect(draws).toBeGreaterThanOrEqual(29);
    expect(draws).toBeLessThanOrEqual(32);
  });

  it('pauses offscreen and resumes without adding the time spent outside the viewport', () => {
    render(<FluidGradientCanvas />);
    advanceFrame(100);
    advanceFrame(300);
    const beforePause = animationTime();
    act(() => intersections[0].emit(false));
    const drawsBeforePause = gl.drawArrays.mock.calls.length;
    advanceFrame(5000);

    expect(gl.drawArrays).toHaveBeenCalledTimes(drawsBeforePause);

    act(() => intersections[0].emit(true));
    advanceFrame(5100);
    const resumedTime = animationTime();
    expect(resumedTime - beforePause).toBeLessThanOrEqual(0.101);
    advanceFrame(5300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });

  it('pauses in a hidden tab and resumes without jumping forward', () => {
    render(<FluidGradientCanvas />);
    advanceFrame(100);
    advanceFrame(300);
    const beforePause = animationTime();
    setHidden(true);
    const drawsBeforePause = gl.drawArrays.mock.calls.length;
    advanceFrame(10000);

    expect(gl.drawArrays).toHaveBeenCalledTimes(drawsBeforePause);

    setHidden(false);
    advanceFrame(10100);
    const resumedTime = animationTime();
    expect(resumedTime - beforePause).toBeLessThanOrEqual(0.101);
    advanceFrame(10300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });

  it('releases GPU resources, observers, media listeners, and pending frames on unmount', () => {
    const { unmount } = render(<FluidGradientCanvas />);
    const draws = gl.drawArrays.mock.calls.length;
    unmount();

    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(intersections[0].disconnect).toHaveBeenCalledOnce();
    expect(resizes[0].disconnect).toHaveBeenCalledOnce();
    expect(mediaListeners.size).toBe(0);
    expect(frames.size).toBe(0);
    advanceFrame(100);
    expect(gl.drawArrays).toHaveBeenCalledTimes(draws);
  });

  it('leaves the CSS fallback available when WebGL cannot be created', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const { container } = render(<HomeAtmosphere />);

    expect(container.querySelector('.home-atmosphere')).toBeInTheDocument();
    expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('keeps the fallback and frees shaders when compilation fails', () => {
    gl.getShaderParameter.mockReturnValue(false);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<FluidGradientCanvas />);

    expect(container.querySelector('canvas')!.style.opacity).not.toBe('1');
    expect(gl.deleteShader).toHaveBeenCalled();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('shows the fallback during context loss and repaints after the context is restored', () => {
    const { container } = render(<FluidGradientCanvas />);
    const canvas = container.querySelector('canvas')!;
    const drawsBeforeLoss = gl.drawArrays.mock.calls.length;
    const lost = new Event('webglcontextlost', { cancelable: true });
    act(() => { canvas.dispatchEvent(lost); });

    expect(lost.defaultPrevented).toBe(true);
    expect(canvas.style.opacity).toBe('0');
    expect(frames.size).toBe(0);
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
    expect(gl.deleteProgram).toHaveBeenCalledOnce();
    advanceFrame(5000);
    expect(gl.drawArrays).toHaveBeenCalledTimes(drawsBeforeLoss);

    act(() => { canvas.dispatchEvent(new Event('webglcontextrestored')); });
    expect(canvas.style.opacity).toBe('1');
    expect(gl.drawArrays).toHaveBeenCalledTimes(drawsBeforeLoss + 1);
    expect(frames.size).toBe(1);
  });

  it('avoids animation when reduced motion is enabled initially', () => {
    reducedMotion = true;
    render(<FluidGradientCanvas />);
    const draws = gl.drawArrays.mock.calls.length;
    advanceFrame(1000);

    expect(frames.size).toBe(0);
    expect(gl.drawArrays).toHaveBeenCalledTimes(draws);

    setReducedMotion(false);
    expect(gl.drawArrays.mock.calls.length).toBeGreaterThan(draws);
    expect(frames.size).toBe(1);
  });

  it('reacts to reduced-motion changes and resumes animation without a time jump', () => {
    render(<FluidGradientCanvas />);
    advanceFrame(100);
    advanceFrame(300);
    setReducedMotion(true);
    const pausedTime = animationTime();
    const pausedDraws = gl.drawArrays.mock.calls.length;
    advanceFrame(5000);

    expect(frames.size).toBe(0);
    expect(gl.drawArrays).toHaveBeenCalledTimes(pausedDraws);

    setReducedMotion(false);
    advanceFrame(5100);
    const resumedTime = animationTime();
    expect(resumedTime - pausedTime).toBeLessThanOrEqual(0.101);
    advanceFrame(5300);
    expect(animationTime() - resumedTime).toBeCloseTo(0.2);
  });
});
