import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { demoArtworks } from '../data/demo-artworks';
import { exhibitionCopy } from '../data/exhibition-copy';
import { getExhibitionPageMetadata } from '../data/exhibition-page-metadata';
import { ExhibitionPage } from './exhibition-page';

function serverPage(preview?: boolean) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<ExhibitionPage preview={preview} />);
  return container;
}

describe('Exhibition page composition', () => {
  it('keeps the current gallery as the default without rendering the prototype', () => {
    const page = serverPage();

    expect(page.querySelector('.exhibition-slider')).not.toBeNull();
    expect(page.querySelector('.exhibition-card-swap')).toBeNull();
    expect(page.querySelector('.exhibition-card-swap-preview')).toBeNull();
    expect(page.querySelector('[aria-current="page"]')).toHaveTextContent('Exposiciones');
    expect(page.querySelector('h1')).toHaveTextContent(exhibitionCopy.title);
    expect(page.querySelector('.exhibition-footer')).toHaveTextContent(exhibitionCopy.demoNotice);

    const slides = page.querySelectorAll('.exhibition-slider__slide');
    expect(slides).toHaveLength(demoArtworks.length);
    demoArtworks.forEach((artwork, index) => {
      expect(slides[index].querySelector('img')).toHaveAttribute('src', artwork.src);
      expect(slides[index].querySelector('img')).toHaveAttribute('alt', artwork.alt);
      expect(slides[index]).toHaveTextContent(artwork.title);
      expect(slides[index]).toHaveTextContent(artwork.description);
    });
  });

  it('renders the manual CardSwap preview with the existing works and a link back', () => {
    const page = serverPage(true);

    expect(page.querySelector('.exhibition-card-swap')).not.toBeNull();
    expect(page.querySelector('.exhibition-slider')).toBeNull();
    expect(page.querySelector('.exhibition-card-swap-preview a')).toHaveAttribute('href', '/exposiciones');
    expect(page.querySelector('h1')).toHaveTextContent(exhibitionCopy.title);
    expect(page.querySelector('.exhibition-footer')).toHaveTextContent(exhibitionCopy.demoNotice);

    const cards = page.querySelectorAll('.exhibition-artwork-card');
    expect(cards).toHaveLength(demoArtworks.length);
    demoArtworks.forEach((artwork, index) => {
      expect(cards[index]).toHaveAttribute('data-artwork-id', artwork.id);
      expect(cards[index].querySelector('img')).toHaveAttribute('src', artwork.src);
      expect(cards[index].querySelector('img')).toHaveAttribute('alt', artwork.alt);
      expect(cards[index]).toHaveTextContent(artwork.title);
      expect(cards[index]).toHaveTextContent(artwork.technique);
      expect(cards[index]).toHaveTextContent(artwork.description);
    });
  });

  it('excludes only the prototype from indexing', () => {
    expect(getExhibitionPageMetadata(false)).toEqual({
      title: 'Exposiciones — CÈL·LULA',
      description: exhibitionCopy.description,
    });
    expect(getExhibitionPageMetadata(true)).toEqual({
      title: 'Exposiciones · CardSwap — CÈL·LULA',
      description: exhibitionCopy.description,
      robots: { index: false, follow: false },
    });
  });
});
