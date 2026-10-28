import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Laboratory, LaboratorySelection } from '../types';
import { useCircularCarousel } from './use-circular-carousel';

const animation = vi.hoisted(() => ({
  tweens: [] as Array<{ active: boolean; duration: number; update: (progress: number) => void; kill: () => void }>,
}));

vi.mock('gsap', () => ({
  default: {
    to: (target: { value: number }, options: { value: number; duration: number; onUpdate: () => void; onComplete: () => void }) => {
      const initial = target.value;
      const tween = {
        active: true,
        duration: options.duration,
        update(progress: number) {
          if (!tween.active) return;
          target.value = initial + (options.value - initial) * progress;
          options.onUpdate();
          if (progress === 1) { tween.active = false; options.onComplete(); }
        },
        kill() { tween.active = false; },
      };
      animation.tweens.push(tween);
      return tween;
    },
  },
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

function Harness({ items = laboratories, blocked = false, onSelect }: { items?: readonly Laboratory[]; blocked?: boolean; onSelect: (selection: LaboratorySelection) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { activeId, orientation, navigate, select } = useCircularCarousel({ rootRef, viewportRef, laboratories: items, blocked, onSelect });
  return <div ref={rootRef} data-testid="root" data-active-id={activeId} data-orientation={orientation}>
    <div ref={viewportRef} tabIndex={0} data-testid="viewport">
      {items.map((laboratory) => <button key={laboratory.id} data-circular-card data-lab-id={laboratory.id} tabIndex={activeId === laboratory.id ? 0 : -1}
        onClick={(event) => select({ laboratory, source: event.currentTarget.querySelector('[data-lab-media]')!, trigger: event.currentTarget })}>
        {laboratory.title}<span data-lab-media />
      </button>)}
    </div>
    <button onClick={() => navigate(-1)}>Anterior</button>
    <button onClick={() => navigate(1)}>Siguiente</button>
  </div>;
}

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

let desktop = false;
let reduced = false;
let hidden = false;
let desktopMedia: EventTarget;
let motionMedia: EventTarget;
let intersection: (entries: IntersectionObserverEntry[]) => void;
const resizeCallbacks: Array<() => void> = [];
const captures = new Set<number>();
const releaseCapture = vi.fn((id: number) => captures.delete(id));
const descriptors = new Map<string, PropertyDescriptor | undefined>();

function overrideProperty(name: string, descriptor: PropertyDescriptor) {
  descriptors.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  Object.defineProperty(HTMLElement.prototype, name, { configurable: true, ...descriptor });
}

function renderEngine(items: readonly Laboratory[] = laboratories) {
  const onSelect = vi.fn();
  const result = render(<Harness items={items} onSelect={onSelect} />);
  const viewport = screen.getByTestId('viewport');
  const root = screen.getByTestId('root');
  return { ...result, viewport, root, onSelect };
}

function finish() { act(() => animation.tweens.at(-1)?.update(1)); }
function position(viewport: HTMLElement) { return Number(viewport.dataset.position); }
function switchDesktop(next: boolean) {
  desktop = next;
  act(() => desktopMedia.dispatchEvent(new Event('change')));
}

beforeEach(() => {
  vi.useFakeTimers();
  desktop = false;
  reduced = false;
  hidden = false;
  desktopMedia = new EventTarget();
  motionMedia = new EventTarget();
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
  vi.stubGlobal('matchMedia', (query: string) => {
    const media = query.includes('min-width') ? desktopMedia : motionMedia;
    return {
      get matches() { return query.includes('min-width') ? desktop : reduced; },
      addEventListener: media.addEventListener.bind(media),
      removeEventListener: media.removeEventListener.bind(media),
    };
  });
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  overrideProperty('offsetWidth', { get: () => 280 });
  overrideProperty('offsetHeight', { get: () => 320 });
  overrideProperty('setPointerCapture', { value: (id: number) => captures.add(id) });
  overrideProperty('hasPointerCapture', { value: (id: number) => captures.has(id) });
  overrideProperty('releasePointerCapture', { value: releaseCapture });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [name, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
  descriptors.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useCircularCarousel', () => {
  it('stays completely still for 15 seconds without scheduling autoplay or animation work', () => {
    const { root, viewport } = renderEngine();
    const initial = viewport.innerHTML;
    act(() => vi.advanceTimersByTime(15_000));
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    expect(viewport.innerHTML).toBe(initial);
    expect(position(viewport)).toBe(0);
    expect(animation.tweens).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('navigates in both directions through one logical card per laboratory', () => {
    const { root, viewport } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(root).toHaveAttribute('data-active-id', 'study-2');
    finish();
    expect(position(viewport)).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    finish();
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    expect(position(viewport)).toBe(0);
    expect(viewport.querySelectorAll('[data-circular-card]')).toHaveLength(3);
    expect(animation.tweens.every((tween) => tween.duration > 0 && tween.duration < 1)).toBe(true);
  });

  it('keeps the last commanded identity when controls are pressed before snap finishes', () => {
    const { root, viewport } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const previous = animation.tweens.at(-1)!;
    act(() => previous.update(.2));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(previous.active).toBe(false);
    expect(root).toHaveAttribute('data-active-id', 'study-2');
    finish();
    expect(position(viewport)).toBe(2);
  });

  it('centers a lateral card before allowing its real visual to open with Flip', () => {
    const { root, viewport, onSelect } = renderEngine();
    const button = screen.getByRole('button', { name: 'Color' });
    fireEvent.click(button);
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(onSelect).not.toHaveBeenCalled();
    finish();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ laboratory: laboratories[1], source: button.querySelector('[data-lab-media]'), trigger: button });
    expect(position(viewport)).toBe(1);
    expect(button.style.transform).toContain('translate3d(0px, 0px, 0px)');
    expect(animation.tweens.every((tween) => !tween.active)).toBe(true);
  });

  it('blocks selection and navigation throughout detail, then returns to the same quiet identity', () => {
    const { viewport, onSelect, rerender, root } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Forma' }));
    rerender(<Harness blocked onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(position(viewport)).toBe(0);
    rerender(<Harness blocked={false} onSelect={onSelect} />);
    act(() => vi.advanceTimersByTime(15_000));
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    expect(position(viewport)).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Forma' }));
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('changes axes on resize and retains the selected id while cancelling a live tween', () => {
    const { root, viewport } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const tween = animation.tweens.at(-1)!;
    act(() => tween.update(.3));
    switchDesktop(true);
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(position(viewport)).toBe(1);
    expect(tween.active).toBe(false);
    const neighbour = screen.getByRole('button', { name: 'Materia' }).style.transform;
    expect(neighbour).toMatch(/translate3d\([1-9]/);
    expect(neighbour).toContain('rotateX(0deg)');
    switchDesktop(false);
    expect(root).toHaveAttribute('data-orientation', 'vertical');
    expect(position(viewport)).toBe(1);
    expect(animation.tweens.every((item) => !item.active)).toBe(true);
  });

  it('retains selection by stable id when data is reordered and safely chooses a remaining id if removed', () => {
    const { root, viewport, onSelect, rerender } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    finish();
    rerender(<Harness items={[laboratories[1], laboratories[2], laboratories[0]]} onSelect={onSelect} />);
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(position(viewport)).toBe(0);
    rerender(<Harness items={[laboratories[2], laboratories[0]]} onSelect={onSelect} />);
    expect(root).toHaveAttribute('data-active-id', 'study-2');
    expect(position(viewport)).toBe(0);
  });

  it('uses orientation-specific arrows, Home and End with focus that does not scroll the landing', () => {
    const { root, viewport, onSelect } = renderEngine();
    const color = screen.getByRole('button', { name: 'Color' });
    const focus = vi.spyOn(color, 'focus');
    fireEvent.keyDown(viewport, { key: 'ArrowDown' });
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(color).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    finish();
    fireEvent.keyDown(color, { key: 'End' });
    finish();
    expect(root).toHaveAttribute('data-active-id', 'study-2');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Materia' }), { key: 'Home' });
    finish();
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    switchDesktop(true);
    fireEvent.keyDown(viewport, { key: 'ArrowDown' });
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    finish();
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    fireEvent.keyDown(viewport, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ laboratory: laboratories[1] }));
  });

  it('does not move focus away from an explicit previous/next control', () => {
    renderEngine();
    const next = screen.getByRole('button', { name: 'Siguiente' });
    act(() => next.focus());
    fireEvent.keyDown(next, { key: 'ArrowDown' });
    expect(next).toHaveFocus();
  });

  it.each(['mouse', 'touch'])('recognizes deliberate horizontal %s drags and suppresses their generated clicks without a timer', (pointerType) => {
    desktop = true;
    const { root, viewport, onSelect } = renderEngine();
    const button = screen.getByRole('button', { name: 'Forma' });
    fireEvent.pointerDown(button, { pointerId: 7, pointerType, button: 0, clientX: 300, clientY: 100 });
    act(() => vi.advanceTimersByTime(30));
    fireEvent.pointerMove(window, { pointerId: 7, pointerType, clientX: 100, clientY: 103 });
    expect(position(viewport)).toBeCloseTo(200 / 304);
    expect(captures.has(7)).toBe(true);
    fireEvent.pointerUp(window, { pointerId: 7, pointerType });
    expect(releaseCapture).toHaveBeenCalledWith(7);
    fireEvent.click(button, { detail: 1 });
    expect(onSelect).not.toHaveBeenCalled();
    finish();
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    fireEvent.click(button, { detail: 1 });
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(vi.getTimerCount()).toBe(0);
    const selected = screen.getByRole('button', { name: 'Color' });
    fireEvent.pointerDown(selected, { pointerId: 8, pointerType, button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(window, { pointerId: 8, pointerType });
    fireEvent.click(selected, { detail: 1 });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('leaves vertical touch and wheel gestures to the mobile document scroll', () => {
    const { viewport, onSelect } = renderEngine();
    const button = screen.getByRole('button', { name: 'Forma' });
    fireEvent.pointerDown(button, { pointerId: 4, pointerType: 'touch', button: 0, clientX: 100, clientY: 300 });
    const move = new TestPointerEvent('pointermove', { pointerId: 4, pointerType: 'touch', clientX: 100, clientY: 120, cancelable: true });
    fireEvent(window, move);
    expect(move.defaultPrevented).toBe(false);
    expect(position(viewport)).toBe(0);
    expect(captures.size).toBe(0);
    fireEvent.pointerUp(window, { pointerId: 4, pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });
    expect(onSelect).not.toHaveBeenCalled();
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 160 });
    fireEvent(viewport, wheel);
    expect(wheel.defaultPrevented).toBe(false);
    expect(animation.tweens).toHaveLength(0);
  });

  it('allows mouse vertical dragging on mobile and keeps sub-threshold pointer taps selectable', () => {
    const { viewport, onSelect } = renderEngine();
    const button = screen.getByRole('button', { name: 'Forma' });
    fireEvent.pointerDown(button, { pointerId: 3, button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 3, clientY: 250 });
    expect(position(viewport)).toBeCloseTo(50 / 344);
    fireEvent.pointerCancel(window, { pointerId: 3 });
    expect(viewport).toHaveAttribute('data-dragging', 'false');
    fireEvent.pointerDown(button, { pointerId: 5, button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 5, clientY: 295 });
    fireEvent.pointerUp(window, { pointerId: 5 });
    fireEvent.click(button, { detail: 1 });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('rejects a primarily vertical touch drag on desktop without preventing scroll', () => {
    desktop = true;
    const { viewport } = renderEngine();
    fireEvent.pointerDown(viewport, { pointerId: 9, pointerType: 'touch', button: 0, clientX: 100, clientY: 300 });
    const move = new TestPointerEvent('pointermove', { pointerId: 9, pointerType: 'touch', clientX: 120, clientY: 160, cancelable: true });
    fireEvent(window, move);
    expect(move.defaultPrevented).toBe(false);
    expect(position(viewport)).toBe(0);
    expect(captures.size).toBe(0);
  });

  it('settles on blur, capture loss and resize, releasing every pointer capture', () => {
    const { viewport } = renderEngine();
    for (const kind of ['blur', 'capture', 'resize']) {
      fireEvent.pointerDown(viewport, { pointerId: 6, button: 0, clientY: 300 });
      fireEvent.pointerMove(window, { pointerId: 6, clientY: 270 });
      expect(captures.has(6)).toBe(true);
      if (kind === 'capture') fireEvent(viewport, new TestPointerEvent('lostpointercapture', { pointerId: 6 }));
      else if (kind === 'resize') act(() => resizeCallbacks.forEach((callback) => callback()));
      else fireEvent(window, new Event('blur'));
      expect(viewport).toHaveAttribute('data-dragging', 'false');
      expect(captures.size).toBe(0);
      expect(position(viewport)).toBe(0);
    }
  });

  it('settles finite motion offscreen or in a hidden tab and never restarts on return', () => {
    const { root, viewport } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    act(() => animation.tweens.at(-1)!.update(.2));
    act(() => intersection([{ isIntersecting: false } as IntersectionObserverEntry]));
    expect(position(viewport)).toBe(1);
    const count = animation.tweens.length;
    act(() => intersection([{ isIntersecting: true } as IntersectionObserverEntry]));
    hidden = true;
    fireEvent(document, new Event('visibilitychange'));
    hidden = false;
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(15_000));
    expect(root).toHaveAttribute('data-active-id', 'study-1');
    expect(position(viewport)).toBe(1);
    expect(animation.tweens).toHaveLength(count);
    expect(animation.tweens.every((tween) => !tween.active)).toBe(true);
  });

  it('honours changing reduced-motion preferences and keeps manual navigation functional', () => {
    const { root, viewport } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    act(() => animation.tweens.at(-1)!.update(.25));
    reduced = true;
    act(() => motionMedia.dispatchEvent(new Event('change')));
    expect(position(viewport)).toBe(1);
    expect(animation.tweens.every((tween) => !tween.active)).toBe(true);
    const count = animation.tweens.length;
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(root).toHaveAttribute('data-active-id', 'study-2');
    expect(position(viewport)).toBe(2);
    expect(animation.tweens).toHaveLength(count);
    reduced = false;
    act(() => motionMedia.dispatchEvent(new Event('change')));
    act(() => vi.advanceTimersByTime(15_000));
    expect(position(viewport)).toBe(2);
    expect(animation.tweens).toHaveLength(count);
  });

  it('handles empty and single-card collections without navigation animation', () => {
    const { root, onSelect, rerender } = renderEngine([]);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.keyDown(screen.getByTestId('viewport'), { key: 'Enter' });
    expect(root).not.toHaveAttribute('data-active-id');
    expect(onSelect).not.toHaveBeenCalled();
    rerender(<Harness items={laboratories.slice(0, 1)} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(root).toHaveAttribute('data-active-id', 'study-0');
    expect(animation.tweens).toHaveLength(0);
  });

  it('kills live navigation and removes listeners and captures when unmounted', () => {
    const { viewport, unmount } = renderEngine();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const tween = animation.tweens.at(-1)!;
    fireEvent.pointerDown(viewport, { pointerId: 10, button: 0, clientY: 300 });
    fireEvent.pointerMove(window, { pointerId: 10, clientY: 250 });
    const before = position(viewport);
    unmount();
    expect(tween.active).toBe(false);
    expect(captures.size).toBe(0);
    fireEvent.pointerMove(window, { pointerId: 10, clientY: 100 });
    act(() => tween.update(1));
    expect(position(viewport)).toBe(before);
  });
});
