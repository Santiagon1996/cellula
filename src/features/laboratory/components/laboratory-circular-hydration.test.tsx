import Image from 'next/image';
import { act, StrictMode, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoLaboratories } from '../data/laboratories';
import { LaboratoryCircularCard } from './laboratory-circular-card';
import { LaboratoryCircularCarousel } from './laboratory-circular-carousel';

// Keep the real carousel hook and next/image: mocking either would hide a
// server/client image or viewport-dependent difference in the initial tree.
const browserWindow = window;
const browserDocument = document;

function installViewport(width: number, reducedMotion: boolean, onFirstMediaRead?: () => void) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('innerWidth', width);
  let mediaRead = false;
  const matchMedia = vi.fn((query: string) => {
    if (!mediaRead) {
      mediaRead = true;
      onFirstMediaRead?.();
    }
    const target = new EventTarget();
    return {
      media: query,
      matches: query === '(min-width: 768px)' ? width >= 768 : reducedMotion,
      onchange: null,
      addEventListener: vi.fn(target.addEventListener.bind(target)),
      removeEventListener: vi.fn(target.removeEventListener.bind(target)),
      dispatchEvent: target.dispatchEvent.bind(target),
      addListener() {},
      removeListener() {},
    } satisfies MediaQueryList;
  });
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  return matchMedia;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderWithoutBrowserGlobals(element: ReactElement) {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  try {
    return renderToString(element);
  } finally {
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);
  }
}

async function expectHydratedCarousel(
  width: number,
  reducedMotion: boolean,
  count: number,
  strictMode = false,
  onHydrated?: (container: HTMLDivElement) => Promise<void>,
) {
  const initialCommit: { snapshot?: { html: string; nodes: Element[] } } = {};
  const matchMedia = installViewport(width, reducedMotion, () => {
    // The real layout effect reads matchMedia before it measures, transforms
    // cards or changes orientation. Capture the actual hydrated commit here.
    initialCommit.snapshot = {
      html: container.innerHTML,
      nodes: Array.from(container.querySelectorAll('*')),
    };
  });
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const recoverableErrors: unknown[] = [];
  const laboratories = demoLaboratories.slice(0, count);
  const carousel = <LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={vi.fn()} />;
  const element = strictMode ? <StrictMode>{carousel}</StrictMode> : carousel;

  // A server has no browser globals. The client below has its actual
  // desktop/mobile preference, rather than sharing a fake server size.
  const serverHTML = renderWithoutBrowserGlobals(element);
  expect(matchMedia).not.toHaveBeenCalled();
  expect(renderToString(element)).toBe(serverHTML);
  expect(matchMedia).not.toHaveBeenCalled();

  const container = document.createElement('div');
  container.innerHTML = serverHTML;
  document.body.appendChild(container);
  const parsedServerHTML = container.innerHTML;
  const serverNodes = Array.from(container.querySelectorAll('*'));
  const serverCards = Array.from(container.querySelectorAll('[data-circular-card]'));
  const serverFrost = Array.from(container.querySelectorAll('.laboratory-circular-card__frost'));
  const serverImages = Array.from(container.querySelectorAll('img'));
  const serverDescriptions = Array.from(container.querySelectorAll('.laboratory-circular-card__description'));
  const serverIds = serverDescriptions.map((description) => description.id);
  const serverRegion = container.querySelector('.laboratory-circular');
  const serverViewport = container.querySelector('.laboratory-circular__viewport');
  const serverViewportId = serverViewport?.id;
  let root: Root | undefined;

  try {
    expect(serverCards).toHaveLength(count);
    expect(serverImages).toHaveLength(count);
    expect(serverFrost).toHaveLength(count);
    if (count) {
      expect(serverRegion).toHaveAttribute('data-orientation', 'vertical');
      expect(serverCards[0]).toHaveAttribute('data-active', 'true');
      expect(serverCards.slice(1).every((card) => card.getAttribute('data-active') === 'false')).toBe(true);
    }

    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    for (const [selector, serverNodes] of [
      ['[data-circular-card]', serverCards],
      ['img', serverImages],
      ['.laboratory-circular-card__frost', serverFrost],
    ] as const) {
      const clientNodes = Array.from(container.querySelectorAll(selector));
      expect(clientNodes).toHaveLength(serverNodes.length);
      for (const [index, node] of clientNodes.entries()) expect(node).toBe(serverNodes[index]);
    }
    expect(Array.from(container.querySelectorAll('.laboratory-circular-card__description')).map((description) => description.id)).toEqual(serverIds);

    for (const [index, frost] of serverFrost.entries()) {
      expect(frost).toHaveAttribute('aria-hidden', 'true');
      expect(frost).toBeEmptyDOMElement();
      expect(serverImages[index].nextElementSibling).toBe(frost);
      expect(serverCards[index].querySelector('button')).toHaveAttribute('aria-describedby', serverIds[index]);
    }
    if (count) {
      const firstClientCommit = initialCommit.snapshot;
      expect(firstClientCommit).toBeDefined();
      if (!firstClientCommit) throw new Error('The carousel did not read media preferences after hydration.');
      expect(firstClientCommit.html).toBe(parsedServerHTML);
      expect(firstClientCommit.nodes).toHaveLength(serverNodes.length);
      for (const [index, node] of firstClientCommit.nodes.entries()) expect(node).toBe(serverNodes[index]);
      // Viewport measurement is allowed after hydration. It updates
      // state and styles while preserving the server cards and layers.
      expect(container.querySelector('.laboratory-circular')).toBe(serverRegion);
      expect(serverRegion).toHaveAttribute('data-orientation', width >= 768 ? 'horizontal' : 'vertical');
      expect(serverRegion).toHaveAttribute('data-reduced-motion', String(reducedMotion));
      expect(container.querySelector('.laboratory-circular__viewport')).toBe(serverViewport);
      expect(serverViewport).toHaveAttribute('id', serverViewportId);
      expect(serverCards[0]).toHaveAttribute('data-active', 'true');
    } else {
      expect(container.querySelector('button')).toBeNull();
      expect(matchMedia).not.toHaveBeenCalled();
      expect(initialCommit.snapshot).toBeUndefined();
    }
    await onHydrated?.(container);
    expect(recoverableErrors).toEqual([]);
    expect(consoleError.mock.calls).toEqual([]);
  } finally {
    if (root) await act(async () => root?.unmount());
    container.remove();
    for (const media of matchMedia.mock.results) {
      if (media.type !== 'return') continue;
      expect(media.value.removeEventListener.mock.calls).toEqual(media.value.addEventListener.mock.calls);
    }
    consoleError.mockRestore();
  }
}

