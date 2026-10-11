import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExhibitionSlider } from './exhibition-slider';

const artworks = [
  {
    id: 'pink',
    src: '/images/exhibitions/pink.svg',
    alt: 'Formas abstractas rosas sobre un fondo crema',
    title: 'Materia rosa',
    technique: 'Acrílico sobre lienzo',
    description: 'Una composición de formas suaves y color rosa.',
  },
  {
    id: 'blue',
    src: '/images/exhibitions/blue.svg',
    alt: 'Una composición de curvas azules',
    title: 'Corriente azul',
    technique: 'Técnica mixta',
    description: 'Curvas azules que sugieren el movimiento del agua.',
  },
  {
    id: 'lavender',
    src: '/images/exhibitions/lavender.svg',
    alt: 'Una figura lavanda en un espacio vacío',
    title: 'Silencio lavanda',
    technique: 'Óleo sobre lienzo',
    description: 'Un estudio de la relación entre la figura y el espacio.',
  },
];

const viewportWidth = 900;
const slideWidth = 400;
const slideSpacing = 432;

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
    this.isPrimary = init.isPrimary ?? true;
  }
}

const setPointerCapture = vi.fn();
const releasePointerCapture = vi.fn();
const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();

function overrideElementProperty(name: string, descriptor: PropertyDescriptor) {
  originalDescriptors.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  Object.defineProperty(HTMLElement.prototype, name, { configurable: true, ...descriptor });
}

function slideIndex(element: HTMLElement) {
  return Array.from(element.parentElement?.children ?? []).indexOf(element);
}

function rectangle(left: number, width: number): DOMRect {
  return {
    x: left,
    y: 0,
    left,
    top: 0,
    right: left + width,
    bottom: 600,
    width,
    height: 600,
    toJSON: () => ({}),
  };
}

function renderSlider() {
  const result = render(<ExhibitionSlider artworks={artworks} />);
  const viewport = result.container.querySelector<HTMLElement>('.exhibition-slider__viewport');
  const slides = result.container.querySelectorAll<HTMLElement>('.exhibition-slider__slide');
  if (!viewport) throw new Error('The exhibition viewport did not render.');
  settle();
  return { ...result, viewport, slides };
}

