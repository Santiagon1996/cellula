import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Laboratory } from '../types';
import { LaboratoryCircularCarousel } from './laboratory-circular-carousel';

const engine = vi.hoisted(() => ({
  activeId: 'study-0' as string | null,
  orientation: 'vertical' as 'vertical' | 'horizontal',
  navigate: vi.fn(),
  select: vi.fn(),
}));

vi.mock('./use-circular-carousel', () => ({
  useCircularCarousel: () => engine,
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { src: string; alt: string; width: number; height: number; className: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt} />
  ),
}));

const laboratories: Laboratory[] = ['Forma', 'Color', 'Materia'].map((title, index) => ({
  id: `study-${index}`,
  slug: `study-${index}`,
  title,
  category: `Estudio ${index + 1}`,
  shortDescription: `Un estudio sobre ${title.toLowerCase()}.`,
  description: `Texto completo de ${title}.`,
  coverImage: { src: `/study-${index}.svg`, alt: `Obra ${title}`, width: 800, height: 1000 },
  gallery: [],
  temporary: index === 0,
}));

function renderCarousel(items = laboratories, blocked = false) {
  const onSelect = vi.fn();
  return {
    ...render(<LaboratoryCircularCarousel laboratories={items} blocked={blocked} onSelect={onSelect} />),
    onSelect,
  };
}

beforeEach(() => {
  engine.activeId = laboratories[0].id;
  engine.orientation = 'vertical';
  engine.navigate.mockReset();
  engine.select.mockReset();
});

describe('LaboratoryCircularCarousel presentation', () => {
  it('renders one accessible card per study with the original images and editorial content', () => {
    const { container } = renderCarousel();
    const region = screen.getByRole('region', { name: 'Estudios del laboratorio' });
    const cards = container.querySelectorAll<HTMLElement>('[data-circular-card]');

    expect(region).toHaveAttribute('data-orientation', 'vertical');
    expect(cards).toHaveLength(laboratories.length);
    for (const [index, laboratory] of laboratories.entries()) {
      const card = cards[index];
      expect(card).toHaveAttribute('data-lab-id', laboratory.id);
      expect(card).not.toHaveAttribute('aria-hidden', 'true');
      expect(within(card).getAllByRole('button')).toHaveLength(1);
      const image = within(card).getByRole('img', { name: laboratory.coverImage.alt });
      expect(image).toHaveAttribute('src', laboratory.coverImage.src);
      expect(image).toHaveAttribute('width', String(laboratory.coverImage.width));
      expect(image).toHaveAttribute('height', String(laboratory.coverImage.height));
      expect(within(card).getByText(laboratory.category)).toBeInTheDocument();
      expect(within(card).getByText(laboratory.shortDescription)).toBeInTheDocument();
    }
    expect(screen.getByText(/temporal/i)).toBeInTheDocument();
  });

  it('exposes a single active study and keeps only that card in the tab order', () => {
    const { container } = renderCarousel();
    const active = screen.getByRole('button', { name: 'EXPLORAR: Forma' });
    const inactive = screen.getByRole('button', { name: 'Seleccionar estudio: Color' });

    expect(active).toHaveAttribute('aria-current', 'true');
    expect(active).toHaveAttribute('tabindex', '0');
    expect(inactive).not.toHaveAttribute('aria-current', 'true');
    expect(inactive).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Seleccionar estudio: Materia' })).toHaveAttribute('tabindex', '-1');
    expect(container.querySelectorAll('[data-circular-card][data-active="true"]')).toHaveLength(1);
    expect(within(active).getByText(laboratories[0].shortDescription).closest('[aria-hidden="true"]')).toBeNull();
  });

  it('updates the polite position indicator and active action after a settled selection', () => {
    const { rerender } = renderCarousel();
    const indicator = screen.getByText(/01\s*\/\s*03/);
    expect(indicator.closest('[aria-live="polite"]')).toHaveAttribute('aria-atomic', 'true');

    engine.activeId = laboratories[1].id;
    rerender(<LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={vi.fn()} />);

    expect(screen.getByText(/02\s*\/\s*03/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EXPLORAR: Color' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Seleccionar estudio: Forma' })).toHaveAttribute('tabindex', '-1');
  });

  it('provides previous and next controls without pause or resume controls', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(engine.navigate.mock.calls).toEqual([[-1], [1]]);
    expect(screen.queryByRole('button', { name: /pausar|reanudar/i })).not.toBeInTheDocument();
  });

  it('passes the real image element and originating button to the selection engine', () => {
    const { container } = renderCarousel();
    const button = screen.getByRole('button', { name: 'EXPLORAR: Forma' });
    const source = button.querySelector<HTMLElement>('[data-lab-media]');

    fireEvent.click(button);

    expect(source).toHaveAttribute('data-flip-id', 'laboratory-study-0');
    expect(engine.select).toHaveBeenCalledWith({ laboratory: laboratories[0], source, trigger: button });
    expect(container.contains(source)).toBe(true);
  });

  it('delegates side-card selection without creating a second accessible action', () => {
    renderCarousel();
    const button = screen.getByRole('button', { name: 'Seleccionar estudio: Color' });

    fireEvent.click(button);

    expect(engine.select).toHaveBeenCalledTimes(1);
    expect(engine.select).toHaveBeenCalledWith({
      laboratory: laboratories[1],
      source: button.querySelector('[data-lab-media]'),
      trigger: button,
    });
  });

  it('reflects horizontal orientation without duplicating the collection', () => {
    engine.orientation = 'horizontal';
    const { container } = renderCarousel();

    expect(screen.getByRole('region', { name: 'Estudios del laboratorio' })).toHaveAttribute('data-orientation', 'horizontal');
    expect(container.querySelectorAll('[data-circular-card]')).toHaveLength(3);
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('retains a single useful action for a collection containing one study', () => {
    const { container } = renderCarousel(laboratories.slice(0, 1));

    expect(container.querySelectorAll('[data-circular-card]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'EXPLORAR: Forma' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByText(/01\s*\/\s*01/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('provides an empty state without creating placeholder projects or controls', () => {
    engine.activeId = null;
    const { container } = renderCarousel([]);

    expect(container.querySelector('p')).toHaveTextContent(/\S/);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[data-circular-card]')).toBeNull();
  });

  it('blocks card and navigation actions while preserving the fullscreen focus return target', () => {
    renderCarousel(laboratories, true);

    for (const button of screen.getAllByRole('button')) {
      if (button.closest('[data-circular-card]')) expect(button).toHaveAttribute('aria-disabled', 'true');
      else expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(engine.select).not.toHaveBeenCalled();
    expect(engine.navigate).not.toHaveBeenCalled();
    const trigger = screen.getByRole('button', { name: 'EXPLORAR: Forma' });
    expect(trigger).toHaveAttribute('aria-current', 'true');
    trigger.focus({ preventScroll: true });
    expect(trigger).toHaveFocus();
  });
});
