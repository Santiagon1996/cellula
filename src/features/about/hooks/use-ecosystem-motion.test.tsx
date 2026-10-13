import { StrictMode, useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import type { AboutConceptId } from '../types';
import { useEcosystemMotion } from './use-ecosystem-motion';

class MotionQuery extends EventTarget {
  matches = false;
  constructor(readonly media: string) { super(); }
}

type MediaController = ReturnType<typeof gsap.matchMedia> & {
  contexts: Array<{ data: unknown[]; getTweens: () => gsap.core.Tween[] }>;
};

const ids: readonly AboutConceptId[] = ['crear', 'explorar', 'conectar'];
const initialPaths = [
  'M 100 115 C 150 72 220 70 295 95',
  'M 295 95 C 345 180 288 246 190 275',
  'M 190 275 C 93 257 54 184 100 115',
];
let queries: Map<string, MotionQuery>;

function query(fragment: string) {
  const result = Array.from(queries.values()).find((item) => item.media.includes(fragment));
  if (!result) throw new Error(`Missing media query: ${fragment}`);
  return result;
}

function refreshMedia(fragment: string, matches: boolean) {
  act(() => {
    query(fragment).matches = matches;
    // GSAP's refresh avoids its browser event debounce in deterministic tests.
    gsap.matchMediaRefresh();
  });
}

function Harness({ active }: { active: AboutConceptId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEcosystemMotion(rootRef, active);
  return (
    <div ref={rootRef}>
      <div data-about-organism>
        <svg viewBox="0 0 400 360" aria-hidden="true">
          {initialPaths.map((path, index) => <path key={index} data-about-connection d={path} />)}
        </svg>
        {ids.map((id) => (
          <button key={id} type="button" data-about-node={id} aria-pressed={active === id}>
            <span data-about-shape aria-hidden="true" />{id}
          </button>
        ))}
      </div>
      <p data-about-editorial>{active}: contenido siempre visible.</p>
    </div>
  );
}

function finish(timeline: gsap.core.Timeline) {
  act(() => { timeline.progress(1).pause(); });
}

beforeEach(() => {
  queries = new Map();
  vi.stubGlobal('matchMedia', (media: string) => {
    if (!queries.has(media)) queries.set(media, new MotionQuery(media));
    return queries.get(media)!;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useEcosystemMotion with GSAP', () => {
  it('reorganizes the selected node and curves while reusing a bounded timeline across many updates', () => {
    const mediaSpy = vi.spyOn(gsap, 'matchMedia');
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const { container, rerender } = render(<Harness active="crear" />);
    const timeline = timelineSpy.mock.results[0].value as gsap.core.Timeline;
    const controller = mediaSpy.mock.results[0].value as MediaController;
    const tracked = controller.contexts[0].data.length;
    const children = timeline.getChildren().length;
    const crear = screen.getByRole('button', { name: 'crear' });
    const explorar = screen.getByRole('button', { name: 'explorar' });
    const firstCurve = container.querySelector('path')!;

    expect(gsap.getProperty(crear, 'scaleX')).toBeCloseTo(1.08);
    expect(gsap.getProperty(explorar, 'scaleX')).toBeCloseTo(0.96);
    expect(firstCurve.getAttribute('d')).toMatch(/^M 94 111 C /);

    for (let index = 0; index < 45; index += 1) {
      rerender(<Harness active={ids[(index + 1) % ids.length]} />);
      finish(timeline);
    }
    rerender(<Harness active="explorar" />);
    finish(timeline);

    expect(mediaSpy).toHaveBeenCalledTimes(1);
    expect(timelineSpy).toHaveBeenCalledTimes(1);
    expect(controller.contexts[0].data).toHaveLength(tracked);
    expect(timeline.getChildren()).toHaveLength(children);
    expect(gsap.getProperty(explorar, 'scaleX')).toBeCloseTo(1.08);
    expect(gsap.getProperty(explorar, 'x')).toBeCloseTo(6);
    expect(gsap.getProperty(explorar, 'y')).toBeCloseTo(-5);
    expect(firstCurve.getAttribute('d')).toMatch(/^M 96 120 C /);
    expect(screen.getByText('explorar: contenido siempre visible.')).toBeVisible();
  });

  it('retargets a rapid selection from its current position without snapping to its old start', () => {
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const { rerender } = render(<Harness active="crear" />);
    const timeline = timelineSpy.mock.results[0].value as gsap.core.Timeline;
    const crear = screen.getByRole('button', { name: 'crear' });
    rerender(<Harness active="explorar" />);
    act(() => { timeline.progress(0.4).pause(); });
    const intermediateX = Number(gsap.getProperty(crear, 'x'));
    const intermediateY = Number(gsap.getProperty(crear, 'y'));

    rerender(<Harness active="conectar" />);

    expect(gsap.getProperty(crear, 'x')).toBeCloseTo(intermediateX);
    expect(gsap.getProperty(crear, 'y')).toBeCloseTo(intermediateY);
    finish(timeline);
    expect(gsap.getProperty(crear, 'x')).toBeCloseTo(-5);
    expect(screen.getByRole('button', { name: 'conectar' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the active concept visible and settles immediately when reduced motion changes mid-selection', () => {
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const { rerender } = render(<Harness active="crear" />);
    refreshMedia('min-width: 800px', true);
    const desktopTimeline = timelineSpy.mock.results.at(-1)!.value as gsap.core.Timeline;
    rerender(<Harness active="explorar" />);
    finish(desktopTimeline);
    const explorar = screen.getByRole('button', { name: 'explorar' });
    expect(gsap.getProperty(explorar, 'scaleX')).toBeCloseTo(1.12);
    expect(gsap.getProperty(explorar, 'x')).toBeCloseTo(10.5);

    rerender(<Harness active="conectar" />);
    act(() => { desktopTimeline.progress(0.25).pause(); });
    refreshMedia('prefers-reduced-motion', true);
    const reducedTimeline = timelineSpy.mock.results.at(-1)!.value as gsap.core.Timeline;
    const conectar = screen.getByRole('button', { name: 'conectar' });
    expect(reducedTimeline.paused()).toBe(true);
    expect(reducedTimeline.progress()).toBe(1);
    expect(gsap.getProperty(conectar, 'scaleX')).toBeCloseTo(1.015);
    expect(gsap.getProperty(conectar, 'x')).toBe(0);
    expect(gsap.getProperty(conectar, 'y')).toBe(0);
    expect(screen.getByText('conectar: contenido siempre visible.')).toBeVisible();

    rerender(<Harness active="crear" />);
    expect(gsap.getProperty(screen.getByRole('button', { name: 'crear' }), 'scaleX')).toBeCloseTo(1.015);
    expect(screen.getByText('crear: contenido siempre visible.')).toBeVisible();
    expect(reducedTimeline.paused()).toBe(true);
  });

  it('removes pointer handlers and restores animations through StrictMode cleanup and final unmount', () => {
    vi.stubGlobal('matchMedia', (media: string) => {
      if (!queries.has(media)) {
        const item = new MotionQuery(media);
        item.matches = media.includes('pointer: fine');
        queries.set(media, item);
      }
      return queries.get(media)!;
    });
    const mediaSpy = vi.spyOn(gsap, 'matchMedia');
    const timelineSpy = vi.spyOn(gsap, 'timeline');
    const { container, unmount } = render(<StrictMode><Harness active="conectar" /></StrictMode>);
    const node = screen.getByRole('button', { name: 'conectar' });
    const remove = vi.spyOn(node, 'removeEventListener');
    const targets = Array.from(container.querySelectorAll('[data-about-node], [data-about-shape], path'));
    const controllers = mediaSpy.mock.results.map((result) => result.value as MediaController);
    expect(controllers).toHaveLength(2);
    expect(controllers[0].contexts[0].data).toHaveLength(0);
    expect(gsap.getProperty(node, 'scaleX')).toBeCloseTo(1.08);

    unmount();

    for (const controller of controllers) expect(controller.contexts[0].data).toHaveLength(0);
    for (const type of ['pointerenter', 'pointermove', 'pointerleave', 'pointercancel']) {
      expect(remove).toHaveBeenCalledWith(type, expect.any(Function));
    }
    expect(gsap.getTweensOf(targets)).toHaveLength(0);
    expect(node.style.transform).toBe('');
    const created = timelineSpy.mock.calls.length;
    refreshMedia('prefers-reduced-motion', true);
    expect(timelineSpy).toHaveBeenCalledTimes(created);
  });
});
