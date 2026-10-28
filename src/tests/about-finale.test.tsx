import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AboutFinale } from '@/features/about/components/about-finale';
import { aboutCopy, aboutMaterial } from '@/features/about/data/about-content';

describe('About material finale', () => {
  it('preserves a single accessible closing statement and continuous scroll destination', () => {
    const { container } = render(<AboutFinale />);
    const statement = screen.getByRole('heading', { name: aboutCopy.finale });
    expect(screen.getByRole('region', { name: aboutCopy.finale })).toHaveAttribute('data-about-act', 'transform');
    expect(statement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(aboutCopy.finaleLines.length);
    expect(screen.getByText(aboutCopy.finaleSupport)).toHaveAttribute('data-editorial-status', 'pending-validation');
    expect(screen.getByRole('link', { name: aboutCopy.exhibitionLinkLabel })).toHaveAttribute('href', '#exposiciones');
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('retains the existing forms without inventing photography while original slots are pending', () => {
    expect(aboutMaterial.images.every((image) => image.src === null)).toBe(true);
    const markup = renderToString(<AboutFinale />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelectorAll('[data-about-converge]')).toHaveLength(3);
    expect(document.querySelectorAll('figure,img')).toHaveLength(0);
    expect(document.querySelectorAll('[data-about-act="transform"]')).toHaveLength(1);
    expect(document.body.textContent).toContain(aboutCopy.finaleSupport);
  });
});
