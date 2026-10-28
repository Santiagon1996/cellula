import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WarpText from './WarpText';

type Uniforms = Record<string, { value: unknown }>;
const gpu = vi.hoisted(() => ({
  fail: false, render: vi.fn(), textureDelete: vi.fn(), geometryRemove: vi.fn(), programRemove: vi.fn(), loseContext: vi.fn(),
  programs: [] as { uniforms: Uniforms }[], textures: [] as { image?: HTMLCanvasElement; needsUpdate?: boolean }[],
}));
vi.mock('ogl', () => ({
  Renderer: class {
    gl: Record<string, unknown>;
    dpr = 1;
    constructor() {
      if (gpu.fail) throw new Error('No WebGL');
      this.gl = { canvas: document.createElement('canvas'), clearColor: vi.fn(), LINEAR: 9729, CLAMP_TO_EDGE: 33071, drawingBufferWidth: 1200, drawingBufferHeight: 480, deleteTexture: gpu.textureDelete, getExtension: () => ({ loseContext: gpu.loseContext }) };
    }
    setSize() {} render = gpu.render;
  },
  Program: class { uniforms: Uniforms; remove = gpu.programRemove; constructor(_gl: unknown, options: { uniforms: Uniforms }) { this.uniforms = options.uniforms; gpu.programs.push(this); } },
  Mesh: class {},
  Triangle: class { remove = gpu.geometryRemove; },
  Texture: class { texture = {}; image?: HTMLCanvasElement; needsUpdate = false; constructor() { gpu.textures.push(this); } },
}));

let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let clock: number;
let intersection: IntersectionObserverCallback;
let disconnectResize: ReturnType<typeof vi.fn>;
let disconnectIntersection: ReturnType<typeof vi.fn>;
let media: MediaQueryList;
let originalFonts: PropertyDescriptor | undefined;
let fontsReady: Promise<void>;

async function flush() { await act(async () => { await Promise.resolve(); }); }
function visible(value = true) { act(() => intersection([{ isIntersecting: value } as IntersectionObserverEntry], {} as IntersectionObserver)); }
function tick() {
  act(() => {
    const callbacks = [...frames.values()]; frames.clear(); clock += 16;
    callbacks.forEach(callback => callback(clock));
  });
}

