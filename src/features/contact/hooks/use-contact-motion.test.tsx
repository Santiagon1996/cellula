import { StrictMode, useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import type { ContactPanelId } from '../types';
import { useContactMotion } from './use-contact-motion';

// The browser scroll boundary is mocked; transitions below use real GSAP.
const scroll = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: class ScrollTrigger {
    static refresh = scroll.refresh;
    static create(_options: unknown, animation: { scrollTrigger?: unknown }) {
      const instance = new ScrollTrigger();
      animation.scrollTrigger = instance;
      return instance;
    }
    kill() {}
    revert() {}
  },
}));

class MotionQuery extends EventTarget {
  matches = false;
  constructor(readonly media: string) { super(); }
}

type MediaController = ReturnType<typeof gsap.matchMedia> & {
  contexts: Array<{ data: unknown[] }>;
};
const ids: readonly ContactPanelId[] = ['conversemos', 'colaboremos', 'conectemos'];
let queries: Map<string, MotionQuery>;

function refreshMedia(fragment: string, matches: boolean) {
  const query = Array.from(queries.values()).find((item) => item.media.includes(fragment));
  if (!query) throw new Error(`Missing media query: ${fragment}`);
  act(() => {
    query.matches = matches;
    gsap.matchMediaRefresh();
  });
}

