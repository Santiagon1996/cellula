import { readdirSync } from 'node:fs';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeLanding } from './home-landing';

// ScrollTrigger registers at module import, before beforeEach can run.
const { matchMedia } = vi.hoisted(() => {
  const matchMedia = vi.fn((media: string) => ({
    media, matches: media.includes('prefers-reduced-motion: reduce') || media === '(min-width: 0px)',
    onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return { matchMedia };
});

// Discover implemented pages, rather than maintaining a second route allowlist.
function implementedRoutes(directory = path.resolve('src/app'), segments: string[] = []): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry): string[] => {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) return [];
      const next = entry.name.startsWith('(') || entry.name.startsWith('@')
        ? segments : [...segments, entry.name];
      return implementedRoutes(path.join(directory, entry.name), next);
    }
    return /^page\.(tsx?|jsx?)$/.test(entry.name) ? [`/${segments.join('/')}`] : [];
  });
}

function expectConnectedLinks(container: HTMLElement) {
  const routes = implementedRoutes();
  expect(routes).toContain('/');
  const links = [...container.querySelectorAll<HTMLAnchorElement>('a[href]')];
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    const href = link.getAttribute('href')!;
    expect(href, link.textContent ?? '').not.toBe('#');
    const target = new URL(href, 'https://cellula.test/');
    if (target.origin !== 'https://cellula.test') continue;
    expect(routes, `Unimplemented route: ${href}`).toContain(target.pathname);
    if (target.hash) {
      const id = decodeURIComponent(target.hash.slice(1));
      expect([...container.querySelectorAll('[id]')].filter(element => element.id === id),
        `Missing or duplicate destination: ${href}`).toHaveLength(1);
    }
  }
}

const scrollIntoView = vi.fn();
let previousScroll: PropertyDescriptor | undefined;

beforeEach(() => {
  scrollIntoView.mockReset();
  previousScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  // Real components and GSAP hooks; reduced motion makes navigation synchronous
  // and prevents a WebGL renderer in JSDOM. No feature or destination is mocked.
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('ResizeObserver', class {
    observe() {} unobserve() {} disconnect() {}
  });
  vi.stubGlobal('IntersectionObserver', class {
    observe() {} unobserve() {} disconnect() {}
  });
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (previousScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', previousScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  window.history.replaceState(null, '', '/');
});

describe('Navigation integrity of the real landing', () => {
  it('connects every server-rendered active link to an implemented page and unique real anchor', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<HomeLanding />);
    expectConnectedLinks(container);
    const ids = [...container.querySelectorAll('[id]')].map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['inicio', 'laboratorio', 'laboratorios', 'exposiciones']) {
      expect(ids).toContain(id);
    }
    expect(container.querySelector('#contacto, a[href="#contacto"], a[href="/exposiciones"]')).toBeNull();
    expect(container.querySelector('[data-featured-exhibition]')).not.toBeNull();
    expect(container.querySelector('.exhibition-card-swap')).not.toBeNull();
    expect(container.querySelector('[data-image-wheel]')).not.toBeNull();
  });

  it('keeps pending menu items noninteractive and preserves the accessible active names', () => {
    const { container } = render(<HomeLanding />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getAllByRole('link').map(link => link.textContent?.replace(/^0\d/, '').trim()))
      .toEqual(['HOME', 'QUÉ ES CÈL·LULA', 'EXPOSICIONES', 'LAB']);
    for (const name of ['HOME', 'QUÉ ES CÈL·LULA', 'EXPOSICIONES', 'LAB']) {
      expect(within(navigation).getByRole('link', { name })).toHaveAccessibleName(name);
    }
    for (const name of ['CONTACTO', 'QUÉ HACEMOS']) {
      const pending = within(navigation).getByText(name).closest('[aria-disabled="true"]')!;
      expect(pending.tagName).toBe('SPAN');
      expect(pending).toHaveTextContent('PRÓXIMAMENTE');
      expect(pending).not.toHaveAttribute('tabindex');
      expect(pending.closest('a, button')).toBeNull();
      expect(pending.querySelector('a, button, [tabindex]')).toBeNull();
    }
    expectConnectedLinks(container);
  });

  it('navigates to real sections after closing and restores focus when dismissed', () => {
    const { container } = render(<HomeLanding />);
    for (const [name, hash] of [
      ['HOME', '#inicio'], ['QUÉ ES CÈL·LULA', '#laboratorio'],
      ['EXPOSICIONES', '#exposiciones'], ['LAB', '#laboratorios'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      expect(screen.getByRole('link', { name: 'HOME' })).toHaveFocus();
      fireEvent.click(screen.getByRole('link', { name }));
      expect(container.querySelector(hash)).toHaveFocus();
      expect(window.location.hash).toBe(hash);
      expect(container.querySelector('main')).not.toHaveAttribute('inert');
      expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
    }
    expect(scrollIntoView).toHaveBeenCalledTimes(4);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
