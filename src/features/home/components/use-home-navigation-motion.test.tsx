import { useRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHomeNavigationMotion, type NavigationPhase } from './use-home-navigation-motion';

class MotionPreference extends EventTarget {
  matches = false;

  setReduced(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

let preference: MotionPreference;

function Harness({ onPhaseChange }: { onPhaseChange: (phase: NavigationPhase) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { setOpen } = useHomeNavigationMotion({
    rootRef, panelRef, surfaceRef, buttonRef, onPhaseChange,
  });

  return (
    <div ref={rootRef}>
      <button ref={buttonRef} onClick={() => setOpen(true)}>Abrir</button>
      <button onClick={() => setOpen(false)}>Cerrar</button>
      <div ref={panelRef}>
        <svg ref={surfaceRef} viewBox="0 0 1000 1000">
          <path data-nav-shape />
        </svg>
        <div data-nav-row>HOME</div>
        <div data-nav-reveal>CÉLULA</div>
      </div>
    </div>
  );
}

beforeEach(() => {
  preference = new MotionPreference();
  vi.stubGlobal('matchMedia', () => preference);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useHomeNavigationMotion with GSAP', () => {
  it('can close before the first frame and reopen both endpoints without becoming stuck', async () => {
    const onPhaseChange = vi.fn<(phase: NavigationPhase) => void>();
    const { container } = render(<Harness onPhaseChange={onPhaseChange} />);
    const closedPath = container.querySelector('[data-nav-shape]')?.getAttribute('d') ?? '';

    act(() => {
      fireEvent.click(screen.getByText('Abrir'));
      fireEvent.click(screen.getByText('Cerrar'));
    });
    expect(onPhaseChange).toHaveBeenLastCalledWith('closed');

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(container.querySelector('[data-nav-shape]')).toHaveAttribute('d', closedPath);

    fireEvent.click(screen.getByText('Abrir'));
    await waitFor(() => expect(onPhaseChange).toHaveBeenLastCalledWith('open'), { timeout: 2200 });

    act(() => {
      fireEvent.click(screen.getByText('Cerrar'));
      fireEvent.click(screen.getByText('Abrir'));
    });
    expect(onPhaseChange).toHaveBeenLastCalledWith('open');
  });

  it('finishes the requested state when reduced motion changes during opening and removes listeners on unmount', () => {
    const onPhaseChange = vi.fn<(phase: NavigationPhase) => void>();
    const { unmount } = render(<Harness onPhaseChange={onPhaseChange} />);

    fireEvent.click(screen.getByText('Abrir'));
    expect(onPhaseChange).toHaveBeenLastCalledWith('opening');
    act(() => preference.setReduced(true));
    expect(onPhaseChange).toHaveBeenLastCalledWith('open');

    fireEvent.click(screen.getByText('Cerrar'));
    expect(onPhaseChange).toHaveBeenLastCalledWith('closed');
    fireEvent.click(screen.getByText('Abrir'));
    expect(onPhaseChange).toHaveBeenLastCalledWith('open');

    unmount();
    onPhaseChange.mockClear();
    act(() => {
      preference.setReduced(false);
      preference.setReduced(true);
    });
    expect(onPhaseChange).not.toHaveBeenCalled();
  });
});