function Harness({ active, editorial = false }: { active: ContactPanelId; editorial?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useContactMotion(rootRef, active);
  return (
    <section ref={rootRef} data-contact-section>
      <style>{'[data-contact-panel][data-active="false"] { visibility: hidden; }'}</style>
      {editorial && <h2><span data-contact-word>¿Hacemos</span><span data-contact-word>algo juntos?</span></h2>}
      <div data-contact-stage data-testid="stage">
        <div data-contact-art data-testid="art" aria-hidden="true" />
        {ids.map((id) => (
          <div key={id} data-contact-panel={id} data-active={active === id} aria-hidden={active !== id} inert={active !== id}>
            <h3 data-contact-reveal>{id}</h3><p data-contact-reveal>{id}: contenido editorial.</p>
          </div>
        ))}
      </div>
      {editorial && <p data-contact-finale>El siguiente encuentro.</p>}
    </section>
  );
}

function finish(timeline: gsap.core.Timeline) {
  act(() => { timeline.progress(1).pause(); });
}

function pointerMove(element: Element, pointerType: string, clientX = 180, clientY = 80) {
  const event = new MouseEvent('pointermove', { bubbles: true, clientX, clientY });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(element, event);
}

beforeEach(() => {
  queries = new Map();
  vi.stubGlobal('matchMedia', (media: string) => {
    if (!queries.has(media)) queries.set(media, new MotionQuery(media));
    return queries.get(media)!;
  });
  scroll.refresh.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useContactMotion with GSAP', () => {
  it('leaves all editorial copy immediately visible and creates no animation for an initial reduced-motion preference', () => {
    vi.stubGlobal('matchMedia', (media: string) => {
      if (!queries.has(media)) {
        const item = new MotionQuery(media);
        item.matches = media.includes('prefers-reduced-motion');
        queries.set(media, item);
      }
      return queries.get(media)!;
    });
    const timeline = vi.spyOn(gsap, 'timeline');
    const entrance = vi.spyOn(gsap, 'fromTo');
    const pointer = vi.spyOn(gsap, 'quickTo');
    const { rerender } = render(<Harness active="conversemos" editorial />);

    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
    expect(screen.getByText('El siguiente encuentro.')).toBeVisible();
    expect(timeline).not.toHaveBeenCalled();
    expect(entrance).not.toHaveBeenCalled();
    expect(pointer).not.toHaveBeenCalled();
    rerender(<Harness active="colaboremos" editorial />);
    expect(screen.getByText('colaboremos: contenido editorial.')).toBeVisible();
  });

  it('keeps the title and finale scroll entrances local and independent from panel selections', () => {
    const entrance = vi.spyOn(gsap, 'fromTo');
    const { container, rerender, unmount } = render(<Harness active="conversemos" editorial />);
    const titleWords = container.querySelectorAll('[data-contact-word]');
    const finale = container.querySelector('[data-contact-finale]');
    expect(entrance).toHaveBeenCalledTimes(2);
    expect(entrance.mock.calls[0][0]).toEqual(titleWords);
    expect(entrance.mock.calls[0][2].scrollTrigger).toEqual(expect.objectContaining({
      id: 'contact-intro', trigger: container.querySelector('section'), once: true,
    }));
    expect(entrance.mock.calls[1][2].scrollTrigger).toEqual(expect.objectContaining({
      id: 'contact-finale', trigger: finale, once: true,
    }));
    rerender(<Harness active="conectemos" editorial />);
    expect(entrance).toHaveBeenCalledTimes(2);
    const targets = [...titleWords, finale!];
    unmount();
    expect(gsap.getTweensOf(targets)).toHaveLength(0);
    for (const target of targets) expect((target as HTMLElement).style.transform).toBe('');
  });

  it('reuses a bounded timeline, masks the outgoing panel and settles the latest rapid selection', () => {
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const mediaSpy = vi.spyOn(gsap, 'matchMedia');
    const { container, rerender } = render(<Harness active="conversemos" />);
    const timeline = timelineSpy.mock.results[0].value as gsap.core.Timeline;
    const controller = mediaSpy.mock.results[0].value as MediaController;
    const tracked = controller.contexts[0].data.length;
    const children = timeline.getChildren().length;
    const initial = container.querySelector<HTMLElement>('[data-contact-panel="conversemos"]')!;
    const second = container.querySelector<HTMLElement>('[data-contact-panel="colaboremos"]')!;

    expect(screen.getByText('conversemos: contenido editorial.')).toBeVisible();
    rerender(<Harness active="colaboremos" />);
    expect(initial.style.visibility).toBe('visible');
    expect(second.style.visibility).toBe('visible');
    expect(gsap.getProperty(second, 'yPercent')).toBe(105);
    act(() => { timeline.progress(0.4).pause(); });
    expect(Number(gsap.getProperty(initial, 'yPercent'))).toBeLessThan(0);

    for (let index = 0; index < 45; index += 1) {
      rerender(<Harness active={ids[(index + 2) % ids.length]} />);
      act(() => { timeline.progress(0.25).pause(); });
    }
    rerender(<Harness active="conectemos" />);
    finish(timeline);

    expect(timelineSpy).toHaveBeenCalledTimes(1);
    expect(mediaSpy).toHaveBeenCalledTimes(1);
    expect(controller.contexts[0].data).toHaveLength(tracked);
    expect(timeline.getChildren()).toHaveLength(children);
    expect(screen.getByText('conectemos: contenido editorial.')).toBeVisible();
    expect(screen.getByText('colaboremos: contenido editorial.')).not.toBeVisible();
    for (const panel of container.querySelectorAll<HTMLElement>('[data-contact-panel]')) {
      expect(panel.style.transform).toBe('');
      expect(panel.style.opacity).toBe('');
      expect(panel.style.visibility).toBe('');
    }
    const restart = vi.spyOn(timeline, 'restart');
    rerender(<Harness active="conectemos" />);
    expect(restart).not.toHaveBeenCalled();
  });

  it('settles the latest content when reduced motion changes during a transition', () => {
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const { container, rerender } = render(<Harness active="conversemos" />);
    const timeline = timelineSpy.mock.results[0].value as gsap.core.Timeline;
    rerender(<Harness active="colaboremos" />);
    act(() => { timeline.progress(0.35).pause(); });

    refreshMedia('prefers-reduced-motion', true);

    expect(screen.getByText('colaboremos: contenido editorial.')).toBeVisible();
    expect(gsap.getTweensOf(container.querySelectorAll('[data-contact-panel]'))).toHaveLength(0);
    rerender(<Harness active="conectemos" />);
    expect(screen.getByText('conectemos: contenido editorial.')).toBeVisible();
    expect(timelineSpy).toHaveBeenCalledTimes(1);
    for (const element of container.querySelectorAll<HTMLElement>('[data-contact-panel], [data-contact-reveal]')) {
      expect(element.style.transform).toBe('');
      expect(element.style.opacity).toBe('');
    }

    refreshMedia('prefers-reduced-motion', false);
    rerender(<Harness active="conversemos" />);
    finish(timelineSpy.mock.results.at(-1)!.value as gsap.core.Timeline);
    expect(screen.getByText('conversemos: contenido editorial.')).toBeVisible();
  });

  it('limits cursor movement, ignores touch and removes pointer response when the media changes', () => {
    const quickSpy = vi.spyOn(gsap, 'quickTo');
    const { unmount } = render(<Harness active="conversemos" />);
    const stage = screen.getByTestId('stage');
    expect(quickSpy).not.toHaveBeenCalled();
    refreshMedia('pointer: fine', true);
    expect(quickSpy).toHaveBeenCalledTimes(2);
    const horizontal = quickSpy.mock.results[0].value as ReturnType<typeof gsap.quickTo>;
    const vertical = quickSpy.mock.results[1].value as ReturnType<typeof gsap.quickTo>;
    const resetX = vi.spyOn(horizontal.tween, 'resetTo');
    const resetY = vi.spyOn(vertical.tween, 'resetTo');

    pointerMove(stage, 'touch');
    expect(resetX).not.toHaveBeenCalled();
    pointerMove(stage, 'mouse', 10000, -10000);
    expect(resetX).toHaveBeenLastCalledWith('x', 8, undefined, undefined);
    expect(resetY).toHaveBeenLastCalledWith('y', -8, undefined, undefined);
    fireEvent.pointerLeave(stage);
    expect(resetX).toHaveBeenLastCalledWith('x', 0, undefined, undefined);
    expect(resetY).toHaveBeenLastCalledWith('y', 0, undefined, undefined);

    refreshMedia('prefers-reduced-motion', true);
    resetX.mockClear();
    resetY.mockClear();
    pointerMove(stage, 'mouse');
    fireEvent.pointerLeave(stage);
    expect(resetX).not.toHaveBeenCalled();
    expect(resetY).not.toHaveBeenCalled();
    expect(screen.getByTestId('art').style.transform).toBe('');
    unmount();
  });

  it('cleans only local animations and listeners through StrictMode and unmount', () => {
    const mediaSpy = vi.spyOn(gsap, 'matchMedia');
    const { container, rerender, unmount } = render(<StrictMode><Harness active="conversemos" /></StrictMode>);
    refreshMedia('pointer: fine', true);
    const stage = screen.getByTestId('stage');
    const remove = vi.spyOn(stage, 'removeEventListener');
    const targets = container.querySelectorAll('[data-contact-panel], [data-contact-reveal], [data-contact-art]');
    rerender(<StrictMode><Harness active="conectemos" /></StrictMode>);
    const controllers = mediaSpy.mock.results.map((result) => result.value as MediaController);
    expect(controllers).toHaveLength(2);
    expect(controllers[0].contexts[0].data).toHaveLength(0);

    unmount();

    for (const controller of controllers) {
      for (const context of controller.contexts) expect(context.data).toHaveLength(0);
    }
    expect(gsap.getTweensOf(targets)).toHaveLength(0);
    for (const type of ['pointermove', 'pointerleave', 'pointercancel']) {
      expect(remove).toHaveBeenCalledWith(type, expect.any(Function));
    }
    for (const element of targets) expect((element as HTMLElement).style.transform).toBe('');
  });
});
