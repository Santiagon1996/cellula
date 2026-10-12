import type { Laboratory, LaboratorySelection } from '../types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { demoLaboratories } from '../data/laboratories';
import { LaboratorySection } from './laboratory-section';

vi.mock('./laboratory-carousel', () => ({
  LaboratoryCarousel: ({ laboratories, paused, onSelect }: {
    laboratories: readonly Laboratory[];
    paused: boolean;
    onSelect: (selection: LaboratorySelection) => void;
  }) => (
    <div data-testid="carousel" data-paused={paused}>
      {laboratories.map((laboratory) => (
        <button key={laboratory.id} type="button" onClick={(event) => onSelect({ laboratory, source: event.currentTarget, trigger: event.currentTarget })}>{laboratory.title}</button>
      ))}
    </div>
  ),
}));

vi.mock('./laboratory-detail', () => ({
  LaboratoryDetail: ({ selection, onClosed }: { selection: LaboratorySelection; onClosed: () => void }) => (
    <div role="dialog" aria-label={selection.laboratory.title}>
      <button type="button" onClick={onClosed}>Cerrar muestra</button>
    </div>
  ),
}));

describe('LaboratorySection composition', () => {
  it('has a distinct destination and clearly identifies temporary content', () => {
    const { container } = render(<LaboratorySection />);
    expect(container.querySelectorAll('#laboratorios')).toHaveLength(1);
    expect(container.querySelector('#laboratorio')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Laboratorio' })).toBeInTheDocument();
    expect(screen.getByText('LAB / MUESTRAS TEMPORALES')).toBeInTheDocument();
    expect(screen.getByTestId('carousel')).toHaveAttribute('data-paused', 'false');
  });

  it('keeps one selection and pauses until the detail finishes closing', () => {
    render(<LaboratorySection />);
    fireEvent.click(screen.getByRole('button', { name: demoLaboratories[1].title }));
    expect(screen.getByRole('dialog', { name: demoLaboratories[1].title })).toBeInTheDocument();
    expect(screen.getByTestId('carousel')).toHaveAttribute('data-paused', 'true');
    fireEvent.click(screen.getByRole('button', { name: demoLaboratories[0].title }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: demoLaboratories[1].title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar muestra' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('carousel')).toHaveAttribute('data-paused', 'false');
  });

  it('accepts replacement data without requiring demo metadata', () => {
    render(<LaboratorySection laboratories={[]} />);
    expect(screen.getByText('LAB / ESTUDIOS ABIERTOS')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