describe('Circular Carousel hydration with the real image and navigation hook', () => {
  for (const width of [390, 1440]) {
    for (const reducedMotion of [false, true]) {
      for (const count of [0, 1, 2, 3]) {
        it(`reuses the server DOM at ${width}px, reduced motion ${reducedMotion}, ${count} studies`, async () => {
          await expectHydratedCarousel(width, reducedMotion, count);
        });
      }

      it(`hydrates, unmounts and remounts in StrictMode at ${width}px, reduced motion ${reducedMotion}`, async () => {
        await expectHydratedCarousel(width, reducedMotion, 3, true);
        await expectHydratedCarousel(width, reducedMotion, 3, true);
      });
    }
  }

  it('wraps forward and backward through two hydrated studies without replacing their frost layers or IDs', async () => {
    for (const width of [390, 1440]) {
      await expectHydratedCarousel(width, true, 2, false, async (container) => {
        const cards = Array.from(container.querySelectorAll('[data-circular-card]'));
        const frost = cards.map((card) => card.querySelector('.laboratory-circular-card__frost'));
        const images = cards.map((card) => card.querySelector('img'));
        const descriptionIds = cards.map((card) => card.querySelector('.laboratory-circular-card__description')?.id);

        function expectSelection(index: number) {
          expect(container.querySelectorAll('[data-circular-card]')).toHaveLength(2);
          expect(container.querySelectorAll('.laboratory-circular-card__frost')).toHaveLength(2);
          expect(container.querySelectorAll('[data-circular-card][data-active="true"]')).toHaveLength(1);
          expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
          expect(cards[index]).toHaveAttribute('data-active', 'true');
          expect(container.querySelector('.laboratory-circular__count')).toHaveTextContent(`0${index + 1} / 02`);
          for (const [cardIndex, card] of cards.entries()) {
            expect(container.querySelectorAll('[data-circular-card]')[cardIndex]).toBe(card);
            expect(card.querySelector('.laboratory-circular-card__frost')).toBe(frost[cardIndex]);
            expect(card.querySelector('img')).toBe(images[cardIndex]);
            expect(card.querySelector('.laboratory-circular-card__description')).toHaveAttribute('id', descriptionIds[cardIndex]);
            expect(card.querySelector('button')).toHaveAttribute('aria-describedby', descriptionIds[cardIndex]);
            expect(card.querySelector('button')).toHaveAttribute('tabindex', cardIndex === index ? '0' : '-1');
          }
        }

        expectSelection(0);
        for (const [name, index] of [
          ['Laboratorio siguiente', 1],
          ['Laboratorio siguiente', 0],
          ['Laboratorio anterior', 1],
          ['Laboratorio anterior', 0],
          ['Laboratorio anterior', 1],
          ['Laboratorio siguiente', 0],
        ] as const) {
          await act(async () => within(container).getByRole('button', { name }).click());
          expectSelection(index);
        }
      });
    }
  });
});

