import { StrictMode, type ImgHTMLAttributes } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LaboratorySelection } from '../types';
import { LaboratoryDetail } from './laboratory-detail';

type TweenOptions = { onComplete?: () => void; [key: string]: unknown };
type Motion = { kind: string; target: unknown; options: TweenOptions; kill: ReturnType<typeof vi.fn> };

const motion = vi.hoisted(() => {
  const calls: Motion[] = [];
  return {
    calls,
    states: [] as { source: HTMLElement; overflow: string; visibility: string }[],
    sets: [] as { target: unknown; options: TweenOptions }[],
    create(kind: string, target: unknown, options: TweenOptions) {
      const animation = { kind, target, options, kill: vi.fn() };
      calls.push(animation);
      return animation;
    },
  };
});

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    set: vi.fn((target: unknown, options: TweenOptions) => { motion.sets.push({ target, options }); }),
    to: vi.fn((target: unknown, options: TweenOptions) => motion.create('to', target, options)),
  },
}));

vi.mock('gsap/Flip', () => ({
  Flip: {
    getState: vi.fn((source: HTMLElement) => {
      const state = { source, overflow: document.body.style.overflow, visibility: source.style.visibility };
      motion.states.push(state);
      return state;
    }),
    from: vi.fn((state: unknown, options: TweenOptions) => motion.create('from', state, options)),
    fit: vi.fn((target: unknown, state: unknown, options: TweenOptions) => motion.create('fit', { target, state }, options)),
  },
}));

vi.mock('next/image', () => ({
  default: ({ alt, src, width, height, className }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} width={width} height={height} className={className} />
  ),
}));

const media = { matches: false, listener: undefined as (() => void) | undefined };
const fixtures: HTMLElement[] = [];

function makeSelection() {
  const main = document.createElement('main');
  const viewport = document.createElement('div');
  const trigger = document.createElement('button');
  const source = document.createElement('div');
  const image = document.createElement('img');
  source.dataset.flipId = 'laboratory-test';
  image.style.objectFit = 'cover';
  image.style.objectPosition = '25% 75%';
  source.append(image);
  trigger.append(source);
  viewport.append(trigger);
  main.append(viewport);
  document.body.append(main);
  fixtures.push(main);
  vi.spyOn(source, 'getBoundingClientRect').mockReturnValue(new DOMRect(80, 60, 300, 400));

  const navigation = document.createElement('div');
  navigation.dataset.phase = 'closed';
  const toggle = document.createElement('button');
  toggle.setAttribute('aria-controls', 'home-navigation-panel');
  navigation.append(toggle);
  const identity = document.createElement('div');
  identity.className = 'home-identity';
  identity.setAttribute('inert', 'saved');
  document.body.append(navigation, identity);
  fixtures.push(navigation, identity);

  const selection: LaboratorySelection = {
    source,
    trigger,
    laboratory: {
      id: 'test', slug: 'test', title: 'Materia en movimiento', category: 'Estudio de materia',
      shortDescription: 'Un encuentro entre forma y luz.', description: 'Una investigacion abierta sobre el movimiento.',
      coverImage: { src: '/cover.jpg', alt: 'Formas de estudio', width: 1200, height: 1600 },
      gallery: [{ src: '/gallery.jpg', alt: 'Detalle del material', width: 1800, height: 1200 }],
      temporary: true, year: 2026, credits: ['Estudio Celula'],
    },
  };
  trigger.focus();
  return { selection, main, viewport, navigation, identity };
}

function lastMotion(kind: string) {
  const animation = motion.calls.findLast((call) => call.kind === kind);
  if (!animation) throw new Error(`Missing ${kind} animation`);
  return animation;
}

function finish(animation: Motion) {
  act(() => { animation.options.onComplete?.(); });
}

function beginShrink() {
  const scroll = motion.calls.findLast((call) => call.kind === 'to' && 'scrollTop' in call.options);
  if (!scroll) throw new Error('Missing scroll return animation');
  finish(scroll);
}

beforeEach(() => {
  motion.calls.length = 0;
  motion.states.length = 0;
  motion.sets.length = 0;
  media.matches = false;
  media.listener = undefined;
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return media.matches; },
    addEventListener: vi.fn((_event: string, listener: () => void) => { media.listener = listener; }),
    removeEventListener: vi.fn(),
  })));
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 16);
  document.body.style.cssText = 'overflow: clip; padding-right: 7px; overscroll-behavior: contain;';
  document.documentElement.style.cssText = 'overflow: auto; overscroll-behavior: contain;';
});

