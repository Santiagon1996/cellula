import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArrowIcon, type ArrowDirection } from './arrow-icon';

const directions: ArrowDirection[] = ['up-right', 'down-right', 'up', 'down', 'left', 'right'];

// Official Material Symbols Outlined path data, one per direction.
const officialPaths: Record<ArrowDirection, string> = {
  'up-right': 'm256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z',
  'down-right': 'M360-200v-80h264L160-744l56-56 464 464v-264h80v400H360Z',
  up: 'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z',
  down: 'M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z',
  left: 'm313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z',
  right: 'M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z',
};

const emoji = /[\p{Extended_Pictographic}\u20E3\uFE0F\u2190-\u21FF]/u;

describe('ArrowIcon', () => {
  it.each(directions)('renders the Material Symbols %s arrow', (direction) => {
    const { container } = render(<ArrowIcon direction={direction} />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('data-arrow', direction);
    expect(svg.querySelectorAll('path')).toHaveLength(1);
    expect(svg.querySelector('path')).toHaveAttribute('d', officialPaths[direction]);
    expect(svg.querySelector('path')).not.toHaveAttribute('fill');
    expect(svg.textContent).toBe('');
  });

  it('uses unique, non-empty geometry for every direction', () => {
    expect(new Set(Object.values(officialPaths)).size).toBe(directions.length);
  });

  it('is decorative by default and removed from the accessibility tree', () => {
    const { container } = render(<ArrowIcon direction="up-right" />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('id');
  });

  it('exposes an accessible name only when it is not decorative', () => {
    const { container } = render(<ArrowIcon direction="left" decorative={false} label="Anterior" />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'Anterior');
    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it('follows the surrounding text size by default and accepts numeric or CSS sizes', () => {
    const { container, rerender } = render(<ArrowIcon direction="down" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '1em');
    expect(svg).toHaveAttribute('height', '1em');

    rerender(<ArrowIcon direction="down" size={32} />);
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');

    rerender(<ArrowIcon direction="down" size="1.5rem" className="extra" />);
    expect(svg).toHaveAttribute('width', '1.5rem');
    expect(svg).toHaveClass('extra');
  });

  it('renders on the server without client state and without emoji characters', () => {
    const markup = renderToString(<ArrowIcon direction="up-right" />);

    expect(markup).toContain('<svg');
    expect(markup).toContain('aria-hidden="true"');
    expect(emoji.test(markup)).toBe(false);
  });
});
