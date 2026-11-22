import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LaboratorySelection } from '../types';
import { demoLaboratories } from '../data/laboratories';
import { LaboratoryImageWheel } from './laboratory-image-wheel';
import { LaboratorySection } from './laboratory-section';

const env = vi.hoisted(() => ({ desktop: true, reduced: false, clock: 0,
  frames: new Map<number, FrameRequestCallback>(), frameId: 0, resizeDisconnect: vi.fn(), intersectionDisconnect: vi.fn(),
  intersection: undefined as undefined | ((entries: Array<{ isIntersecting: boolean }>) => void) }));
vi.mock('gsap', () => ({ default: { to: (state: { rotation: number }, config: { rotation: number; onUpdate: () => void; onComplete: () => void }) => {
  state.rotation = config.rotation; config.onUpdate(); config.onComplete(); return { kill: vi.fn() };
} } }));
vi.mock('./laboratory-detail', () => ({ LaboratoryDetail: ({ selection, onClosed }: { selection: LaboratorySelection; onClosed: () => void }) => (
  <div role="dialog" aria-label={selection.laboratory.title}><button onClick={() => { selection.trigger.focus(); onClosed(); }}>Cerrar prueba</button></div>
) }));

beforeEach(() => {
  env.desktop = true; env.reduced = false; env.clock = 0; env.frames.clear(); env.frameId = 0;
  env.resizeDisconnect.mockClear(); env.intersectionDisconnect.mockClear();
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('reduced') ? env.reduced : env.desktop,
    addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = env.resizeDisconnect; });
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof env.intersection) { env.intersection = callback; } observe() {} disconnect = env.intersectionDisconnect; });
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { const id = ++env.frameId; env.frames.set(id, callback); return id; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => env.frames.delete(id)));
  vi.spyOn(performance, 'now').mockImplementation(() => env.clock);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, toJSON: () => ({}) });
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    releasePointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: () => true },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function pointer(element: Element, type: string, y = 300, x = 900, pointerType = 'mouse') {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerType: { value: pointerType }, pointerId: { value: 1 }, isPrimary: { value: true }, buttons: { value: 0 } });
  fireEvent(element, event); return event;
}
function frame(time: number) { act(() => { const entry = env.frames.entries().next().value; if (entry) { env.frames.delete(entry[0]); entry[1](time); } }); }
const viewport = () => screen.getByRole('group', { name: 'Explorar la rueda de imágenes' });