afterEach(() => {
  fixtures.splice(0).forEach((element) => element.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';
});

describe('LaboratoryDetail', () => {
  it('captures the card before locking the document and presents the selected editorial in a body portal', () => {
    const { selection, main, navigation, identity } = makeSelection();
    selection.source.querySelector('img')!.style.transform = 'scale(1.025)';
    const { container } = render(<LaboratoryDetail selection={selection} onClosed={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Materia en movimiento' });

    expect(container).toBeEmptyDOMElement();
    expect(dialog.parentElement).toBe(document.body);
    expect(motion.states[0]).toEqual({ source: selection.source, overflow: 'clip', visibility: '' });
    expect(main).toHaveAttribute('inert');
    expect(navigation).toHaveAttribute('inert');
    expect(identity).toHaveAttribute('inert', '');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('23px');
    expect(document.body.style.position).toBe('');
    expect(selection.source.style.visibility).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Cerrar laboratorio' })).toHaveFocus();
    expect(screen.getByText('ESTUDIO TEMPORAL')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Estudio Celula')).toBeInTheDocument();
    expect(dialog.querySelector('[data-lab-detail-cover]')).toHaveAttribute('data-flip-id', 'laboratory-test');
    expect(dialog.querySelector<HTMLImageElement>('[data-lab-detail-cover] img')?.style.objectPosition).toBe('25% 75%');
    const coverImage = dialog.querySelector<HTMLImageElement>('[data-lab-detail-cover] img');
    expect(coverImage?.style.transform).toBe('scale(1.025)');
    expect(motion.calls.find((call) => call.target === coverImage)?.options).toMatchObject({ transform: 'none', duration: 0.8 });
    expect(lastMotion('from').options).toMatchObject({ targets: dialog.querySelector('[data-lab-detail-cover]'), scale: false });
  });

  it('preserves clipping when the source is only partly visible in the carousel viewport', () => {
    const { selection, viewport } = makeSelection();
    viewport.style.overflowY = 'hidden';
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 160, 500, 200));
    render(<LaboratoryDetail selection={selection} onClosed={vi.fn()} />);
    const cover = document.querySelector('[data-lab-detail-cover]');
    expect(motion.sets.find((call) => call.target === cover && 'clipPath' in call.options)?.options.clipPath)
      .toBe('inset(25% 0% 25% 0%)');
  });

  it('traps focus and restores source, focus, inert and exact page styles before notifying closure', () => {
    const { selection, main, navigation, identity } = makeSelection();
    selection.source.style.setProperty('visibility', 'visible', 'important');
    const onClosed = vi.fn(() => {
      expect(document.body.style.overflow).toBe('clip');
      expect(document.body.style.paddingRight).toBe('7px');
      expect(document.body.style.overscrollBehavior).toBe('contain');
      expect(document.documentElement.style.overflow).toBe('auto');
      expect(main).not.toHaveAttribute('inert');
      expect(navigation).not.toHaveAttribute('inert');
      expect(identity).toHaveAttribute('inert', 'saved');
      expect(selection.source.style.visibility).toBe('visible');
      expect(selection.source.style.getPropertyPriority('visibility')).toBe('important');
      expect(selection.trigger).toHaveFocus();
    });
    render(<LaboratoryDetail selection={selection} onClosed={onClosed} />);
    finish(lastMotion('from'));
    const close = screen.getByRole('button', { name: 'Cerrar laboratorio' });
    fireEvent.keyDown(close, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(close).toHaveFocus();
    selection.trigger.focus();
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('hidden');
    expect(onClosed).not.toHaveBeenCalled();
    beginShrink();
    expect(lastMotion('fit').options.scale).toBe(false);
    finish(lastMotion('fit'));
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('closes from the current opening state and ignores late completion or repeated close requests', () => {
    const { selection } = makeSelection();
    const onClosed = vi.fn();
    render(<LaboratoryDetail selection={selection} onClosed={onClosed} />);
    const opening = lastMotion('from');
    const close = screen.getByRole('button', { name: 'Cerrar laboratorio' });
    fireEvent.click(close);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(opening.kill).toHaveBeenCalled();
    finish(opening);
    expect(document.querySelector('[data-lab-detail]')).toHaveAttribute('data-phase', 'closing');
    expect(motion.calls.filter((call) => 'scrollTop' in call.options)).toHaveLength(1);
    beginShrink();
    expect(motion.states).toHaveLength(1);
    expect(lastMotion('fit').target).toEqual({ target: document.querySelector('[data-lab-detail-cover]'), state: selection.source });
    finish(lastMotion('fit'));
    finish(opening);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('retargets a closing transition after resize and ignores the cancelled fit completion', () => {
    const { selection } = makeSelection();
    const onClosed = vi.fn();
    render(<LaboratoryDetail selection={selection} onClosed={onClosed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar laboratorio' }));
    beginShrink();
    const firstFit = lastMotion('fit');
    vi.stubGlobal('innerWidth', window.innerWidth + 120);
    fireEvent(window, new Event('resize'));
    expect(firstFit.kill).toHaveBeenCalled();
    expect(motion.calls.filter((call) => call.kind === 'fit')).toHaveLength(2);
    finish(firstFit);
    expect(onClosed).not.toHaveBeenCalled();
    finish(lastMotion('fit'));
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('settles a resizing or newly reduced-motion opening without retaining a stale transform animation', () => {
    const { selection } = makeSelection();
    render(<LaboratoryDetail selection={selection} onClosed={vi.fn()} />);
    const opening = lastMotion('from');
    vi.stubGlobal('innerHeight', window.innerHeight + 100);
    fireEvent(window, new Event('resize'));
    expect(opening.kill).toHaveBeenCalled();
    expect(document.querySelector('[data-lab-detail]')).toHaveAttribute('data-phase', 'open');
    const cover = document.querySelector('[data-lab-detail-cover]');
    const reset = motion.sets.findLast((call) => call.target === cover && 'clearProps' in call.options);
    expect(String(reset?.options.clearProps).split(',')).toEqual(expect.arrayContaining(['minWidth', 'minHeight', 'maxWidth', 'maxHeight']));
    media.matches = true;
    act(() => media.listener?.());
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar laboratorio' }));
    expect(document.body.style.overflow).toBe('clip');
    expect(selection.trigger).toHaveFocus();
  });

  it('keeps Flip running when scrollbar changes emit an incidental viewport resize', () => {
    const visualViewport = new EventTarget();
    vi.stubGlobal('visualViewport', visualViewport);
    const { selection } = makeSelection();
    render(<LaboratoryDetail selection={selection} onClosed={vi.fn()} />);
    const opening = lastMotion('from');
    fireEvent(window, new Event('resize'));
    act(() => { visualViewport.dispatchEvent(new Event('resize')); });
    expect(opening.kill).not.toHaveBeenCalled();
    expect(document.querySelector('[data-lab-detail]')).toHaveAttribute('data-phase', 'opening');
    finish(opening);
    expect(document.querySelector('[data-lab-detail]')).toHaveAttribute('data-phase', 'open');
  });

  it('closes immediately when reduced motion is preferred and restores on unmount without firing onClosed', () => {
    media.matches = true;
    const { selection } = makeSelection();
    const onClosed = vi.fn();
    const { unmount } = render(<LaboratoryDetail selection={selection} onClosed={onClosed} />);
    expect(motion.calls.some((call) => call.kind === 'from')).toBe(false);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClosed).toHaveBeenCalledTimes(1);
    unmount();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('restores locks during StrictMode cleanup and unmount even if an animation is unfinished', () => {
    const { selection, main } = makeSelection();
    const onClosed = vi.fn();
    const { unmount } = render(<StrictMode><LaboratoryDetail selection={selection} onClosed={onClosed} /></StrictMode>);
    expect(main).toHaveAttribute('inert');
    expect(document.body.style.paddingRight).toBe('23px');
    const opening = lastMotion('from');
    unmount();
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.paddingRight).toBe('7px');
    expect(main).not.toHaveAttribute('inert');
    expect(selection.source.style.visibility).toBe('');
    expect(opening.kill).toHaveBeenCalled();
    finish(opening);
    expect(onClosed).not.toHaveBeenCalled();
  });
});
