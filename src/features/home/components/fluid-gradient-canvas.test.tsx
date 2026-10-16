import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FluidGradientCanvas } from './fluid-gradient-canvas';
import { HomeAtmosphere } from './home-atmosphere';

vi.mock('@/shared/ui/liquid-gradient/liquid-gradient', () => ({
  LiquidGradient: ({ className, priority = false }: { className?: string; priority?: boolean }) => (
    <div className={className} data-testid="liquid-gradient" data-priority={priority} aria-hidden="true">
      <canvas aria-hidden="true" />
    </div>
  ),
}));

describe('HomeAtmosphere', () => {
  it('integrates the reusable liquid background as a decorative home layer', () => {
    const { container } = render(<HomeAtmosphere />);

    expect(container.querySelector('.home-atmosphere')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('liquid-gradient')).toHaveClass('home-atmosphere__canvas');
    expect(screen.getByTestId('liquid-gradient')).toHaveAttribute('data-priority', 'true');
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the same shared renderer when the canvas wrapper is rendered independently', () => {
    render(<FluidGradientCanvas />);

    expect(screen.getByTestId('liquid-gradient')).toHaveClass('home-atmosphere__canvas');
    expect(screen.getByTestId('liquid-gradient')).toHaveAttribute('data-priority', 'true');
  });
});
