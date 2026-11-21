import { useLayoutEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExhibitionFeatured } from './exhibition-featured';
import { featuredExhibition } from '../data/featured-exhibition';

const motion = vi.hoisted(() => ({
  reduced: false,
  timelines: [] as Array<{ config: Record<string, unknown>; fromTo: ReturnType<typeof vi.fn>; to: ReturnType<typeof vi.fn>; kill: ReturnType<typeof vi.fn>; scrollTrigger: { kill: ReturnType<typeof vi.fn> } }>,
  cleanups: [] as Array<() => void>,
}));
vi.mock('@gsap/react', () => ({ useGSAP: (callback: () => (() => void) | undefined) => useLayoutEffect(callback, [callback]) }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
vi.mock('gsap', () => ({ default: {
  registerPlugin: vi.fn(),
  timeline: (config: Record<string, unknown>) => {
    const timeline = { config, fromTo: vi.fn(), to: vi.fn(), kill: vi.fn(), scrollTrigger: { kill: vi.fn() } };
    timeline.fromTo.mockReturnValue(timeline);
    timeline.to.mockReturnValue(timeline);
    motion.timelines.push(timeline);
    return timeline;
  },
  matchMedia: () => ({
    add: (_query: string, callback: () => (() => void) | undefined) => {
      if (!motion.reduced) { const cleanup = callback(); if (cleanup) motion.cleanups.push(cleanup); }
    },
    revert: () => motion.cleanups.splice(0).forEach(cleanup => cleanup()),
  }),
} }));

beforeEach(() => {
  motion.reduced = false;
  motion.timelines = [];
  motion.cleanups = [];
  vi.stubGlobal('matchMedia', vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('Featured Exhibition photographic cover', () => {
  it('server renders the real photograph, one accessible image and provisional editorial content', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ExhibitionFeatured />);
    const image = container.querySelector<HTMLImageElement>('[data-featured-sharp]')!;
    expect(decodeURIComponent(image.src)).toContain(featuredExhibition.image.src);
    expect(image.alt).toBe(featuredExhibition.image.alt);
    expect(image.style.opacity).not.toBe('0');
    expect(container.querySelector('[data-featured-blurred]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('h2')).toHaveTextContent(featuredExhibition.coverTitle.join(' '));
    expect(container.querySelector('[data-editorial-status]')).toHaveAttribute('data-editorial-status', 'pending-confirmation');
    expect(container).toHaveTextContent('DESTACADO DEL MES');
    expect(container).toHaveTextContent(featuredExhibition.coverCaption);
    expect(container.querySelectorAll('h2 span')).toHaveLength(3);
    expect(container.querySelector('[data-featured-veil], .exhibition-featured__wash')).toBeNull();
    expect(container.querySelectorAll('button, a, canvas')).toHaveLength(0);
  });

  it('uses one reversible scrubbed timeline for the photographic layers without a luminous overlay', () => {
    render(<ExhibitionFeatured />);
    expect(motion.timelines).toHaveLength(1);
    expect(motion.timelines[0].config.scrollTrigger).toMatchObject({
      id: 'exhibition-featured-reveal', trigger: document.querySelector('[data-featured-exhibition]'),
      start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true,
    });
    expect(motion.timelines[0].fromTo.mock.calls.map(call => call[0])).toEqual([
      document.querySelector('.exhibition-featured__media'), document.querySelector('[data-featured-blurred]'),
    ]);
    const blurred = document.querySelector('[data-featured-blurred]');
    const mediaLayer = document.querySelector('.exhibition-featured__media');
    expect(motion.timelines[0].fromTo).toHaveBeenCalledWith(blurred, { opacity: 1 }, { opacity: 0, duration: 0.4 }, 0);
    expect(motion.timelines[0].to.mock.calls).toEqual([
      [blurred, { opacity: 1, duration: 0.2 }, 0.7],
      [mediaLayer, { opacity: 0, duration: 0.1 }, 0.9],
    ]);
    // No tween controls the sharp base or typography, and focus remains clear from .4 to .7.
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'NOMBRE DESTACADO DEL MES', level: 2 })).toBeVisible();
  });

  it('retains the sharp static presentation with reduced motion', () => {
    motion.reduced = true;
    render(<ExhibitionFeatured />);
    expect(motion.timelines).toHaveLength(0);
    expect(screen.getByRole('img')).toHaveAttribute('alt', featuredExhibition.image.alt);
    expect(screen.getByText(featuredExhibition.coverCaption)).toBeVisible();
  });

  it('releases its own trigger and timeline on unmount', () => {
    const { unmount } = render(<ExhibitionFeatured />);
    const timeline = motion.timelines[0];
    unmount();
    expect(timeline.scrollTrigger.kill).toHaveBeenCalledOnce();
    expect(timeline.kill).toHaveBeenCalledOnce();
  });

  it('hydrates the server photograph and heading without replacing nodes or recoverable errors', async () => {
    motion.reduced = true;
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ExhibitionFeatured />);
    document.body.append(container);
    const image = container.querySelector('[data-featured-sharp]');
    const heading = container.querySelector('h2');
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, <ExhibitionFeatured />, { onRecoverableError }); });
      expect(container.querySelector('[data-featured-sharp]')).toBe(image);
      expect(container.querySelector('h2')).toBe(heading);
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      await act(async () => { root?.unmount(); });
      container.remove();
    }
  });
});
