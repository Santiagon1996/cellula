import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { contactCopy, contactPanels } from '../data/contact-content';
import type { ContactChannels } from '../types';
import { ContactSection } from './contact-section';

vi.mock('../hooks/use-contact-motion', () => ({ useContactMotion: vi.fn() }));

const configuredChannels: ContactChannels = {
  email: 'hello@artcollective.org',
  socials: [{ label: 'Instagram', url: 'https://www.instagram.com/confirmed-test-profile/' }],
};

function expectSelected(index: number) {
  const content = contactPanels[index];
  const selected = screen.getByRole('tab', { name: content.label, selected: true });
  const panel = screen.getByRole('tabpanel', { name: content.label });

  expect(screen.getAllByRole('tab', { selected: true })).toEqual([selected]);
  expect(screen.getAllByRole('tabpanel')).toEqual([panel]);
  expect(selected).toHaveAttribute('aria-controls', panel.id);
  expect(selected.tabIndex).toBe(0);
  expect(panel).toHaveAttribute('aria-hidden', 'false');
  expect(panel).not.toHaveAttribute('inert');
  expect(within(panel).getByRole('heading', {
    name: (name) => name.replace(/\s+/g, ' ') === content.title.replace(/\s+/g, ' '),
    level: 3,
  })).toBeInTheDocument();
  expect(within(panel).getByText(content.description)).toBeInTheDocument();

  for (const other of contactPanels.filter(({ id }) => id !== content.id)) {
    const tab = screen.getByRole('tab', { name: other.label });
    const inactive = document.getElementById(tab.getAttribute('aria-controls')!)!;
    expect(tab).toHaveAttribute('aria-selected', 'false');
    expect(tab.tabIndex).toBe(-1);
    expect(inactive).toHaveAttribute('aria-hidden', 'true');
    expect(inactive).toHaveAttribute('inert');
  }

  return { selected, panel };
}

describe('ContactSection', () => {
  it('starts with a named section, three accessible tabs and a single active editorial panel', () => {
    render(<ContactSection />);
    const section = screen.getByRole('region', { name: contactCopy.introTitle });
    expect(section).toHaveAttribute('id', 'contacto');
    expect(within(section).getByRole('heading', { name: contactCopy.introTitle, level: 2 })).toBeInTheDocument();
    expect(within(section).getByText(contactCopy.narrative)).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: contactCopy.navigationLabel })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveAttribute('type', 'button');
    expectSelected(0);
  });

  it('includes legible active content and native controls in its first server render', () => {
    const markup = renderToString(<ContactSection />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    const section = document.getElementById('contacto')!;
    const active = section.querySelector<HTMLElement>('[role="tabpanel"][aria-hidden="false"]')!;

    expect(section.textContent).toContain(contactCopy.introTitle);
    expect(section.textContent).toContain(contactCopy.narrative);
    expect(active.textContent).toContain(contactPanels[0].description);
    expect(active.closest('[hidden], [inert], [aria-hidden="true"]')).toBeNull();
    expect(active.style.opacity).not.toBe('0');
    expect(active.style.visibility).not.toBe('hidden');
    expect(section.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1);
    expect(section.querySelectorAll('[role="tabpanel"][aria-hidden="false"]')).toHaveLength(1);
    expect(section.querySelectorAll('[role="tabpanel"][aria-hidden="true"][inert]')).toHaveLength(2);

    for (const tab of section.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
      expect(tab.type).toBe('button');
      expect(document.getElementById(tab.getAttribute('aria-controls')!)).not.toBeNull();
    }
  });

  it('selects all three panels through the explicit controls and keeps inactive panels inert', () => {
    render(<ContactSection />);
    for (const index of [1, 2, 0]) {
      fireEvent.click(screen.getByRole('tab', { name: contactPanels[index].label }));
      expectSelected(index);
    }
  });

  it('supports arrow wrapping, Home and End while moving focus to the selected tab', () => {
    render(<ContactSection />);
    screen.getByRole('tab', { name: 'CONVERSEMOS' }).focus();

    for (const [key, index] of [
      ['End', 2],
      ['ArrowRight', 0],
      ['ArrowLeft', 2],
      ['Home', 0],
      ['ArrowRight', 1],
      ['ArrowLeft', 0],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key });
      expect(expectSelected(index).selected).toHaveFocus();
    }

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(expectSelected(0).selected).toHaveFocus();
  });

  it('keeps the latest requested selection after a burst of rapid clicks', () => {
    render(<ContactSection />);
    const tabs = screen.getAllByRole('tab');
    act(() => {
      for (const index of [1, 2, 0, 2, 1, 2]) fireEvent.click(tabs[index]);
    });
    expectSelected(2);
  });

  it('shows pending channel messages without making placeholder contact links', () => {
    const { container } = render(<ContactSection />);
    expect(within(expectSelected(0).panel).getByText(contactCopy.pendingEmail)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'COLABOREMOS' }));
    expect(within(expectSelected(1).panel).getByText(contactCopy.pendingEmail)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'CONECTEMOS' }));
    expect(within(expectSelected(2).panel).getByText(contactCopy.pendingSocials)).toBeInTheDocument();
    expect(container.querySelector('a[href^="mailto:"], a[href^="http"], a[href="#"]')).toBeNull();
    expect(screen.getByRole('link', { name: contactCopy.backToTop })).toHaveAttribute('href', '#inicio');
  });

  it('exposes the configured email only in the active email panel', () => {
    render(<ContactSection channels={configuredChannels} />);
    expect(screen.getByRole('link', { name: 'ESCRÍBENOS' })).toHaveAttribute('href', 'mailto:hello@artcollective.org');
    expect(screen.queryByRole('link', { name: 'PROPONER UNA IDEA' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Instagram/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'COLABOREMOS' }));
    expect(screen.getByRole('link', { name: 'PROPONER UNA IDEA' })).toHaveAttribute(
      'href', `mailto:hello@artcollective.org?subject=${encodeURIComponent(contactCopy.collaborationSubject)}`,
    );
    expect(screen.queryByRole('link', { name: 'ESCRÍBENOS' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Instagram/ })).not.toBeInTheDocument();
  });

  it('exposes safe external social links only when their panel is selected', () => {
    const { container } = render(<ContactSection channels={configuredChannels} />);
    const hiddenSocialLink = container.querySelector('a[href^="https:"]')!;
    expect(hiddenSocialLink.closest('[inert][aria-hidden="true"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'CONECTEMOS' }));
    const social = screen.getByRole('link', { name: /^Instagram\s*\(abre una pestaña nueva\)$/ });
    expect(social).toHaveAttribute('href', configuredChannels.socials[0].url);
    expect(social).toHaveAttribute('target', '_blank');
    expect(social).toHaveAttribute('rel', 'noopener noreferrer');
    expect(social.closest('[inert]')).toBeNull();
    expect(screen.queryByRole('link', { name: 'ESCRÍBENOS' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'PROPONER UNA IDEA' })).not.toBeInTheDocument();
    for (const email of container.querySelectorAll('a[href^="mailto:"]')) {
      expect(email.closest('[inert][aria-hidden="true"]')).not.toBeNull();
    }
  });
});
