import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HomeLanding } from '@/features/home/components/home-landing';
import { aboutConcepts, aboutCopy } from '../data/about-content';

vi.mock('../hooks/use-about-scroll', () => ({ useAboutScroll: vi.fn() }));
vi.mock('../hooks/use-ecosystem-motion', () => ({ useEcosystemMotion: vi.fn() }));
vi.mock('@/features/contact/hooks/use-contact-motion', () => ({ useContactMotion: vi.fn() }));
vi.mock('@/features/home/components/home-navigation', () => ({ HomeNavigation: () => <nav aria-label="Menú de prueba" /> }));
vi.mock('@/features/home/components/home-identity', () => ({ HomeIdentity: () => <h1>CÉLULA</h1> }));
vi.mock('@/features/home/components/home-atmosphere', () => ({ HomeAtmosphere: () => <div data-testid="atmosphere" /> }));
vi.mock('@/features/exhibitions', () => ({ ExhibitionSlider: () => <div data-testid="exhibition-slider" /> }));
vi.mock('@/features/laboratory', () => ({ LaboratorySection: () => <section id="laboratorios">Laboratorios de prueba</section> }));

describe('About integration in Home', () => {
  it('preserves unique destinations and the order of About, Exhibition, Laboratory and Contact', () => {
    const { container } = render(<HomeLanding />);
    const destinations = ['inicio', 'laboratorio', 'exposiciones', 'laboratorios', 'contacto', 'nosotros'];
    for (const id of destinations) expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll('[id]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    const main = screen.getByRole('main');
    const about = container.querySelector<HTMLElement>('#laboratorio')!;
    expect(about).toHaveAccessibleName(aboutCopy.question);
    expect(within(about).getByRole('heading', { name: aboutCopy.question, level: 2 })).toBeInTheDocument();
    const featureIds = Array.from(main.children, (element) => element.id).filter(Boolean);
    expect(featureIds).toEqual(['laboratorio', 'exposiciones', 'laboratorios', 'contacto']);
    expect(within(container.querySelector<HTMLElement>('#exposiciones')!).getByTestId('exhibition-slider')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DESLIZA PARA DESCUBRIR/ })).toHaveAttribute('href', '#laboratorio');
    expect(screen.getByRole('link', { name: aboutCopy.exhibitionLinkLabel })).toHaveAttribute('href', '#exposiciones');
    expect(screen.getByRole('link', { name: /VER MÁS/ })).toHaveAttribute('href', '/exposiciones');
    expect(screen.getByTestId('atmosphere')).toBeInTheDocument();
  });

  it('includes About editorial and native controls in the first server rendered markup', () => {
    const markup = renderToString(<HomeLanding />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    const about = document.querySelector('#laboratorio')!;
    expect(about).not.toBeNull();
    for (const copy of [aboutCopy.question, aboutCopy.declaration, aboutCopy.introduction, aboutCopy.finale, aboutCopy.pendingNotice]) {
      expect(about.textContent).toContain(copy);
    }
    const controls = Array.from(about.querySelectorAll<HTMLButtonElement>('button'));
    expect(controls).toHaveLength(aboutConcepts.length);
    for (const control of controls) {
      expect(control.type).toBe('button');
      expect(control.getAttribute('aria-controls')).toBeTruthy();
      expect(document.getElementById(control.getAttribute('aria-controls')!)).not.toBeNull();
    }
    expect(controls.filter((control) => control.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(about.textContent).toContain(aboutConcepts[0].description);
    expect(about.querySelector('a[href="#exposiciones"]')?.textContent).toContain(aboutCopy.exhibitionLinkLabel);
    expect(about.querySelector('[style*="clip-path"], [style*="opacity:0"], [hidden]')).toBeNull();
  });
});
