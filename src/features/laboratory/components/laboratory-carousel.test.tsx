import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Laboratory } from '../types';
import { LaboratoryCarousel } from './laboratory-carousel';

const animation = vi.hoisted(() => ({
  tickers: new Set<(time: number, delta: number) => void>(),
  tweens: [] as Array<{
    target: { value: number };
    active: boolean;
    update: (progress: number) => void;
    kill: () => void;
    isActive: () => boolean;
  }>,
}));

vi.mock('gsap', () => ({
  default: {
    ticker: {
      add: (callback: (time: number, delta: number) => void) => animation.tickers.add(callback),
      remove: (callback: (time: number, delta: number) => void) => animation.tickers.delete(callback),
    },
    quickSetter: (element: HTMLElement) => (value: number) => { element.style.transform = `translateY(${value}px)`; },
    killTweensOf: (target: { value: number }) => animation.tweens.filter((tween) => tween.target === target).forEach((tween) => tween.kill()),
    to: (target: { value: number }, options: { value: number; onUpdate?: () => void; onComplete?: () => void; overwrite?: boolean }) => {
      if (options.overwrite) animation.tweens.filter((tween) => tween.target === target).forEach((tween) => tween.kill());
      const initial = target.value;
      const tween = {
        target,
        active: true,
        update(progress: number) {
          if (!tween.active) return;
          target.value = initial + (options.value - initial) * progress;
          options.onUpdate?.();
          if (progress === 1) {
            tween.active = false;
            options.onComplete?.();
          }
        },
        kill() { tween.active = false; },
        isActive() { return tween.active; },
      };
      animation.tweens.push(tween);
      return tween;
    },
  },
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { src: string; alt: string; width: number; height: number; className: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt} />
  ),
}));

const laboratories: Laboratory[] = ['Forma', 'Color', 'Materia'].map((title, index) => ({
  id: `study-${index}`,
  slug: `study-${index}`,
  title,
  category: 'Estudio',
  shortDescription: 'Un estudio temporal.',
  description: 'Texto del estudio.',
  coverImage: { src: `/study-${index}.svg`, alt: `Obra ${title}`, width: 800, height: 1000 },
  gallery: [],
}));

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
    this.isPrimary = init.isPrimary ?? true;
  }
}

let reduced = false;
let hidden = false;
let cardHeight = 550;
let viewportHeight = 720;
let media: EventTarget;
let intersection: (entries: IntersectionObserverEntry[]) => void;
const resizeCallbacks: Array<() => void> = [];
const captures = new Set<number>();
const releaseCapture = vi.fn((id: number) => captures.delete(id));
const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();

function overrideProperty(name: string, descriptor: PropertyDescriptor) {
  originalDescriptors.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  Object.defineProperty(HTMLElement.prototype, name, { configurable: true, ...descriptor });
}

function tick(delta = 64) {
  act(() => animation.tickers.forEach((callback) => callback(0, delta)));
}

function offset(viewport: HTMLElement) {
  return Number(viewport.dataset.offset);
}

function firstCardPosition(viewport: HTMLElement) {
  const card = viewport.querySelector<HTMLElement>('[data-laboratory-card]')!;
  return Number(card.style.transform.match(/translateY\((-?[\d.]+)px\)/)?.[1]);
}

function renderCarousel(items = laboratories) {
  const onSelect = vi.fn();
  const result = render(<LaboratoryCarousel laboratories={items} paused={false} onSelect={onSelect} />);
  const viewport = result.container.querySelector<HTMLElement>('.laboratory-carousel__viewport');
  if (!viewport) throw new Error('The laboratory viewport did not render.');
  act(() => intersection([{ isIntersecting: true } as IntersectionObserverEntry]));
  return { ...result, viewport, onSelect };
}

beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  hidden = false;
  cardHeight = 550;
  viewportHeight = 720;
  media = new EventTarget();
  animation.tickers.clear();
  animation.tweens.length = 0;
  resizeCallbacks.length = 0;
  captures.clear();
  releaseCapture.mockClear();
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resizeCallbacks.push(callback); }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersection) { intersection = callback; }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return reduced; },
    addEventListener: media.addEventListener.bind(media),
    removeEventListener: media.removeEventListener.bind(media),
  }));
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  overrideProperty('clientHeight', { get: () => viewportHeight });
  overrideProperty('setPointerCapture', { value: (id: number) => captures.add(id) });
  overrideProperty('hasPointerCapture', { value: (id: number) => captures.has(id) });
  overrideProperty('releasePointerCapture', { value: releaseCapture });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const height = this.classList.contains('laboratory-card') ? cardHeight : viewportHeight;
    return { x: 0, y: 0, left: 0, top: 0, right: 440, bottom: height, width: 440, height, toJSON: () => ({}) };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
  originalDescriptors.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('LaboratoryCarousel', () => {
  it('moves cards without rerendering the gallery and keeps only one control per study', () => {
    const { viewport } = renderCarousel();
    const firstButton = screen.getByRole('button', { name: 'Abrir laboratorio: Forma' });
    const initial = offset(viewport);

    tick();

    expect(offset(viewport)).toBeCloseTo(initial - 28 * .064);
    expect(screen.getByRole('button', { name: 'Abrir laboratorio: Forma' })).toBe(firstButton);
    expect(viewport.querySelectorAll('[data-laboratory-card]')).toHaveLength(3);
    expect(viewport.querySelectorAll('button')).toHaveLength(3);
  });

  it('uses hidden visual copies for a small collection without duplicate buttons', () => {
    const { viewport, onSelect } = renderCarousel(laboratories.slice(0, 1));
    const copies = viewport.querySelectorAll<HTMLElement>('[data-copy="true"]');

    expect(copies).toHaveLength(2);
    expect(copies[0]).toHaveAttribute('aria-hidden', 'true');
    expect(viewport.querySelectorAll('button')).toHaveLength(1);
    fireEvent.click(copies[0]);
    expect(onSelect).toHaveBeenCalledWith({
      laboratory: laboratories[0],
      source: copies[0].querySelector('[data-lab-media]'),
      trigger: viewport,
    });
  });

  it('freezes an unfinished navigation at its exact offset when detail opens', () => {
    const { viewport, onSelect, rerender } = renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    const tween = animation.tweens.at(-1)!;
    act(() => tween.update(.3));
    const frozen = offset(viewport);

    rerender(<LaboratoryCarousel laboratories={laboratories} paused onSelect={onSelect} />);
    act(() => tween.update(1));
    tick();
    expect(offset(viewport)).toBe(frozen);
    expect(tween.active).toBe(false);

    rerender(<LaboratoryCarousel laboratories={laboratories} paused={false} onSelect={onSelect} />);
    expect(offset(viewport)).toBe(frozen);
    const beforeResume = firstCardPosition(viewport);
    tick();
    expect(firstCardPosition(viewport)).toBeCloseTo(beforeResume - 28 * .064);
  });

  it('stops autoplay and navigation immediately on selection before the paused prop arrives', () => {
    const { viewport, onSelect } = renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    const tween = animation.tweens.at(-1)!;
    act(() => tween.update(.2));
    const frozen = offset(viewport);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir laboratorio: Forma' }));
    act(() => tween.update(1));
    tick();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(offset(viewport)).toBe(frozen);
    expect(onSelect.mock.calls[0][0].source).toHaveAttribute('data-flip-id', 'laboratory-study-0');
  });

  it('updates source geometry during a paused resize without shifting it again on close', () => {
    const { viewport, onSelect, rerender } = renderCarousel();
    tick();
    const previous = offset(viewport);
    rerender(<LaboratoryCarousel laboratories={laboratories} paused onSelect={onSelect} />);
    cardHeight = 400;
    viewportHeight = 600;
    act(() => resizeCallbacks.forEach((callback) => callback()));

    const resized = offset(viewport);
    expect(resized).toBeCloseTo(previous * 424 / 574);
    expect(firstCardPosition(viewport)).toBeCloseTo(resized);
    tick();
    expect(offset(viewport)).toBe(resized);
    rerender(<LaboratoryCarousel laboratories={laboratories} paused={false} onSelect={onSelect} />);
    expect(offset(viewport)).toBe(resized);
    expect(firstCardPosition(viewport)).toBeCloseTo(resized);
  });

  it('restores pointer autoplay after detail returns focus before unpausing', () => {
    const { viewport, onSelect, rerender } = renderCarousel();
    const button = screen.getByRole('button', { name: 'Abrir laboratorio: Forma' });
    const focusVisible = vi.spyOn(button, 'matches').mockReturnValue(false);
    fireEvent.pointerDown(button, { button: 0 });
    fireEvent.focusIn(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button, { detail: 1 });
    fireEvent.focusOut(button, { relatedTarget: document.createElement('button') });
    rerender(<LaboratoryCarousel laboratories={laboratories} paused onSelect={onSelect} />);
    const frozen = firstCardPosition(viewport);

    focusVisible.mockReturnValue(true);
    fireEvent.focusIn(button);
    rerender(<LaboratoryCarousel laboratories={laboratories} paused={false} onSelect={onSelect} />);
    expect(firstCardPosition(viewport)).toBe(frozen);
    tick();
    expect(firstCardPosition(viewport)).toBeCloseTo(frozen - 28 * .064);
  });

  it('retains keyboard focus pause after detail returns focus before unpausing', () => {
    const { viewport, onSelect, rerender } = renderCarousel();
    const button = screen.getByRole('button', { name: 'Abrir laboratorio: Forma' });
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.focusIn(button);
    fireEvent.click(button);
    fireEvent.focusOut(button, { relatedTarget: document.createElement('button') });
    rerender(<LaboratoryCarousel laboratories={laboratories} paused onSelect={onSelect} />);
    const frozen = firstCardPosition(viewport);

    fireEvent.focusIn(button);
    rerender(<LaboratoryCarousel laboratories={laboratories} paused={false} onSelect={onSelect} />);
    tick();
    expect(firstCardPosition(viewport)).toBe(frozen);
  });

  it.each(['mouse', 'touch'])('distinguishes a %s drag from a tap and suppresses its generated click', (pointerType) => {
    const { viewport, onSelect } = renderCarousel();
    const button = screen.getByRole('button', { name: 'Abrir laboratorio: Forma' });
    const initial = offset(viewport);
    fireEvent.pointerDown(button, { pointerId: 7, pointerType, button: 0, clientX: 100, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 7, pointerType, clientX: 100, clientY: 260 });

    expect(offset(viewport)).toBe(initial - 40);
    expect(captures.has(7)).toBe(true);
    expect(viewport).toHaveAttribute('data-dragging', 'true');
    fireEvent.pointerUp(window, { pointerId: 7, pointerType });
    fireEvent.click(button, { detail: 1 });
    expect(onSelect).not.toHaveBeenCalled();
    expect(releaseCapture).toHaveBeenCalledWith(7);
    expect(viewport).toHaveAttribute('data-dragging', 'false');

    fireEvent.pointerDown(button, { pointerId: 8, pointerType, button: 0, clientX: 100, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 8, pointerType, clientX: 102, clientY: 303 });
    fireEvent.pointerUp(window, { pointerId: 8, pointerType });
    fireEvent.click(button, { detail: 1 });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('leaves wheel scrolling available and releases an active drag on window blur', () => {
    const { viewport } = renderCarousel();
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
    fireEvent(viewport, wheel);
    expect(wheel.defaultPrevented).toBe(false);

    fireEvent.pointerDown(viewport, { pointerId: 4, button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 4, clientY: 270 });
    fireEvent(window, new Event('blur'));
    expect(releaseCapture).toHaveBeenCalledWith(4);
    expect(viewport).toHaveAttribute('data-dragging', 'false');
  });

  it('continues touch dragging when implicit capture transfers from a child to the viewport', () => {
    const { viewport } = renderCarousel();
    const media = viewport.querySelector<HTMLElement>('[data-lab-media]')!;
    const initial = offset(viewport);
    fireEvent.pointerDown(media, { pointerId: 12, pointerType: 'touch', button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 12, pointerType: 'touch', clientY: 289.5 });
    fireEvent(media, new TestPointerEvent('lostpointercapture', { pointerId: 12, pointerType: 'touch', bubbles: true }));

    expect(viewport).toHaveAttribute('data-dragging', 'true');
    expect(releaseCapture).not.toHaveBeenCalled();
    fireEvent.pointerMove(window, { pointerId: 12, pointerType: 'touch', clientY: 230 });
    expect(offset(viewport)).toBe(initial - 70);
    expect(viewport).toHaveAttribute('data-dragging', 'true');

    captures.delete(12);
    fireEvent(viewport, new TestPointerEvent('lostpointercapture', { pointerId: 12, pointerType: 'touch', bubbles: true }));
    expect(viewport).toHaveAttribute('data-dragging', 'false');
    fireEvent.pointerMove(window, { pointerId: 12, pointerType: 'touch', clientY: 220 });
    expect(offset(viewport)).toBe(initial - 70);
  });

  it('keeps keyboard focus visible, stops motion, and selects the centered study with Enter', () => {
    const { viewport, onSelect } = renderCarousel();
    fireEvent.keyDown(viewport, { key: 'Tab' });
    const color = screen.getByRole('button', { name: 'Abrir laboratorio: Color' });
    act(() => color.focus({ preventScroll: true }));
    const focusedOffset = offset(viewport);
    tick();
    expect(offset(viewport)).toBe(focusedOffset);

    fireEvent.keyDown(color, { key: 'ArrowDown' });
    const matter = screen.getByRole('button', { name: 'Abrir laboratorio: Materia' });
    expect(matter).toHaveFocus();
    const card = matter.closest<HTMLElement>('[data-laboratory-card]')!;
    expect(card.style.transform).toBe('translateY(85px)');

    act(() => viewport.focus({ preventScroll: true }));
    fireEvent.keyDown(viewport, { key: 'Enter' });
    expect(onSelect.mock.calls[0][0].laboratory).toBe(laboratories[2]);
  });

  it('tabs through originals without scrolling and permits native control and page exits', () => {
    const { viewport } = renderCarousel();
    const first = screen.getByRole('button', { name: 'Abrir laboratorio: Forma' });
    const second = screen.getByRole('button', { name: 'Abrir laboratorio: Color' });
    const last = screen.getByRole('button', { name: 'Abrir laboratorio: Materia' });
    const previous = screen.getByRole('button', { name: 'Laboratorio anterior' });
    const next = screen.getByRole('button', { name: 'Laboratorio siguiente' });
    const firstFocus = vi.spyOn(first, 'focus');
    const tab = (target: HTMLElement, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
      fireEvent(target, event);
      return event;
    };

    act(() => viewport.focus());
    expect(tab(viewport).defaultPrevented).toBe(true);
    expect(first).toHaveFocus();
    expect(firstFocus).toHaveBeenCalledWith({ preventScroll: true });
    expect(tab(first).defaultPrevented).toBe(true);
    expect(second).toHaveFocus();
    expect(tab(second, true).defaultPrevented).toBe(true);
    expect(first).toHaveFocus();
    expect(tab(first, true).defaultPrevented).toBe(true);
    expect(viewport).toHaveFocus();
    expect(tab(viewport, true).defaultPrevented).toBe(false);

    act(() => last.focus());
    expect(tab(last).defaultPrevented).toBe(false);
    act(() => previous.focus());
    expect(tab(previous, true).defaultPrevented).toBe(true);
    expect(last).toHaveFocus();
    act(() => next.focus());
    expect(tab(next).defaultPrevented).toBe(false);
    expect(tab(next, true).defaultPrevented).toBe(false);
  });

  it('respects dynamic reduced motion while retaining manual navigation', () => {
    const { viewport } = renderCarousel();
    reduced = true;
    act(() => media.dispatchEvent(new Event('change')));
    const initial = offset(viewport);
    tick();

    expect(offset(viewport)).toBe(initial);
    expect(screen.getByRole('button', { name: 'Movimiento reducido activo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    expect(offset(viewport)).not.toBe(initial);

    reduced = false;
    act(() => media.dispatchEvent(new Event('change')));
    const navigated = firstCardPosition(viewport);
    tick();
    expect(firstCardPosition(viewport)).toBeCloseTo(navigated - 28 * .064);
  });

  it('stops offscreen or in a hidden document and removes motion and captures on unmount', () => {
    const { viewport, unmount } = renderCarousel();
    act(() => intersection([{ isIntersecting: false } as IntersectionObserverEntry]));
    const initial = offset(viewport);
    tick();
    expect(offset(viewport)).toBe(initial);

    act(() => intersection([{ isIntersecting: true } as IntersectionObserverEntry]));
    hidden = true;
    fireEvent(document, new Event('visibilitychange'));
    tick();
    expect(offset(viewport)).toBe(initial);
    hidden = false;
    fireEvent(document, new Event('visibilitychange'));
    tick();
    expect(offset(viewport)).toBeLessThan(initial);

    fireEvent.pointerDown(viewport, { pointerId: 9, button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 9, clientY: 240 });
    unmount();
    expect(animation.tickers.size).toBe(0);
    expect(animation.tweens.every((tween) => !tween.active)).toBe(true);
    expect(releaseCapture).toHaveBeenCalledWith(9);
  });

  it('offers a visible motion pause without blocking manual navigation', () => {
    const { viewport } = renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar movimiento' }));
    const initial = offset(viewport);
    tick();
    expect(offset(viewport)).toBe(initial);
    expect(screen.getByRole('button', { name: 'Reanudar movimiento' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    act(() => animation.tweens.at(-1)!.update(1));
    expect(offset(viewport)).not.toBe(initial);
  });

  it('resumes after keyboard navigation when the user switches to pointer controls', () => {
    const { viewport } = renderCarousel();
    fireEvent.keyDown(viewport, { key: 'Tab' });
    const initial = offset(viewport);
    tick();
    expect(offset(viewport)).toBe(initial);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Pausar movimiento' }), { button: 0 });
    tick();
    expect(offset(viewport)).toBeLessThan(initial);
  });
});
