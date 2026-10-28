import { cloneElement, createRef, StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardSwap, { Card, type CardSwapHandle } from './CardSwap';

let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let media: MediaQueryList;
let resize: ResizeObserverCallback;
let disconnectResize: ReturnType<typeof vi.fn>;
let disconnectIntersection: ReturnType<typeof vi.fn>;

function pointer(target: Element, type: string, x: number, y = 100, pointerId = 1, pointerType = 'mouse') {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
    isPrimary: { value: pointerId === 1 },
  });
  fireEvent(target, event);
  return event;
}

function settle() {
  act(() => {
    let iterations = 0;
    while (frames.size && iterations++ < 1000) {
      vi.advanceTimersByTime(1000 / 60);
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(performance.now()));
    }
    expect(frames.size).toBe(0);
  });
}

function setReducedMotion(matches: boolean) {
  Object.defineProperty(media, 'matches', { configurable: true, value: matches });
  act(() => media.dispatchEvent(new Event('change')));
}

function deck(onChange = vi.fn(), options: { count?: number; onClick?: () => void; pointerMotion?: boolean } = {}) {
  const ref = createRef<CardSwapHandle>();
  const element = (
    <CardSwap ref={ref} autoplay={false} intro={false} parallax={options.pointerMotion ? 0.5 : 0} hoverSpread={options.pointerMotion ? 0.12 : 0} onChange={onChange}>
      {Array.from({ length: options.count ?? 3 }, (_, index) => (
        <Card key={index}><button onClick={options.onClick}>Obra {index + 1}</button></Card>
      ))}
    </CardSwap>
  );
  const view = render(element);
  const root = screen.getByRole('region');
  const slots = Array.from(view.container.querySelectorAll<HTMLElement>('[data-swap-index]'));
  root.setPointerCapture = vi.fn();
  root.releasePointerCapture = vi.fn();
  root.hasPointerCapture = vi.fn(() => true);
  return { ...view, ref, root, slots, element, onChange };
}

