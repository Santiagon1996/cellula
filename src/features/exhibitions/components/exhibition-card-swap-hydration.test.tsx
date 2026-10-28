import { act, StrictMode, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoArtworks } from '../data/demo-artworks';
import { ExhibitionCardSwap } from './exhibition-card-swap';

const browserWindow = window;
const browserDocument = document;

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function serverRender(element: ReactElement) {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  try { return renderToString(element); }
  finally {
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);
  }
}

describe('Exhibition CardSwap SSR and hydration with real next/image and engine', () => {
  it.each([
    [320, false, 5], [390, false, 5], [1440, false, 5],
    [390, true, 5], [1440, true, 5], [390, false, 0], [390, false, 1],
  ])('hydrates at width %i, reduced=%s, count=%i without replacing server nodes', async (width, reduced, count) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('innerWidth', width);
    const matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && reduced,
      media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    const element = <StrictMode><ExhibitionCardSwap artworks={demoArtworks.slice(0, count)} /></StrictMode>;
    const html = serverRender(element);
    expect(matchMedia).not.toHaveBeenCalled();
    expect(serverRender(element)).toBe(html);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const selectors = ['.exhibition-artwork-card', '.exhibition-artwork-card__frost', '.exhibition-artwork-card__detail', 'img'];
    const nodes = selectors.map(selector => [...container.querySelectorAll(selector)]);
    const ids = [...container.querySelectorAll('[id]')].map(node => node.id);
    const slots = [...container.querySelectorAll<HTMLElement>('[data-swap-index]')];
    const poses = slots.map(slot => slot.style.transform);
    expect(slots).toHaveLength(count);
    if (count) {
      expect(poses.every(Boolean)).toBe(true);
      expect(slots[0]).not.toHaveAttribute('inert');
      expect(slots[0].firstElementChild).not.toHaveAttribute('inert');
      expect(slots.slice(1).every(slot => slot.firstElementChild?.hasAttribute('inert'))).toBe(true);
      expect(slots.slice(0, 4).every(slot => !slot.hasAttribute('inert'))).toBe(true);
      expect(slots.slice(4).every(slot => slot.hasAttribute('inert'))).toBe(true);
    }
    const recoverable: unknown[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: Root | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: error => recoverable.push(error) }); });
      expect(recoverable).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
      for (const [index, selector] of selectors.entries()) {
        const client = [...container.querySelectorAll(selector)];
        expect(client).toHaveLength(nodes[index].length);
        client.forEach((node, i) => expect(node).toBe(nodes[index][i]));
      }
      expect([...container.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids);
      expect(slots.map(slot => slot.style.transform)).toEqual(poses);
      expect(container.querySelectorAll('.exhibition-artwork-card[data-active="true"]')).toHaveLength(count ? 1 : 0);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
