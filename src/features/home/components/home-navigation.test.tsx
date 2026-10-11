import type { ImgHTMLAttributes } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeNavigation } from './home-navigation';

type Phase = 'closed' | 'opening' | 'open' | 'closing';

const motion = vi.hoisted(() => ({
  setOpen: vi.fn<(open: boolean) => void>(),
  onPhaseChange: undefined as ((phase: Phase) => void) | undefined,
}));

vi.mock('./use-home-navigation-motion', () => ({
  useHomeNavigationMotion: ({ onPhaseChange }: { onPhaseChange: (phase: Phase) => void }) => {
    motion.onPhaseChange = onPhaseChange;
    return { setOpen: motion.setOpen };
  },
}));

vi.mock('next/image', () => ({
  default: ({ alt, src, width, height, className }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} width={width} height={height} className={className} />
  ),
}));

function finishMotion(phase: Phase) {
  act(() => motion.onPhaseChange?.(phase));
}

function renderHome() {
  return render(
    <>
      <HomeNavigation />
      <div className="home-identity" aria-hidden="true" />
      <main id="inicio">
        <button type="button">Acción de la home</button>
        <section id="laboratorio">Sobre Célula</section>
        <section id="exposiciones">Obras destacadas</section>
        <footer id="contacto">Contacto</footer>
      </main>
    </>,
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
  finishMotion('open');
}

let previousScrollIntoView: PropertyDescriptor | undefined;
const scrollIntoView = vi.fn();
let reducedMotion = false;

beforeEach(() => {
  motion.setOpen.mockReset();
  motion.onPhaseChange = undefined;
  motion.setOpen.mockImplementation((open) => motion.onPhaseChange?.(open ? 'opening' : 'closing'));
  scrollIntoView.mockReset();
  previousScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  reducedMotion = false;
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: reducedMotion,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';
  if (previousScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', previousScrollIntoView);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

describe('HomeNavigation', () => {
  it('keeps the closed menu hidden and exposes the existing destinations when opened', () => {
    const { container } = renderHome();
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    const panel = container.querySelector('#home-navigation-panel');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'home-navigation-panel');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');
    expect(screen.queryByRole('link', { name: 'HOME' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName('Cerrar menú');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('inert');

    finishMotion('open');
    const dialog = screen.getByRole('dialog', { name: 'Navegación de Célula' });
    const navigation = within(dialog).getByRole('navigation', { name: 'Navegación principal' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).not.toHaveAttribute('inert');
    expect(within(navigation).getAllByRole('link')).toHaveLength(4);
    for (const [label, href] of [
      ['HOME', '#inicio'],
      ['QUÉ ES CÉLULA', '#laboratorio'],
      ['EXPOSICIONES', '#exposiciones'],
      ['CONTACTO', '#contacto'],
    ]) {
      expect(within(navigation).getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    expect(within(navigation).getByText('LAB').closest('[aria-disabled="true"]')).not.toBeNull();
    expect(within(navigation).getByText('QUÉ HACEMOS').closest('[aria-disabled="true"]')).not.toBeNull();
    expect(within(navigation).getAllByText('PRÓXIMAMENTE')).toHaveLength(2);
  });

  it('moves focus into the links only when the opening animation has finished', () => {
    renderHome();
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    toggle.focus();

    fireEvent.click(toggle);
    expect(toggle).toHaveFocus();

    finishMotion('open');
    expect(screen.getByRole('link', { name: 'HOME' })).toHaveFocus();
  });

  it('keeps focus inside the open menu and excludes the page behind it', () => {
    const { container } = renderHome();
    openMenu();
    const toggle = screen.getByRole('button', { name: 'Cerrar menú' });
    const lastLink = screen.getByRole('link', { name: 'CONTACTO' });

    expect(container.querySelector('main')).toHaveAttribute('inert');
    expect(container.querySelector('.home-identity')).toHaveAttribute('inert');

    lastLink.focus();
    fireEvent.keyDown(lastLink, { key: 'Tab' });
    expect(toggle).toHaveFocus();
    fireEvent.keyDown(toggle, { key: 'Tab', shiftKey: true });
    expect(lastLink).toHaveFocus();

    container.querySelector<HTMLButtonElement>('main button')?.focus();
    expect(document.activeElement).not.toBe(container.querySelector('main button'));
  });

  it('closes with Escape but keeps scroll locked until the exit animation finishes', () => {
    document.body.style.overflow = 'clip';
    document.documentElement.style.overflow = 'auto';
    const { container } = renderHome();
    openMenu();

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });

    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    expect(container.querySelector('#home-navigation-panel')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('#home-navigation-panel')).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');

    finishMotion('closed');
    expect(document.body.style.overflow).toBe('clip');
    expect(document.documentElement.style.overflow).toBe('auto');
    expect(container.querySelector('main')).not.toHaveAttribute('inert');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('defers section navigation until the menu has closed and focuses the destination', () => {
    const { container } = renderHome();
    openMenu();
    fireEvent.click(screen.getByRole('link', { name: 'QUÉ ES CÉLULA' }));

    expect(window.location.hash).toBe('');
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('hidden');

    finishMotion('closed');
    const destination = container.querySelector('#laboratorio');
    expect(window.location.hash).toBe('#laboratorio');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(destination).toHaveFocus();
    expect(destination).toHaveAttribute('tabindex', '-1');
    expect(document.body.style.overflow).toBe('');

    screen.getByRole('button', { name: 'Abrir menú' }).focus();
    expect(destination).not.toHaveAttribute('tabindex');
  });

  it('preserves a destination’s existing tabindex and permits modified link clicks', () => {
    const { container } = renderHome();
    const destination = container.querySelector('#contacto');
    destination?.setAttribute('tabindex', '2');
    openMenu();
    const link = screen.getByRole('link', { name: 'CONTACTO' });

    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(motion.setOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(link);
    finishMotion('closed');
    expect(destination).toHaveFocus();
    screen.getByRole('button', { name: 'Abrir menú' }).focus();
    expect(destination).toHaveAttribute('tabindex', '2');
  });

  it('supports rapid reversals without releasing the page lock for a stale close callback', () => {
    const { container } = renderHome();
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });

    fireEvent.click(toggle);
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(motion.setOpen.mock.calls.map(([open]) => open)).toEqual([true, false, true]);
    finishMotion('closed');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    expect(container.querySelector('main')).toHaveAttribute('inert');

    finishMotion('open');
    expect(screen.getByRole('link', { name: 'HOME' })).toHaveFocus();
  });

  it('navigates without smooth scrolling when reduced motion is requested', () => {
    reducedMotion = true;
    renderHome();
    openMenu();

    fireEvent.click(screen.getByRole('link', { name: 'EXPOSICIONES' }));
    finishMotion('closed');

    expect(window.location.hash).toBe('#exposiciones');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    expect(document.getElementById('exposiciones')).toHaveFocus();
  });

  it('cancels deferred navigation if the closing menu is reopened', () => {
    renderHome();
    openMenu();
    fireEvent.click(screen.getByRole('link', { name: 'CONTACTO' }));

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    finishMotion('open');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    finishMotion('closed');

    expect(window.location.hash).toBe('');
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();
  });

  it('restores page styles and pre-existing inert states when unmounted during an animation', () => {
    document.body.style.cssText = 'overflow: clip; padding-right: 7px; overscroll-behavior: contain;';
    document.documentElement.style.cssText = 'overflow: auto; scroll-behavior: smooth;';
    const { container, unmount } = renderHome();
    const main = container.querySelector('main');
    const identity = container.querySelector('.home-identity');
    identity?.setAttribute('inert', '');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(main).toHaveAttribute('inert');
    unmount();

    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.paddingRight).toBe('7px');
    expect(document.body.style.overscrollBehavior).toBe('contain');
    expect(document.documentElement.style.overflow).toBe('auto');
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    expect(main).not.toHaveAttribute('inert');
    expect(identity).toHaveAttribute('inert');
  });
});
