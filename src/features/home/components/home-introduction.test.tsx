import { act, render, screen, within } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeLanding } from './home-landing';
import { aboutCopy } from '@/features/about/data/about-content';

vi.mock('@/features/about/hooks/use-about-scroll', () => ({ useAboutScroll: vi.fn() }));
vi.mock('@/features/home/components/home-navigation', () => ({ HomeNavigation: () => <nav aria-label="Navegación de prueba" /> }));
vi.mock('./home-identity', () => ({ HomeIdentity: () => <div data-testid="home-identity" /> }));
vi.mock('./home-atmosphere', () => ({ HomeAtmosphere: () => <div data-testid="home-atmosphere" /> }));
vi.mock('@/shared/ui/continuous-background/continuous-background', () => ({
  ContinuousBackground: () => <div data-testid="continuous-background" aria-hidden="true" />,
}));
vi.mock('@/features/exhibitions', () => ({ ExhibitionCardSwap: () => <div data-testid="exhibition-card-swap" /> }));
vi.mock('@/features/laboratory', () => ({ LaboratorySection: () => <section id="laboratorio">Laboratorio</section> }));

let hydratedRoot: Root | undefined;

afterEach(() => {
  if (hydratedRoot) {
    act(() => hydratedRoot?.unmount());
    hydratedRoot = undefined;
  }
});

describe('Home introduction', () => {
  it('places the existing introduction over the shared background after the cover', () => {
    render(<HomeLanding />);
    const main = screen.getByRole('main');
    const sections = Array.from(main.querySelectorAll<HTMLElement>(':scope > *'));
    const heroIndex = sections.findIndex((section) => section.matches('.home-hero'));
    const aboutIndex = sections.findIndex((section) => section.id === 'que-es-celula');
    const exhibitionIndex = sections.findIndex((section) => section.id === 'exposiciones');
    const introduction = sections[aboutIndex]!;

    expect(screen.getByTestId('continuous-background')).toBeInTheDocument();
    expect(heroIndex).toBeLessThan(aboutIndex);
    expect(aboutIndex).toBeLessThan(exhibitionIndex);
    expect(within(introduction).getByText(aboutCopy.introduction)).toBeVisible();
    expect(introduction.querySelector('[data-chromatic-intro]')).toBeInTheDocument();
  });

  it('includes the introduction in server markup and hydrates without recoverable errors', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<HomeLanding />);
    document.body.append(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydratedRoot = hydrateRoot(container, <HomeLanding />, { onRecoverableError });
    });

    expect(container.querySelector('[data-introduction-copy]')?.textContent).toBe(aboutCopy.introduction);
    expect(onRecoverableError).not.toHaveBeenCalled();
    container.remove();
  });
});
