import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HomeLanding } from '@/features/home/components/home-landing';
import { contactCopy, contactPanels } from '../data/contact-content';

vi.mock('../hooks/use-contact-motion', () => ({ useContactMotion: vi.fn() }));
vi.mock('@/features/about', () => ({ AboutSection: () => <section id="laboratorio">Sobre Célula</section> }));
vi.mock('@/features/home/components/home-navigation', async () => {
  const { HomeNavigationContent } = await import('@/features/home/components/home-navigation-content');
  return { HomeNavigation: () => <HomeNavigationContent onNavigate={vi.fn()} /> };
});
vi.mock('@/features/home/components/home-identity', () => ({ HomeIdentity: () => <h1>CÉLULA</h1> }));
vi.mock('@/features/home/components/home-atmosphere', () => ({ HomeAtmosphere: () => <div data-testid="atmosphere" /> }));
vi.mock('@/features/exhibitions', () => ({ ExhibitionSlider: () => <div data-testid="exhibition-slider" /> }));
vi.mock('@/features/laboratory', () => ({ LaboratorySection: () => <section id="laboratorios">Laboratorios</section> }));

describe('Contact integration in Home', () => {
  it('places one Contact section after Laboratory and before the landing footer', () => {
    const { container } = render(<HomeLanding />);
    for (const id of ['inicio', 'laboratorio', 'exposiciones', 'laboratorios', 'contacto', 'nosotros']) {
      expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
    }
    const ids = Array.from(container.querySelectorAll('[id]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    const main = screen.getByRole('main');
    const children = Array.from(main.children);
    expect(children.map((element) => element.id).filter(Boolean)).toEqual([
      'laboratorio', 'exposiciones', 'laboratorios', 'contacto',
    ]);
    const contact = screen.getByRole('region', { name: contactCopy.introTitle });
    expect(contact.tagName).toBe('SECTION');
    expect(children.at(-2)).toBe(contact);
    const footer = children.at(-1)!;
    expect(footer.tagName).toBe('FOOTER');
    expect(footer).not.toHaveAttribute('id', 'contacto');
    expect(within(footer as HTMLElement).getByRole('link', { name: /ACTIVAR UNA CONEXIÓN/ })).toHaveAttribute('href', '#contacto');
    expect(within(contact).getByRole('link', { name: contactCopy.backToTop })).toHaveAttribute('href', '#inicio');
    expect(within(contact).getByRole('tablist', { name: contactCopy.navigationLabel })).toBeInTheDocument();
    expect(screen.getByTestId('exhibition-slider')).toBeInTheDocument();
    expect(screen.getByTestId('atmosphere')).toBeInTheDocument();
  }, 15_000);

  it('keeps the production navigation destination connected to the real Contact section', () => {
    render(<HomeLanding />);
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    const link = within(navigation).getByRole('link', { name: 'CONTACTO' });
    expect(link).toHaveAttribute('href', '#contacto');
    const destination = document.getElementById(link.getAttribute('href')!.slice(1));
    expect(destination).toBe(screen.getByRole('region', { name: contactCopy.introTitle }));
  }, 15_000);

  it('server renders the editorial experience in the landing with one readable initial panel', () => {
    const markup = renderToString(<HomeLanding />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    const contact = document.getElementById('contacto')!;
    expect(document.querySelectorAll('#contacto')).toHaveLength(1);
    expect(contact.textContent).toContain(contactCopy.introTitle);
    expect(contact.textContent).toContain(contactCopy.narrative);
    const active = contact.querySelector('[role="tabpanel"][aria-hidden="false"]')!;
    expect(active.textContent).toContain(contactPanels[0].description);
    expect(active.closest('[inert], [hidden], [aria-hidden="true"]')).toBeNull();
    expect(contact.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(contact.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1);
    expect(contact.querySelector('a[href^="mailto:"], a[href^="https:"]')).toBeNull();
    expect(contact.nextElementSibling?.tagName).toBe('FOOTER');
  }, 15_000);
});
