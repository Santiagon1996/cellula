import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AboutSection } from '../index';
import { aboutConcepts, aboutCopy } from '../data/about-content';

vi.mock('../hooks/use-about-scroll', () => ({ useAboutScroll: vi.fn() }));
vi.mock('../hooks/use-ecosystem-motion', () => ({ useEcosystemMotion: vi.fn() }));

describe('AboutSection', () => {
  it('preserves the about destination and gives each of the three acts an accessible heading', () => {
    const { container } = render(<AboutSection />);
    const section = container.querySelector<HTMLElement>('#laboratorio');
    expect(container.querySelectorAll('#laboratorio')).toHaveLength(1);
    expect(section).toHaveAccessibleName(aboutCopy.question);
    expect(container.querySelectorAll('[data-about-act]')).toHaveLength(3);

    const decompose = container.querySelector<HTMLElement>('[data-about-act="decompose"]')!;
    const connect = container.querySelector<HTMLElement>('[data-about-act="connect"]')!;
    const transform = container.querySelector<HTMLElement>('[data-about-act="transform"]')!;
    expect(within(decompose).getByRole('heading', { name: aboutCopy.question, level: 2 })).toBeInTheDocument();
    expect(within(decompose).getByRole('heading', { name: aboutCopy.declaration })).toBeInTheDocument();
    expect(within(connect).getByRole('heading', { name: /Crear\. Explorar\.\s*Conectar\./i })).toBeInTheDocument();
    expect(within(transform).getByRole('heading', { name: aboutCopy.finale })).toBeInTheDocument();
  });

  it('starts with Crear as the only selected concept and links its control to the editorial panel', () => {
    render(<AboutSection />);
    const initial = aboutConcepts[0];
    const selected = screen.getByRole('button', { name: initial.label, pressed: true });
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: initial.title, level: 3 })).toBeInTheDocument();
    expect(screen.getByText(initial.description)).toBeVisible();

    const panel = screen.getByRole('region', { name: initial.title });
    expect(selected).toHaveAttribute('aria-controls', panel.id);
    for (const concept of aboutConcepts) {
      const control = screen.getByRole('button', { name: concept.label });
      expect(control).toHaveAttribute('type', 'button');
      expect(control).toHaveAttribute('aria-controls', panel.id);
      expect(control.tabIndex).toBe(0);
    }
  });

  it('changes the selected editorial through each concept without accumulating active controls', () => {
    render(<AboutSection />);
    for (const concept of [...aboutConcepts.slice(1), aboutConcepts[0]]) {
      const control = screen.getByRole('button', { name: concept.label });
      control.focus();
      expect(control).toHaveFocus();
      fireEvent.click(control);

      expect(screen.getAllByRole('button', { pressed: true })).toEqual([control]);
      expect(screen.getByRole('region', { name: concept.title })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: concept.title, level: 3 })).toBeInTheDocument();
      expect(screen.getByText(concept.description)).toBeVisible();
      for (const other of aboutConcepts.filter(({ id }) => id !== concept.id)) {
        expect(screen.queryByRole('heading', { name: other.title })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: other.label })).toHaveAttribute('aria-pressed', 'false');
      }
    }
  });

  it('shows the provisional copy notice and preserves the link to the home exhibitions', () => {
    render(<AboutSection />);
    expect(screen.getByText(aboutCopy.introduction)).toBeVisible();
    expect(screen.getByText(aboutCopy.pendingNotice)).toBeVisible();
    expect(screen.getByRole('link', { name: aboutCopy.exhibitionLinkLabel })).toHaveAttribute('href', '#exposiciones');
  });
});
