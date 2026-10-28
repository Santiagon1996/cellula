import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AboutEcosystem } from '@/features/about/components/about-ecosystem';
import { aboutConcepts, aboutCopy } from '@/features/about/data/about-content';

vi.mock('@/features/about/hooks/use-ecosystem-motion', () => ({ useEcosystemMotion: vi.fn() }));

describe('About living system', () => {
  it('renders the initial editorial and associated values in the server markup', () => {
    const document = new DOMParser().parseFromString(renderToString(<AboutEcosystem />), 'text/html');
    expect(document.querySelector('h2')?.textContent).toBe(aboutCopy.systemTitle);
    expect(document.body.textContent).toContain(aboutCopy.introduction);
    const selected = document.querySelector('button[aria-pressed="true"]')!;
    expect(selected.textContent).toContain(aboutConcepts[0].label);
    const panel = document.getElementById(selected.getAttribute('aria-controls')!)!;
    expect(panel.textContent).toContain(aboutConcepts[0].description);
    expect([...panel.querySelectorAll('li')].map((item) => item.textContent)).toEqual(aboutConcepts[0].values);
  });

  it('keeps every concept accessible and updates only the selected description and values', () => {
    const { container } = render(<AboutEcosystem />);
    for (const concept of [...aboutConcepts.slice(1), aboutConcepts[0]]) {
      const button = screen.getByRole('button', { name: concept.label });
      button.focus();
      fireEvent.click(button);

      expect(button).toHaveFocus();
      expect(screen.getAllByRole('button', { pressed: true })).toEqual([button]);
      expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2);
      const panel = screen.getByRole('region', { name: concept.title });
      expect(button).toHaveAttribute('aria-controls', panel.id);
      expect(within(panel).getByText(concept.description)).toBeVisible();
      const list = within(panel).getByRole('list', { name: aboutCopy.conceptValuesLabel });
      expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(concept.values);
      expect(container.querySelector('[data-about-act="connect"]')).toHaveAttribute('data-active-concept', concept.id);
    }
    expect(container.querySelectorAll('[data-about-node]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-about-connection]')).toHaveLength(3);
  });

  it('uses unique panel IDs when multiple instances are rendered', () => {
    render(<><AboutEcosystem /><AboutEcosystem /></>);
    const controls = screen.getAllByRole('button', { name: aboutConcepts[0].label });
    const targets = controls.map((button) => button.getAttribute('aria-controls'));
    expect(new Set(targets).size).toBe(2);
    for (const target of targets) expect(document.getElementById(target!)).toBeInTheDocument();
  });
});