beforeEach(() => {
  vi.useFakeTimers();
  frames = new Map();
  frameId = 0;
  disconnectResize = vi.fn();
  disconnectIntersection = vi.fn();
  const target = new EventTarget();
  media = {
    media: '(prefers-reduced-motion: reduce)',
    matches: false,
    onchange: null,
    addEventListener: vi.fn(target.addEventListener.bind(target)),
    removeEventListener: vi.fn(target.removeEventListener.bind(target)),
    dispatchEvent: target.dispatchEvent.bind(target),
    addListener() {},
    removeListener() {},
  };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {}
    disconnect = disconnectResize;
  });
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect = disconnectIntersection;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the real React Bits CardSwap engine', () => {
  it('does no idle animation or autoplay work after mount, hover, visibility and resize', () => {
    const { root, slots, onChange, element, rerender } = deck();
    const initial = slots.map((slot) => slot.style.transform);
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    pointer(slots[0], 'pointermove', 180);
    pointer(root, 'pointerleave', 200);
    fireEvent(document, new Event('visibilitychange'));
    act(() => resize([], {} as ResizeObserver));
    rerender(cloneElement(element, { ariaLabel: 'Galería actualizada' }));
    act(() => vi.advanceTimersByTime(15000));
    expect(onChange).not.toHaveBeenCalled();
    expect(slots.map((slot) => slot.style.transform)).toEqual(initial);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('navigates circularly and returns the spring engine to complete rest', () => {
    const { ref, slots, onChange } = deck();
    act(() => ref.current?.next());
    settle();
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(slots[1]).toHaveAttribute('data-front');
    expect(slots[0].firstElementChild).toHaveAttribute('inert');
    expect(slots[0]).not.toHaveAttribute('inert');
    act(() => ref.current?.prev());
    settle();
    expect(onChange).toHaveBeenLastCalledWith(0);
    act(() => ref.current?.prev());
    settle();
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(slots[2]).not.toHaveAttribute('inert');
    expect(slots[2].firstElementChild).not.toHaveAttribute('inert');
    expect(slots[2]).not.toHaveAttribute('aria-hidden');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('settles official parallax and hover spread without scheduling idle frames or rotation timers', () => {
    const { root, slots, onChange } = deck(vi.fn(), { pointerMotion: true, count: 5 });
    const initial = slots.map(slot => slot.style.transform);
    const stage = slots[0].parentElement!;
    const perspectiveOrigin = stage.style.perspectiveOrigin;
    expect(frames.size).toBe(0);
    pointer(slots[0], 'pointermove', 180);
    expect(frames.size).toBeGreaterThan(0);
    settle();
    expect(slots[1].style.transform).not.toBe(initial[1]);
    expect(stage.style.perspectiveOrigin).not.toBe(perspectiveOrigin);
    const requestsAfterHover = vi.mocked(requestAnimationFrame).mock.calls.length;
    act(() => vi.advanceTimersByTime(15_000));
    expect(vi.mocked(requestAnimationFrame).mock.calls).toHaveLength(requestsAfterHover);
    expect(vi.getTimerCount()).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
    pointer(root, 'pointerleave', 200);
    settle();
    expect(slots.map(slot => slot.style.transform)).toEqual(initial);
    expect(stage.style.perspectiveOrigin).toBe(perspectiveOrigin);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('fits the complete stack proportionally on resize while preserving spatial poses', () => {
    const { root, slots } = deck(vi.fn(), { count: 5 });
    const stage = slots[0].parentElement!;
    const poses = slots.map(slot => slot.style.transform);
    const stageWidth = Number.parseFloat(root.style.getPropertyValue('--swap-stage-w'));
    const stageHeight = Number.parseFloat(root.style.getPropertyValue('--swap-stage-h'));
    Object.defineProperties(root, {
      clientWidth: { configurable: true, value: stageWidth / 2 },
      clientHeight: { configurable: true, value: stageHeight / 2 },
    });
    act(() => resize([], {} as ResizeObserver));
    expect(stage.style.transform).toContain('scale(0.5000)');
    expect(slots.map(slot => slot.style.transform)).toEqual(poses);
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('accepts a rear slot click while keeping its content out of the tab order', () => {
    const { slots, onChange } = deck(vi.fn(), { count: 5 });
    expect(slots[1]).not.toHaveAttribute('inert');
    expect(slots[1].firstElementChild).toHaveAttribute('inert');
    expect(slots[4]).toHaveAttribute('inert');
    fireEvent.click(slots[2]);
    expect(vi.getTimerCount()).toBe(0);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
    settle();
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(slots[2]).toHaveAttribute('data-front');
    expect(slots[2].firstElementChild).not.toHaveAttribute('inert');
    expect(slots[0].firstElementChild).toHaveAttribute('inert');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('snaps navigation immediately under reduced motion without RAF or timers', () => {
    setReducedMotion(true);
    const { ref, slots, onChange } = deck();
    act(() => ref.current?.next());
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(slots[1].style.transform).toContain('translate3d(0.00px, 0.00px, 0.00px)');
    act(() => ref.current?.prev());
    expect(slots[0]).toHaveAttribute('data-front');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('disables official pointer parallax and hover spread under reduced motion', () => {
    setReducedMotion(true);
    const { root, slots, ref, onChange } = deck(vi.fn(), { pointerMotion: true });
    const poses = slots.map(slot => slot.style.transform);
    pointer(slots[0], 'pointermove', 180);
    pointer(root, 'pointerleave', 200);
    expect(slots.map(slot => slot.style.transform)).toEqual(poses);
    act(() => ref.current?.next());
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('observes a changed motion preference and cancels a running transition', () => {
    const { ref, slots } = deck();
    act(() => ref.current?.next());
    expect(frames.size).toBeGreaterThan(0);
    setReducedMotion(true);
    expect(frames.size).toBe(0);
    expect(slots[1].style.transform).toContain('translate3d(0.00px, 0.00px, 0.00px)');
  });

  it('allows root arrow navigation without taking arrow keys from card buttons', () => {
    setReducedMotion(true);
    const { root, onChange } = deck();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Obra 1' }), { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    root.focus();
    fireEvent.keyDown(root, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(root).toHaveFocus();
  });

  it('drags the front card and captures the following click before child handlers', () => {
    const onClick = vi.fn();
    const { root, slots, onChange } = deck(vi.fn(), { onClick });
    pointer(slots[0], 'pointerdown', 100);
    pointer(root, 'pointermove', 300);
    expect(root).toHaveAttribute('data-dragging');
    pointer(root, 'pointerup', 300);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(slots[0].querySelector('button')!, click);
    expect(click.defaultPrevented).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
    expect(root).not.toHaveAttribute('data-dragging');
    settle();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it.each(['pointercancel', 'lostpointercapture'])('cancels %s without changing the front card', (type) => {
    const { root, slots, onChange } = deck();
    const initial = slots[0].style.transform;
    pointer(slots[0], 'pointerdown', 100);
    pointer(root, 'pointermove', 300);
    pointer(root, type, 300);
    settle();
    expect(onChange).not.toHaveBeenCalled();
    expect(slots[0].style.transform).toBe(initial);
    expect(root).not.toHaveAttribute('data-dragging');
  });

  it('keeps touch dragging when implicit capture transfers from card content to the deck', () => {
    const { root, slots, onChange } = deck();
    const content = slots[0].querySelector('button')!;
    pointer(content, 'pointerdown', 100, 100, 1, 'touch');
    pointer(root, 'pointermove', 150, 100, 1, 'touch');
    expect(root.setPointerCapture).toHaveBeenCalledWith(1);
    expect(root).toHaveAttribute('data-dragging');
    // The original target loses implicit capture after the deck has captured it.
    // This event bubbles even though the deck still owns the active pointer.
    pointer(content, 'lostpointercapture', 150, 100, 1, 'touch');
    expect(root).toHaveAttribute('data-dragging');
    expect(root.releasePointerCapture).not.toHaveBeenCalled();
    pointer(root, 'pointermove', 300, 100, 1, 'touch');
    pointer(root, 'pointerup', 300, 100, 1, 'touch');
    settle();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('preserves native vertical touch scrolling and accepts a horizontal swipe', () => {
    const { root, slots, onChange } = deck();
    pointer(slots[0], 'pointerdown', 100, 100, 1, 'touch');
    const vertical = pointer(root, 'pointermove', 110, 240, 1, 'touch');
    pointer(root, 'pointerup', 110, 240, 1, 'touch');
    expect(vertical.defaultPrevented).toBe(false);
    expect(root).not.toHaveAttribute('data-dragging');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    pointer(slots[0], 'pointerdown', 100, 100, 1, 'touch');
    pointer(root, 'pointermove', 300, 110, 1, 'touch');
    pointer(root, 'pointerup', 300, 110, 1, 'touch');
    settle();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('keeps a single card static for drag and both navigation directions', () => {
    const { ref, root, slots, onChange } = deck(vi.fn(), { count: 1 });
    pointer(slots[0], 'pointerdown', 100);
    pointer(root, 'pointermove', 300);
    pointer(root, 'pointerup', 300);
    act(() => { ref.current?.next(); ref.current?.prev(); });
    expect(onChange).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reuses deterministic server positions when hydrating in StrictMode', async () => {
    const element = <StrictMode><CardSwap autoplay={false} intro={false} parallax={0} hoverSpread={0}>
      <Card>Primera</Card><Card>Segunda</Card><Card>Tercera</Card>
    </CardSwap></StrictMode>;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);
    const slots = Array.from(container.querySelectorAll<HTMLElement>('[data-swap-index]'));
    expect(slots[1].style.transform).toContain('translate3d(60.00px, -70.00px, -90.00px)');
    expect(slots[1]).not.toHaveAttribute('inert');
    expect(slots[1].firstElementChild).toHaveAttribute('inert');
    const errors = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: errors }); });
      expect(errors).not.toHaveBeenCalled();
      expect(Array.from(container.querySelectorAll('[data-swap-index]'))).toEqual(slots);
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it('releases media/listener subscriptions and pending animation on unmount', () => {
    const removals = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const documentRemovals = vi.spyOn(document, 'removeEventListener');
    const { ref, root, unmount } = deck();
    act(() => ref.current?.next());
    unmount();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(documentRemovals).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(disconnectResize).toHaveBeenCalledOnce();
    expect(disconnectIntersection).toHaveBeenCalledOnce();
    expect(removals.mock.contexts.filter((context) => context === root)).toHaveLength(8);
  });
});
