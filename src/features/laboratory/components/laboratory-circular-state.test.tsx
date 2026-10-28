import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImgHTMLAttributes } from 'react';
import type { Laboratory } from '../types';
import { LaboratoryCircularCarousel } from './laboratory-circular-carousel';

const animation = vi.hoisted(() => ({ to: vi.fn() }));

vi.mock('gsap', () => ({ default: animation }));
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const laboratories: Laboratory[] = ['Forma', 'Color', 'Materia'].map((title, index) => ({
  id: `study-${index}`, slug: `study-${index}`, title, category: 'Estudio',
  shortDescription: `Un estudio sobre ${title.toLowerCase()}.`, description: `Texto de ${title}.`,
  coverImage: { src: `/study-${index}.svg`, alt: `Obra ${title}`, width: 800, height: 1000 },
  gallery: [],
}));

let desktop = false;
let desktopMedia: EventTarget;

beforeEach(() => {
  desktop = false;
  desktopMedia = new EventTarget();
  const motionMedia = new EventTarget();
  animation.to.mockReset();
  vi.stubGlobal('matchMedia', (query: string) => {
    const orientation = query.includes('min-width');
    const media = orientation ? desktopMedia : motionMedia;
    return {
      get matches() { return orientation ? desktop : true; },
      addEventListener: media.addEventListener.bind(media),
      removeEventListener: media.removeEventListener.bind(media),
    };
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
});

afterEach(() => vi.unstubAllGlobals());

function expectActive(container: HTMLElement, index: number) {
  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-circular-card]'));
  expect(cards.filter((card) => card.dataset.active === 'true')).toEqual([cards[index]]);
  for (const [cardIndex, card] of cards.entries()) {
    const button = within(card).getByRole('button');
    expect(card).toHaveAttribute('data-active', String(cardIndex === index));
    expect(button).toHaveAttribute('tabindex', cardIndex === index ? '0' : '-1');
    if (cardIndex === index) expect(button).toHaveAttribute('aria-current', 'true');
    else expect(button).not.toHaveAttribute('aria-current');
  }
}

describe('Circular Carousel selection and frost layers with the real navigation hook', () => {
  it('keeps the frost decorative and separate from each original image and accessible description', () => {
    const { container } = render(<LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={vi.fn()} />);

    expectActive(container, 0);
    expect(screen.getAllByRole('img')).toHaveLength(laboratories.length);
    for (const [index, card] of container.querySelectorAll<HTMLElement>('[data-circular-card]').entries()) {
      const media = card.querySelector('[data-lab-media]');
      const frost = media?.querySelector('.laboratory-circular-card__frost');
      expect(media?.querySelectorAll('img')).toHaveLength(1);
      expect(frost).toHaveAttribute('aria-hidden', 'true');
      expect(frost).toBeEmptyDOMElement();
      expect(media).not.toContainElement(card.querySelector('.laboratory-circular-card__caption'));
      expect(within(card).getByRole('button')).toHaveAccessibleDescription(laboratories[index].shortDescription);
    }
  });

  it('transfers the visual and accessible state through manual navigation and keeps its id when the axis changes', () => {
    const { container } = render(<LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={vi.fn()} />);
    const viewport = screen.getByRole('group', { name: 'Galería de laboratorios' });
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    expectActive(container, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio anterior' }));
    expectActive(container, 0);
    fireEvent.keyDown(viewport, { key: 'ArrowDown' });
    expectActive(container, 1);

    desktop = true;
    act(() => desktopMedia.dispatchEvent(new Event('change')));
    expect(screen.getByRole('region', { name: 'Estudios del laboratorio' })).toHaveAttribute('data-orientation', 'horizontal');
    expectActive(container, 1);
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    expectActive(container, 2);
    expect(animation.to).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /pausar|reanudar/i })).not.toBeInTheDocument();
  });

  it('preserves the selected image and focus target while fullscreen blocks actions and after it returns', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(<LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Laboratorio siguiente' }));
    const trigger = screen.getByRole('button', { name: 'EXPLORAR: Color' });
    const source = trigger.querySelector('[data-lab-media]');
    fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledWith({ laboratory: laboratories[1], source, trigger });

    rerender(<LaboratoryCircularCarousel laboratories={laboratories} blocked onSelect={onSelect} />);
    expectActive(container, 1);
    expect(screen.getByRole('button', { name: 'Laboratorio siguiente' })).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expectActive(container, 1);
    act(() => trigger.focus({ preventScroll: true }));
    expect(trigger).toHaveFocus();

    rerender(<LaboratoryCircularCarousel laboratories={laboratories} blocked={false} onSelect={onSelect} />);
    expectActive(container, 1);
    expect(trigger.querySelector('[data-lab-media]')).toBe(source);
    expect(trigger).not.toHaveAttribute('aria-disabled');
    fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(animation.to).not.toHaveBeenCalled();
  });
});
