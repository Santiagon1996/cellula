import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutMaterial, type AboutMaterialImage } from '@/features/about/components/about-material';

describe('About material assets', () => {
  it('does not render empty figures or visible placeholders for missing originals', () => {
    const { container } = render(<AboutMaterial images={[
      { id: 'body', src: null, alt: '' },
      { id: 'matter', src: null, alt: '' },
      { id: 'process', src: null, alt: '' },
    ]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the provided assets with their original alternative text and captions', () => {
    const images: readonly AboutMaterialImage[] = [
      { id: 'missing', src: null, alt: '' },
      { id: 'supplied', src: '/exhibitions/membrana-rosa.svg', alt: 'Obra original usada como fixture.', caption: 'Detalle de la obra.' },
      { id: 'uncaptioned', src: '/exhibitions/corriente-de-cielo.svg', alt: 'Segunda obra del fixture.' },
    ];
    const { container } = render(<AboutMaterial images={images} />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByAltText(images[1].alt)).toHaveAttribute('src', images[1].src);
    expect(screen.getByAltText(images[2].alt)).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText(images[1].caption!)).toBeInTheDocument();
    expect(container.querySelectorAll('figure')).toHaveLength(2);
    expect(container.querySelectorAll('figcaption')).toHaveLength(1);
    expect(container.querySelector('[data-about-material-image="missing"]')).not.toBeInTheDocument();
  });
});
