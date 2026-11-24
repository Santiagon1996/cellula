import { render, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AboutSection } from './about-section';
import { aboutCopy } from '../data/about-content';

vi.mock('../hooks/use-about-scroll', () => ({ useAboutScroll: vi.fn() }));

describe('About identity composition', () => {
  it('follows the introduction with the approved identity copy without activating future sections', () => {
    const { container } = render(<AboutSection />);
    const introduction = container.querySelector('[data-chromatic-intro]')!;
    const identity = container.querySelector<HTMLElement>('[data-about-identity]')!;

    expect(introduction.compareDocumentPosition(identity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(identity).toHaveAttribute('data-editorial-status', 'user-approved');
    expect(within(identity).getByRole('heading', { name: aboutCopy.definitionTitle, level: 2 })).toBeInTheDocument();
    expect(within(identity).getByText(aboutCopy.decomposeDescription)).toBeInTheDocument();
    expect(within(identity).getByText(aboutCopy.connectDescription)).toBeInTheDocument();
    expect(within(identity).getAllByText(/.+/)).toHaveLength(3);
    expect(container.querySelector('[data-about-act="connect"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-about-act="transform"]')).not.toBeInTheDocument();
  });
});
