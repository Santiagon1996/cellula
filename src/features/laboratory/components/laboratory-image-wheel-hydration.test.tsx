import { act, StrictMode, type ReactElement } from 'react';
import { fireEvent, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoLaboratories } from '../data/laboratories';
import { laboratoryViews } from '../data/laboratory-views';
import { LaboratorySection } from './laboratory-section';

const browserWindow = window, browserDocument = document;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function checkHydration(width: number, reduced: boolean, count: number, strict = false,
  inspect?: (host: HTMLElement) => void) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const projects = demoLaboratories.slice(0, count);
  const host = document.createElement('div');
  let firstMediaSnapshot: string | undefined;
  const media = vi.fn((query: string) => {
    firstMediaSnapshot ??= host.innerHTML;
    const target = new EventTarget();
    return { matches: query.includes('reduced') ? reduced : width >= 768,
      addEventListener: vi.fn(target.addEventListener.bind(target)),
      removeEventListener: vi.fn(target.removeEventListener.bind(target)) };
  });
  vi.stubGlobal('matchMedia', media);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  const section = <LaboratorySection laboratories={projects} />;
  const element: ReactElement = strict ? <StrictMode>{section}</StrictMode> : section;
  let server: string;
  vi.stubGlobal('window', undefined); vi.stubGlobal('document', undefined);
  try { server = renderToString(element); }
  finally { vi.stubGlobal('window', browserWindow); vi.stubGlobal('document', browserDocument); }
  expect(media).not.toHaveBeenCalled();
  host.innerHTML = server; document.body.append(host);
  const html = host.innerHTML, nodes = [...host.querySelectorAll('*')], images = [...host.querySelectorAll('img')];
  expect(images).toHaveLength(laboratoryViews(projects).length);
  const onRecoverableError = vi.fn(), consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(host, element, { onRecoverableError }); });
    expect([...host.querySelectorAll('*')]).toEqual(nodes);
    [...host.querySelectorAll('img')].forEach((image, index) => expect(image).toBe(images[index]));
    expect(host.querySelectorAll('#laboratorios')).toHaveLength(1);
    expect(host.querySelectorAll('[data-image-wheel]')).toHaveLength(1);
    if (count) {
      expect(firstMediaSnapshot).toBe(html);
      expect(host.querySelector('[data-wheel-viewport]')).toHaveAttribute('data-axis', width >= 768 ? 'horizontal' : 'vertical');
      expect(host.querySelector('[data-wheel-viewport]')).toHaveAttribute('data-reduced', String(reduced));
      expect(host.querySelectorAll('[data-front="true"]')).toHaveLength(1);
    } else {
      expect(media).not.toHaveBeenCalled();
      expect(host.querySelector('button')).toBeNull();
    }
    inspect?.(host);
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    if (root) await act(async () => root?.unmount());
    host.remove();
    for (const result of media.mock.results) if (result.type === 'return') {
      expect(result.value.removeEventListener.mock.calls).toEqual(result.value.addEventListener.mock.calls);
    }
  }
}

describe('Production Laboratory hydration with the real wheel and next/image', () => {
  for (const width of [390, 1440]) for (const reduced of [false, true]) {
    for (const count of [0, 1, 2, 3]) it(`preserves all server nodes at ${width}px, reduced ${reduced}, ${count} projects`, async () => {
      await checkHydration(width, reduced, count);
    });
    it(`cleans and remounts StrictMode at ${width}px, reduced ${reduced}`, async () => {
      await checkHydration(width, reduced, 3, true);
      await checkHydration(width, reduced, 3, true);
    });
  }
  it('wraps both ways after hydration while retaining every view node and project identity', async () => {
    await checkHydration(1440, true, 3, false, host => {
      const cards = [...host.querySelectorAll('[data-wheel-card]')];
      fireEvent.click(within(host).getByRole('button', { name: 'Imagen anterior' }));
      expect(host.querySelector('[data-front="true"]')).toBe(cards[7]);
      expect(cards[7]).toHaveAttribute('data-lab-id', demoLaboratories[2].id);
      fireEvent.click(within(host).getByRole('button', { name: 'Imagen siguiente' }));
      expect(host.querySelector('[data-front="true"]')).toBe(cards[0]);
      expect([...host.querySelectorAll('[data-wheel-card]')]).toEqual(cards);
    });
  });
});
