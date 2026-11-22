import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { demoArtworks } from '@/features/exhibitions/data/demo-artworks';
import { exhibitionCopy } from '@/features/exhibitions/data/exhibition-copy';
import { HomeLanding } from './home-landing';

vi.mock('@/features/about', () => ({ AboutSection: () => <section id="que-es-celula" /> }));
vi.mock('@/features/contact', () => ({ ContactSection: () => <section id="contacto" /> }));
vi.mock('@/features/laboratory', () => ({ LaboratorySection: () => <section id="laboratorio" /> }));
vi.mock('./home-navigation', () => ({ HomeNavigation: () => <nav /> }));
vi.mock('./home-identity', () => ({ HomeIdentity: () => <h1>CÈL·LULA</h1> }));
vi.mock('./home-atmosphere', () => ({ HomeAtmosphere: () => <div /> }));

describe('Exhibition CardSwap in Home', () => {
  it('server renders the real artwork deck beneath the Home section heading with connected controls', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<HomeLanding />);
    const section = container.querySelector('#exposiciones')!;
    expect(section.querySelector('#home-featured-title')?.tagName).toBe('H2');
    expect(section.querySelector('#home-featured-title')?.textContent).toBe(exhibitionCopy.title);
    expect(section.querySelector('.exhibition-slider')).toBeNull();

    const deck = section.querySelector('.exhibition-card-swap')!;
    const cards = [...deck.querySelectorAll<HTMLElement>('.exhibition-artwork-card')];
    expect(cards.map((card) => card.dataset.artworkId)).toEqual(demoArtworks.map((artwork) => artwork.id));
    expect(deck).toHaveAttribute('data-active-id', demoArtworks[0].id);
    expect(cards.filter((card) => card.dataset.active === 'true')).toEqual([cards[0]]);
    for (const [index, card] of cards.entries()) {
      const title = card.querySelector('.exhibition-artwork-card__title')!;
      expect(title.tagName).toBe('H3');
      expect(title.textContent).toBe(demoArtworks[index].title);
      expect(card.querySelector('img')).toHaveAttribute('alt', demoArtworks[index].alt);
    }

    const controls = [...deck.querySelectorAll('button')];
    expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
      'Mostrar información de la obra', 'Obra anterior', 'Obra siguiente',
    ]);
    for (const control of controls) {
      expect(container.querySelector(`[id="${control.getAttribute('aria-controls')}"]`)).not.toBeNull();
    }
    expect(section.querySelector('a[href="/exposiciones"]')).toBeNull();
  });
});