describe('Laboratory production image wheel', () => {
  it('mounts exactly one wheel at the existing anchor, without the old carousel or a second detail owner', () => {
    const { container } = render(<LaboratorySection />);
    expect(container.querySelectorAll('#laboratorio')).toHaveLength(1);
    expect(container.querySelectorAll('[data-image-wheel]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-wheel-viewport]')).toHaveLength(1);
    expect(container.querySelector('.laboratory-circular, [data-spatial-viewport]')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('passes the original project, real image source and focus button to the section selection contract', () => {
    const onSelect = vi.fn();
    render(<LaboratoryImageWheel laboratories={demoLaboratories} blocked={false} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: 'Explorar Membrana rosa, vista 1' });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith({ laboratory: demoLaboratories[0], source: button.querySelector('[data-wheel-media]'), trigger: button });
  });
  it('blocks actions while retaining the real focus return target', () => {
    const onSelect = vi.fn();
    render(<LaboratoryImageWheel laboratories={demoLaboratories} blocked onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: 'Explorar Membrana rosa, vista 1' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Imagen siguiente' })).toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('keeps an empty state and a single-view collection useful without creating motion or placeholder projects', () => {
    const { rerender } = render(<LaboratorySection laboratories={[]} />);
    expect(screen.getByText('Los estudios del laboratorio estarán disponibles pronto.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Imagen siguiente' })).toBeNull();
    rerender(<LaboratorySection laboratories={[{ ...demoLaboratories[0], gallery: [] }]} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Imagen siguiente' })).toBeDisabled();
    pointer(viewport(), 'pointermove');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('server renders real collection views and a static no-JS fallback without duplicate accessible images or a canvas', () => {
    const host = document.createElement('div'); host.innerHTML = renderToString(<LaboratorySection laboratories={demoLaboratories} />);
    expect(host.querySelectorAll('img')).toHaveLength(8);
    expect(host.querySelectorAll('[data-wheel-card]')).toHaveLength(8);
    expect(host.querySelector('noscript')).toHaveTextContent('Colección estática');
    expect(host.querySelector('canvas, [role="dialog"]')).toBeNull();
  });
  it('creates depth and shared perspective with no idle ticker, then rotates continuously by cursor and stops on exit', () => {
    render(<LaboratorySection laboratories={demoLaboratories} />);
    expect(document.querySelector('[data-wheel-scene]')).toHaveStyle({ perspective: '1000px' });
    const depths = [...document.querySelectorAll<HTMLElement>('[data-wheel-card]')].map(card => Number(card.dataset.depth));
    expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(200);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    pointer(viewport(), 'pointermove', 300, 500); expect(requestAnimationFrame).not.toHaveBeenCalled();
    pointer(viewport(), 'pointermove'); frame(16); frame(32);
    expect(Number(viewport().getAttribute('data-rotation'))).toBeLessThan(0);
    pointer(viewport(), 'pointerleave');
    expect(viewport()).toHaveAttribute('data-moving', 'false'); expect(env.frames.size).toBe(0);
  });
  it('centres a rear image before opening the existing project-selection contract and can reopen after closing', () => {
    render(<LaboratorySection laboratories={demoLaboratories} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acercar Corriente de cielo, vista 1' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Explorar Corriente de cielo, vista 1' }));
    expect(screen.getByRole('dialog', { name: 'Corriente de cielo' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar prueba' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Explorar Corriente de cielo, vista 1' }));
    expect(screen.getByRole('dialog', { name: 'Corriente de cielo' })).toBeVisible();
  });
  it('leaves touch scrolling native until exploration is explicitly enabled, then rotates and continues with bounded inertia', () => {
    env.desktop = false;
    render(<LaboratorySection laboratories={demoLaboratories} />);
    const root = viewport();
    pointer(root, 'pointerdown', 400, 150, 'touch'); pointer(root, 'pointermove', 320, 150, 'touch');
    expect(Number(root.getAttribute('data-rotation'))).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Explorar rueda' }));
    pointer(root, 'pointerdown', 400, 150, 'touch'); env.clock = 30; pointer(root, 'pointermove', 350, 150, 'touch');
    env.clock = 60; pointer(root, 'pointermove', 300, 150, 'touch');
    expect(Number(root.getAttribute('data-rotation'))).toBeLessThan(0);
    pointer(root, 'pointerup', 300, 150, 'touch');
    const before = Number(root.getAttribute('data-rotation')); frame(16);
    expect(Number(root.getAttribute('data-rotation'))).toBeLessThan(before);
    pointer(root, 'pointerleave', 300, 150, 'touch'); expect(env.frames.size).toBeGreaterThan(0);
    fireEvent.click(root.querySelector('[data-wheel-card] button')!);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Desplazar la página' }));
    expect(env.frames.size).toBe(0); expect(document.body.style.overflow).toBe('');
  });
  it('keeps reduced motion static and keyboard/manual navigation available', () => {
    env.reduced = true;
    render(<LaboratorySection laboratories={demoLaboratories} />);
    pointer(viewport(), 'pointermove'); expect(env.frames.size).toBe(0);
    fireEvent.keyDown(viewport(), { key: 'End' });
    expect(screen.getByRole('status')).toHaveTextContent('08 / 08');
    fireEvent.keyDown(viewport(), { key: 'Home' });
    expect(screen.getByRole('status')).toHaveTextContent('01 / 08');
    fireEvent.click(screen.getByRole('button', { name: 'Imagen siguiente' }));
    expect(screen.getByRole('status')).toHaveTextContent('02 / 08'); expect(env.frames.size).toBe(0);
  });
  it('pauses outside the viewport and when hidden, cancels gestures, and disconnects resources on unmount', () => {
    const { unmount } = render(<LaboratorySection laboratories={demoLaboratories} />);
    const root = viewport(); pointer(root, 'pointermove');
    act(() => env.intersection?.([{ isIntersecting: false }])); expect(env.frames.size).toBe(0);
    act(() => env.intersection?.([{ isIntersecting: true }])); pointer(root, 'pointermove');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); fireEvent(document, new Event('visibilitychange'));
    expect(env.frames.size).toBe(0);
    unmount(); expect(env.resizeDisconnect).toHaveBeenCalledOnce(); expect(env.intersectionDisconnect).toHaveBeenCalledOnce();
    pointer(root, 'pointermove'); expect(env.frames.size).toBe(0);
  });
  it('hydrates without replacing server images or recoverable errors', async () => {
    const host = document.createElement('div'); document.body.append(host);
    host.innerHTML = renderToString(<LaboratorySection laboratories={demoLaboratories} />);
    const image = host.querySelector('img'), onRecoverableError = vi.fn(); let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(host, <LaboratorySection laboratories={demoLaboratories} />, { onRecoverableError }); });
      expect(host.querySelector('img')).toBe(image); expect(onRecoverableError).not.toHaveBeenCalled();
    } finally { await act(async () => root?.unmount()); host.remove(); }
  });
  it('does not duplicate listeners or leave a RAF alive across StrictMode remounts', () => {
    const { unmount } = render(<StrictMode><LaboratorySection laboratories={demoLaboratories} /></StrictMode>);
    expect(env.resizeDisconnect).toHaveBeenCalledOnce();
    pointer(viewport(), 'pointermove');
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    unmount();
    expect(env.resizeDisconnect).toHaveBeenCalledTimes(2);
    expect(env.intersectionDisconnect).toHaveBeenCalledTimes(2);
    expect(env.frames.size).toBe(0);
  });
});