describe('Circular Card hydration with a permanently mounted frost layer', () => {
  for (const active of [false, true]) {
    for (const blocked of [false, true]) {
      it(`preserves its server DOM when active is ${active} and blocked is ${blocked}`, async () => {
        const matchMedia = installViewport(1440, false);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const recoverableErrors: unknown[] = [];
        const element = (
          <LaboratoryCircularCard
            laboratory={demoLaboratories[0]}
            index={0}
            total={1}
            active={active}
            blocked={blocked}
            onSelect={vi.fn()}
          />
        );
        const serverHTML = renderWithoutBrowserGlobals(element);
        expect(renderToString(element)).toBe(serverHTML);
        const container = document.createElement('div');
        container.innerHTML = serverHTML;
        document.body.appendChild(container);
        const parsedServerHTML = container.innerHTML;
        const serverCard = container.querySelector('[data-circular-card]');
        const serverButton = container.querySelector('button');
        const serverImage = container.querySelector('img');
        const serverFrost = container.querySelector('.laboratory-circular-card__frost');
        const serverDescription = container.querySelector('.laboratory-circular-card__description');
        let root: Root | undefined;

        try {
          expect(serverFrost).toHaveAttribute('aria-hidden', 'true');
          expect(serverFrost).toBeEmptyDOMElement();
          await act(async () => {
            root = hydrateRoot(container, element, {
              onRecoverableError: (error) => recoverableErrors.push(error),
            });
          });

          expect(container.innerHTML).toBe(parsedServerHTML);
          expect(container.querySelector('[data-circular-card]')).toBe(serverCard);
          expect(container.querySelector('button')).toBe(serverButton);
          expect(container.querySelector('img')).toBe(serverImage);
          expect(container.querySelector('.laboratory-circular-card__frost')).toBe(serverFrost);
          expect(container.querySelector('.laboratory-circular-card__description')).toBe(serverDescription);
          expect(container.querySelectorAll('.laboratory-circular-card__frost')).toHaveLength(1);
          expect(serverImage?.nextElementSibling).toBe(serverFrost);
          expect(serverCard).toHaveAttribute('data-active', String(active));
          expect(serverButton).toHaveAttribute('tabindex', active ? '0' : '-1');
          expect(serverButton).toHaveAttribute('aria-describedby', serverDescription?.id);
          if (active) expect(serverButton).toHaveAttribute('aria-current', 'true');
          else expect(serverButton).not.toHaveAttribute('aria-current');
          if (blocked) expect(serverButton).toHaveAttribute('aria-disabled', 'true');
          else expect(serverButton).not.toHaveAttribute('aria-disabled');
          expect(matchMedia).not.toHaveBeenCalled();
          expect(recoverableErrors).toEqual([]);
          expect(consoleError.mock.calls).toEqual([]);
        } finally {
          if (root) await act(async () => root?.unmount());
          container.remove();
        }
      });
    }
  }
});

describe('Hydration diagnostic control for simulated out-of-sync versions', () => {
  it('detects server markup containing frost when a simulated legacy client omits it', async () => {
    installViewport(390, false);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverableErrors: unknown[] = [];
    // This fixture deliberately simulates two versions; it is not evidence
    // that this version mismatch occurred in the reported environment.
    function VersionedMedia({ includeFrost }: { includeFrost: boolean }) {
      const image = demoLaboratories[0].coverImage;
      return (
        <div className="laboratory-circular-card__media" data-lab-media>
          <Image {...image} alt={image.alt} />
          {includeFrost && <span className="laboratory-circular-card__frost" aria-hidden="true" />}
        </div>
      );
    }
    const container = document.createElement('div');
    container.innerHTML = renderWithoutBrowserGlobals(<VersionedMedia includeFrost />);
    document.body.appendChild(container);
    const serverMedia = container.querySelector('[data-lab-media]');
    const serverImage = container.querySelector('img');
    const serverFrost = container.querySelector('.laboratory-circular-card__frost');
    let root: Root | undefined;

    try {
      expect(serverFrost).toHaveAttribute('aria-hidden', 'true');
      await act(async () => {
        root = hydrateRoot(container, <VersionedMedia includeFrost={false} />, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });

      expect(recoverableErrors).toHaveLength(1);
      const error = recoverableErrors[0];
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Hydration failed/);
      expect((error as Error).message).toMatch(/-\s+<span className="laboratory-circular-card__frost" aria-hidden="true">/);
      expect(container.querySelector('[data-lab-media]')).not.toBe(serverMedia);
      expect(container.querySelector('img')).not.toBe(serverImage);
      expect(container.querySelector('.laboratory-circular-card__frost')).toBeNull();
      expect(serverFrost?.isConnected).toBe(false);
      expect(consoleError.mock.calls).toEqual([]);
    } finally {
      if (root) await act(async () => root?.unmount());
      container.remove();
    }
  });
});
