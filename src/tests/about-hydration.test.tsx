import { act, StrictMode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AboutSection } from '@/features/about';
import { aboutCopy } from '@/features/about/data/about-content';

vi.mock('@/features/about/hooks/use-about-scroll', () => ({ useAboutScroll: vi.fn() }));
vi.mock('@/features/about/hooks/use-ecosystem-motion', () => ({ useEcosystemMotion: vi.fn() }));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('About 2.0 server markup and hydration', () => {
  it.each([[320, false], [390, false], [1440, false], [390, true], [1440, true]])(
    'preserves semantic nodes at %ipx, reduced=%s', async (width, reduced) => {
      vi.stubGlobal('innerWidth', width);
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
      const media = vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion') && reduced,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', media);
      const disconnect = vi.fn();
      vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect = disconnect; });
      const view = <StrictMode><AboutSection /></StrictMode>;
      const markup = renderToString(view);
      expect(media).not.toHaveBeenCalled();
      expect(renderToString(view)).toBe(markup);
      const container = document.createElement('div');
      container.innerHTML = markup;
      document.body.appendChild(container);
      const nodes = [...container.querySelectorAll('h2,h3,button,[data-about-title-fallback]')];
      const ids = [...container.querySelectorAll('[id]')].map(node => node.id);
      const recoverable: unknown[] = [];
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, view, { onRecoverableError: failure => recoverable.push(failure) });
        });
        expect(recoverable).toEqual([]);
        expect(error).not.toHaveBeenCalled();
        const hydrated = [...container.querySelectorAll('h2,h3,button,[data-about-title-fallback]')];
        hydrated.forEach((node, index) => expect(node).toBe(nodes[index]));
        expect([...container.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids);
        expect(container.querySelector('#home-about-title')).toHaveAttribute('aria-label', aboutCopy.question);
        expect(container.querySelectorAll('[data-about-act]')).toHaveLength(3);
        expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
        expect(container.querySelector('a[href="#exposiciones"]')).toBeInTheDocument();
        expect(container.querySelector('canvas')).toBeNull();
      } finally {
        await act(async () => root?.unmount());
        container.remove();
      }
      expect(disconnect).toHaveBeenCalled();
    },
  );
});