beforeEach(() => {
  gpu.fail = false; gpu.programs = []; gpu.textures = [];
  gpu.render.mockReset(); gpu.textureDelete.mockReset(); gpu.geometryRemove.mockReset(); gpu.programRemove.mockReset(); gpu.loseContext.mockReset();
  frames = new Map(); frameId = 0; clock = 100;
  fontsReady = Promise.resolve();
  disconnectResize = vi.fn(); disconnectIntersection = vi.fn();
  const events = new EventTarget();
  media = { matches: false, media: '', onchange: null, addEventListener: vi.fn(events.addEventListener.bind(events)), removeEventListener: vi.fn(events.removeEventListener.bind(events)), dispatchEvent: events.dispatchEvent.bind(events), addListener() {}, removeListener() {} };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnectResize; });
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: IntersectionObserverCallback) { intersection = callback; } observe() {} disconnect = disconnectIntersection; });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 480, width: 1200, height: 480, toJSON() {} });
  const context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), getImageData: vi.fn(() => ({ data: [29, 29, 29, 255] })), measureText: vi.fn(() => ({ width: 40 })), fillText: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as unknown as CanvasRenderingContext2D);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
  Object.defineProperty(document, 'fonts', { configurable: true, get: () => ({ ready: fontsReady }) });
});
afterEach(() => {
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  else Reflect.deleteProperty(document, 'fonts');
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe('adapted official WarpText lifecycle', () => {
  it('waits for fonts and the first text raster before revealing or scheduling frames', async () => {
    let finish!: () => void;
    fontsReady = new Promise(resolve => { finish = resolve; });
    const onReady = vi.fn();
    const { container } = render(<WarpText text="¿QUÉ ES CÈL·LULA?" fontFamily="Acid Test" fontSize={96} intro={false} onReady={onReady} />);
    visible();
    expect(gpu.textures[0].image).toBeUndefined();
    expect(frames.size).toBe(0);
    expect(onReady).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(gpu.textures[0].image).toBeInstanceOf(HTMLCanvasElement);
    expect(gpu.programs[0].uniforms.uReveal.value).toBe(1);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
    expect(frames.size).toBe(1);
  });

  it('pauses frames offscreen, in hidden tabs and with reduced motion, then resumes', async () => {
    render(<WarpText text="CÈL·LULA" intro={false} />);
    await flush();
    expect(frames.size).toBe(0);
    visible(); expect(frames.size).toBe(1);
    tick(); expect(frames.size).toBe(1);
    visible(false); expect(frames.size).toBe(0);
    visible(); expect(frames.size).toBe(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(1);
    Object.defineProperty(media, 'matches', { configurable: true, value: true });
    act(() => { const event = new Event('change'); Object.defineProperty(event, 'matches', { value: true }); media.dispatchEvent(event); });
    expect(frames.size).toBe(0);
    visible(false); visible();
    expect(frames.size).toBe(0);
  });

  it('uses the official pointer lens and localized click ripple without rebuilding the text raster', async () => {
    const { container } = render(<WarpText text="CÈL·LULA" intro={false} idleDrift={0} clickRipple />);
    await flush(); visible();
    const raster = gpu.textures[0].image;
    const canvas = container.querySelector('canvas')!;
    fireEvent(canvas, new MouseEvent('pointermove', { clientX: 300, clientY: 120 }));
    fireEvent(canvas, new MouseEvent('pointerdown', { clientX: 300, clientY: 120 }));
    tick();
    expect(gpu.programs[0].uniforms.uPointerActive.value).toBeGreaterThan(0);
    expect((gpu.programs[0].uniforms.uClicks.value as number[][])[0][0]).toBe(.25);
    expect((gpu.programs[0].uniforms.uClicks.value as number[][])[0][1]).toBe(.75);
    expect((gpu.programs[0].uniforms.uClicks.value as number[][])[0][3]).toBe(1);
    expect(gpu.textures[0].image).toBe(raster);
  });

  it('shows fallback and reports unavailable WebGL without starting animation', async () => {
    gpu.fail = true;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onError = vi.fn();
    const { container } = render(<WarpText text="CÈL·LULA" onError={onError} />);
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('CÈL·LULA');
    expect(container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);
  });

  it('keeps HTML visible when Canvas2D cannot produce a text texture', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const onReady = vi.fn();
    const onError = vi.fn();
    const { container } = render(<WarpText text="CÈL·LULA" intro={false} onReady={onReady} onError={onError} />);
    await flush(); visible();
    expect(onReady).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(gpu.textures[0].image).toBeUndefined();
    expect(gpu.render).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(container).toHaveTextContent('CÈL·LULA');
  });

  it('cancels animation on context loss and exposes an HTML fallback', async () => {
    const onError = vi.fn();
    const { container } = render(<WarpText text="CÈL·LULA" intro={false} onError={onError} />);
    await flush(); visible();
    const event = new Event('webglcontextlost', { cancelable: true });
    fireEvent(container.querySelector('canvas')!, event);
    expect(event.defaultPrevented).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(container).toHaveTextContent('CÈL·LULA');
  });

  it('cleans every GPU resource, observer and preference listener in Strict Mode', async () => {
    const { container, unmount } = render(<StrictMode><WarpText text="CÈL·LULA" intro={false} /></StrictMode>);
    await flush(); visible();
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(gpu.textureDelete).toHaveBeenCalledTimes(2);
    expect(gpu.geometryRemove).toHaveBeenCalledTimes(2);
    expect(gpu.programRemove).toHaveBeenCalledTimes(2);
    expect(gpu.loseContext).toHaveBeenCalledTimes(2);
    expect(disconnectResize).toHaveBeenCalledTimes(2);
    expect(disconnectIntersection).toHaveBeenCalledTimes(2);
    expect(media.removeEventListener).toHaveBeenCalledTimes(2);
  });
});
