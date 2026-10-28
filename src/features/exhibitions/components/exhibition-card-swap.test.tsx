import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoArtworks } from '../data/demo-artworks';
import { ExhibitionCardSwap } from './exhibition-card-swap';

function installBrowser() {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
}

beforeEach(installBrowser);
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const cards = () => [...document.querySelectorAll<HTMLElement>('.exhibition-artwork-card')];
const active = () => cards().find(card => card.dataset.active === 'true');

describe('ExhibitionCardSwap integration with the real React Bits engine', () => {
  it('keeps each existing artwork image associated with its own complete editorial content', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    expect(cards()).toHaveLength(demoArtworks.length);
    for (const [index, artwork] of demoArtworks.entries()) {
      const card = cards()[index];
      const image = within(card).getByAltText(artwork.alt);
      expect(image).toHaveAttribute('src', artwork.src);
      expect(within(card).getByRole('heading', { hidden: true })).toHaveTextContent(artwork.title);
      expect(within(card).getByText(artwork.technique)).toBeInTheDocument();
      expect(within(card).getByText(artwork.description)).toBeInTheDocument();
      expect(card.querySelector('.exhibition-artwork-card__frost')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
    expect(cards().filter(card => card.dataset.active === 'true')).toHaveLength(1);
    for (const card of cards().slice(1)) {
      expect(card.closest('[data-swap-index]')).toHaveAttribute('aria-hidden', 'true');
      expect(card.closest('[data-swap-index]')?.firstElementChild).toHaveAttribute('inert');
    }
  });

  it('uses the official landscape geometry and four visible layers without duplicating artworks', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    const deck = document.querySelector<HTMLElement>('.exhibition-card-swap__deck')!;
    const slots = [...deck.querySelectorAll<HTMLElement>('[data-swap-index]')];
    expect(deck.style.getPropertyValue('--swap-w')).toBe('460px');
    expect(deck.style.getPropertyValue('--swap-h')).toBe('340px');
    expect(slots[1].style.transform).toContain('translate3d(60.00px, -70.00px, -90.00px)');
    expect(slots[3].style.transform).toContain('translate3d(180.00px, -210.00px, -270.00px)');
    expect(slots[0].style.transform).toContain('skewY(6deg)');
    expect(slots.filter(slot => slot.style.visibility !== 'hidden')).toHaveLength(4);
    expect(slots).toHaveLength(demoArtworks.length);
  });

  it('uses only available artworks when fewer than four are supplied', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks.slice(0, 2)} />);
    const slots = [...document.querySelectorAll<HTMLElement>('[data-swap-index]')];
    expect(cards()).toHaveLength(2);
    expect(slots).toHaveLength(2);
    expect(slots.every(slot => slot.style.visibility !== 'hidden')).toBe(true);
  });

  it('reveals the front card on click and brings a clicked rear card forward without opening its information', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    fireEvent.click(active()!);
    expect(active()).toHaveAttribute('data-details', 'true');
    fireEvent.click(active()!);
    expect(active()).toHaveAttribute('data-details', 'true');
    const posterior = cards()[2].closest('[data-swap-index]')!;
    fireEvent.click(posterior);
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[2].id);
    expect(active()).toHaveAttribute('data-details', 'false');
    expect(cards().filter(card => card.dataset.active === 'true')).toHaveLength(1);
  });

  it('does not open information after dragging the front artwork', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    const deck = document.querySelector<HTMLElement>('.exhibition-card-swap__deck')!;
    const first = active()!;
    for (const [type, x, target] of [
      ['pointerdown', 100, first], ['pointermove', 300, deck], ['pointerup', 300, deck],
    ] as const) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 100, button: 0 });
      Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'touch' }, isPrimary: { value: true } });
      fireEvent(target, event);
    }
    fireEvent.click(first);
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[1].id);
    expect(cards().every(card => card.dataset.details === 'false')).toBe(true);
  });

  it('exposes information by a touch-compatible semantic control and closes it on navigation', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    const button = screen.getByRole('button', { name: 'Mostrar información de la obra' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const detail = document.getElementById(button.getAttribute('aria-controls')!);
    expect(detail).toBeInTheDocument();
    expect(detail).toHaveTextContent(demoArtworks[0].description);
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Ocultar información de la obra' })).toHaveAttribute('aria-expanded', 'true');
    expect(active()).toHaveAttribute('data-details', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Obra siguiente' }));
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[1].id);
    expect(active()).toHaveAttribute('data-details', 'false');
    expect(screen.getByRole('button', { name: 'Mostrar información de la obra' })).toHaveAttribute('aria-controls',
      active()?.querySelector('.exhibition-artwork-card__detail')?.id);
  });

  it('navigates in both directions, wraps at both ends and keeps the indicator synchronized', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Obra anterior' }));
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks.at(-1)!.id);
    expect(screen.getByText(`Obra 5 de 5: ${demoArtworks[4].title}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Obra siguiente' }));
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
    for (let i = 0; i < demoArtworks.length; i++) fireEvent.click(screen.getByRole('button', { name: 'Obra siguiente' }));
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
    expect(screen.getByText(`Obra 1 de 5: ${demoArtworks[0].title}`)).toBeInTheDocument();
  });

  it('supports keyboard navigation while retaining focus on the deck and the new front card', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks} />);
    const deck = document.querySelector<HTMLElement>('.exhibition-card-swap__deck')!;
    act(() => deck.focus());
    fireEvent.keyDown(deck, { key: 'ArrowRight' });
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[1].id);
    expect(document.activeElement).toBe(deck);
    expect(active()?.closest('[data-swap-index]')).not.toHaveAttribute('inert');
    fireEvent.keyDown(deck, { key: 'ArrowLeft' });
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
  });

  it('preserves the artwork after hover, tab return and resize without enabling autoplay', () => {
    vi.useFakeTimers();
    try {
      render(<StrictMode><ExhibitionCardSwap artworks={demoArtworks} /></StrictMode>);
      const card = active();
      const deck = document.querySelector<HTMLElement>('.exhibition-card-swap__deck')!;
      for (const interact of [
        () => {},
        () => { fireEvent.mouseEnter(card!); fireEvent.mouseLeave(card!); fireEvent(document, new Event('visibilitychange')); },
        () => { fireEvent.resize(window); fireEvent.pointerLeave(deck); },
      ]) {
        interact();
        act(() => vi.advanceTimersByTime(15_000));
        expect(active()).toBe(card);
        expect(card).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
      }
      expect(screen.queryByRole('button', { name: /paus|reproduc|play/i })).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });

  it('renders an empty selection without falling back to React Bits example items', () => {
    render(<ExhibitionCardSwap artworks={[]} />);
    expect(cards()).toHaveLength(0);
    expect(screen.getByText('La selección estará disponible próximamente.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Obra siguiente' })).not.toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('keeps a single artwork available with information and disabled navigation', () => {
    render(<ExhibitionCardSwap artworks={demoArtworks.slice(0, 1)} />);
    expect(cards()).toHaveLength(1);
    expect(active()).toHaveAttribute('data-artwork-id', demoArtworks[0].id);
    expect(screen.getByRole('button', { name: 'Obra anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Obra siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar información de la obra' }));
    expect(active()).toHaveAttribute('data-details', 'true');
  });
});
