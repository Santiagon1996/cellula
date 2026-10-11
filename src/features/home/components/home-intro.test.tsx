import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeIntro } from './home-intro';

describe('HomeIntro', () => {
  it('renders the accessible home heading', () => {
    render(<HomeIntro />);
    expect(screen.getByRole('heading', { name: 'CÉLULA', level: 1 })).toBeInTheDocument();
  });

  it('shows the upcoming launch message', () => {
    render(<HomeIntro />);
    expect(screen.getByText('Próximamente.')).toBeInTheDocument();
  });
});