function settle() {
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

function scrollToPosition(viewport: HTMLElement, position: number) {
  viewport.scrollLeft = position;
  fireEvent.scroll(viewport);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  setPointerCapture.mockClear();
  releasePointerCapture.mockClear();
  overrideElementProperty('clientWidth', {
    get(this: HTMLElement) {
      return this.classList.contains('exhibition-slider__viewport') ? viewportWidth : slideWidth;
    },
  });
  overrideElementProperty('offsetWidth', { get: () => slideWidth });
  overrideElementProperty('offsetLeft', {
    get(this: HTMLElement) {
      return (viewportWidth - slideWidth) / 2 + slideSpacing * slideIndex(this);
    },
  });
  overrideElementProperty('scrollWidth', {
    get(this: HTMLElement) {
      const count = this.querySelectorAll('.exhibition-slider__slide').length;
      return viewportWidth + slideSpacing * Math.max(0, count - 1);
    },
  });
  overrideElementProperty('scrollTo', {
    value(this: HTMLElement, options: ScrollToOptions | number, top?: number) {
      this.scrollLeft = typeof options === 'number' ? options : (options.left ?? this.scrollLeft);
      this.scrollTop = typeof options === 'number' ? (top ?? 0) : (options.top ?? this.scrollTop);
    },
  });
  overrideElementProperty('setPointerCapture', { value: setPointerCapture });
  overrideElementProperty('releasePointerCapture', { value: releasePointerCapture });
  overrideElementProperty('hasPointerCapture', { value: () => true });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('exhibition-slider__viewport')) {
      return rectangle(0, viewportWidth);
    }
    if (this.classList.contains('exhibition-slider__slide')) {
      const viewport = this.closest<HTMLElement>('.exhibition-slider__viewport');
      const left = (viewportWidth - slideWidth) / 2 + slideSpacing * slideIndex(this);
      return rectangle(left - (viewport?.scrollLeft ?? 0), slideWidth);
    }
    return rectangle(0, slideWidth);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
  originalDescriptors.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ExhibitionSlider', () => {
  it('reveals the centered artwork details and announces its position on arrival', () => {
    const { viewport, slides } = renderSlider();

    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(slides[0]).toHaveAttribute('data-active', 'true');
    expect(slides[0]).toHaveAttribute('data-revealed', 'true');
    expect(slides[1]).toHaveAttribute('data-revealed', 'false');
    expect(within(slides[0]).getByText(artworks[0].description).closest('[aria-hidden]')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    expect(screen.getByText('Obra 1 de 3: Materia rosa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Obra anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Obra siguiente' })).toBeEnabled();
  });

  it('hides details during scrolling, then centers and reveals the nearest artwork', () => {
    const { viewport, slides } = renderSlider();

    scrollToPosition(viewport, 470);

    expect(slides[0]).toHaveAttribute('data-revealed', 'false');
    expect(slides[1]).toHaveAttribute('data-revealed', 'false');
    expect(within(slides[0]).getByText(artworks[0].description).closest('[aria-hidden]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    act(() => vi.advanceTimersByTime(179));
    expect(slides[1]).toHaveAttribute('data-revealed', 'false');

    settle();

    expect(viewport.scrollLeft).toBe(slideSpacing);
    expect(slides[1]).toHaveAttribute('data-active', 'true');
    expect(slides[1]).toHaveAttribute('data-revealed', 'true');
    expect(slides[0]).toHaveAttribute('data-active', 'false');
    expect(screen.getByText('Obra 2 de 3: Corriente azul')).toBeInTheDocument();
  });

  it('supports next, previous, arrow keys, Home, and End with disabled boundary controls', () => {
    const { viewport, slides } = renderSlider();
    const previous = screen.getByRole('button', { name: 'Obra anterior' });
    const next = screen.getByRole('button', { name: 'Obra siguiente' });

    fireEvent.click(next);
    expect(viewport.scrollLeft).toBe(slideSpacing);
    settle();
    expect(slides[1]).toHaveAttribute('data-revealed', 'true');
    expect(previous).toBeEnabled();

    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    settle();
    expect(viewport.scrollLeft).toBe(slideSpacing * 2);
    expect(slides[2]).toHaveAttribute('data-revealed', 'true');
    expect(next).toBeDisabled();

    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    settle();
    expect(viewport.scrollLeft).toBe(slideSpacing * 2);

    fireEvent.keyDown(viewport, { key: 'Home' });
    settle();
    expect(viewport.scrollLeft).toBe(0);
    expect(previous).toBeDisabled();

    fireEvent.keyDown(viewport, { key: 'End' });
    settle();
    expect(slides[2]).toHaveAttribute('data-active', 'true');

    fireEvent.click(previous);
    settle();
    expect(slides[1]).toHaveAttribute('data-active', 'true');

    fireEvent.keyDown(viewport, { key: 'ArrowLeft' });
    settle();
    expect(slides[0]).toHaveAttribute('data-revealed', 'true');
  });

  it('drags with the mouse, settles centrally, and suppresses the click produced by a drag', () => {
    const { viewport, slides } = renderSlider();

    fireEvent.pointerDown(viewport, { pointerId: 7, pointerType: 'mouse', button: 0, clientX: 700 });
    fireEvent.pointerMove(viewport, { pointerId: 7, pointerType: 'mouse', clientX: 240 });

    expect(viewport.scrollLeft).toBeGreaterThan(0);
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(slides[0]).toHaveAttribute('data-revealed', 'false');
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(viewport, { pointerId: 7, pointerType: 'mouse', clientX: 240 });

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(slides[1], click);
    expect(click.defaultPrevented).toBe(true);
    settle();

    expect(viewport.scrollLeft).toBe(slideSpacing);
    expect(slides[1]).toHaveAttribute('data-revealed', 'true');
    expect(releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('does not cancel a click when a mouse gesture remains below the drag threshold', () => {
    const { viewport, slides } = renderSlider();

    fireEvent.pointerDown(viewport, { pointerId: 2, pointerType: 'mouse', button: 0, clientX: 500 });
    fireEvent.pointerMove(viewport, { pointerId: 2, pointerType: 'mouse', clientX: 498 });
    fireEvent.pointerUp(viewport, { pointerId: 2, pointerType: 'mouse', clientX: 498 });

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(slides[0], click);
    expect(click.defaultPrevented).toBe(false);
  });

  it('leaves touch gestures native and reveals the artwork after native scroll stops', () => {
    const { viewport, slides } = renderSlider();
    const pointerDown = new TestPointerEvent('pointerdown', {
      pointerId: 3,
      pointerType: 'touch',
      clientX: 700,
      bubbles: true,
      cancelable: true,
    });
    const pointerMove = new TestPointerEvent('pointermove', {
      pointerId: 3,
      pointerType: 'touch',
      clientX: 240,
      bubbles: true,
      cancelable: true,
    });

    fireEvent(viewport, pointerDown);
    fireEvent(viewport, pointerMove);

    expect(pointerDown.defaultPrevented).toBe(false);
    expect(pointerMove.defaultPrevented).toBe(false);
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(viewport.scrollLeft).toBe(0);

    scrollToPosition(viewport, slideSpacing * 2);
    settle();
    expect(slides[2]).toHaveAttribute('data-revealed', 'true');
    expect(screen.getByText('Obra 3 de 3: Silencio lavanda')).toBeInTheDocument();
  });

  it.each(['touchEnd', 'touchCancel'] as const)(
    'waits for %s before centering an artwork when scrolling pauses with a finger still down',
    (endEvent) => {
      const { viewport, slides } = renderSlider();

      fireEvent.touchStart(viewport, { touches: [{ identifier: 1 }] });
      scrollToPosition(viewport, 470);
      settle();

      expect(viewport.scrollLeft).toBe(470);
      expect(slides[1]).toHaveAttribute('data-revealed', 'false');
      expect(screen.queryByText('Obra 2 de 3: Corriente azul')).not.toBeInTheDocument();

      fireEvent[endEvent](viewport, { touches: [] });
      settle();

      expect(viewport.scrollLeft).toBe(slideSpacing);
      expect(slides[1]).toHaveAttribute('data-revealed', 'true');
      expect(screen.getByText('Obra 2 de 3: Corriente azul')).toBeInTheDocument();
    },
  );

  it('ends a mouse drag when the window loses focus and accepts a fresh drag afterwards', () => {
    const { viewport, slides } = renderSlider();

    fireEvent.pointerDown(viewport, { pointerId: 4, pointerType: 'mouse', button: 0, clientX: 700 });
    fireEvent.pointerMove(viewport, { pointerId: 4, pointerType: 'mouse', clientX: 230 });
    expect(viewport).toHaveAttribute('data-dragging', 'true');

    fireEvent(window, new Event('blur'));
    settle();

    expect(viewport).toHaveAttribute('data-dragging', 'false');
    expect(releasePointerCapture).toHaveBeenCalledWith(4);
    expect(viewport.scrollLeft).toBe(slideSpacing);
    expect(slides[1]).toHaveAttribute('data-revealed', 'true');

    fireEvent.pointerDown(viewport, { pointerId: 5, pointerType: 'mouse', button: 0, clientX: 700 });
    fireEvent.pointerMove(viewport, { pointerId: 5, pointerType: 'mouse', clientX: 268 });
    fireEvent.pointerCancel(window, { pointerId: 5, pointerType: 'mouse' });
    settle();

    expect(viewport.scrollLeft).toBe(slideSpacing * 2);
    expect(slides[2]).toHaveAttribute('data-revealed', 'true');
    expect(releasePointerCapture).toHaveBeenCalledWith(5);
  });

  it('renders a useful empty state when no artworks are available', () => {
    const { container } = render(<ExhibitionSlider artworks={[]} />);

    expect(screen.getByText('La selección estará disponible próximamente.')).toBeInTheDocument();
    expect(container.querySelectorAll('.exhibition-slider__slide')).toHaveLength(0);
  });
});
