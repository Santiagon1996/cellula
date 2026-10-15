import { describe, expect, it } from 'vitest';
import type { ContactChannels, ContactPanelId } from '../types';
import { contactChannels, contactCopy, contactPanels, getContactActions } from './contact-content';

const channelsWithEmail = (email: string | null): ContactChannels => ({ email, socials: [] });
const channelsWithSocial = (url: string, label = 'Canal de prueba'): ContactChannels => ({
  email: null,
  socials: [{ label, url }],
});

describe('contact editorial content', () => {
  it('provides three distinct, ordered editorial states', () => {
    expect(contactPanels.map(({ id, index, label }) => ({ id, index, label }))).toEqual([
      { id: 'conversemos', index: '01', label: 'CONVERSEMOS' },
      { id: 'colaboremos', index: '02', label: 'COLABOREMOS' },
      { id: 'conectemos', index: '03', label: 'CONECTEMOS' },
    ]);
    expect(new Set(contactPanels.map(({ title }) => title)).size).toBe(3);
    for (const panel of contactPanels) {
      expect(panel.kicker.trim()).not.toBe('');
      expect(panel.description.trim()).not.toBe('');
      expect(panel.actionLabel.trim()).not.toBe('');
    }
    expect(contactCopy.introTitle).toBe('¿HACEMOS ALGO JUNTOS?');
    expect(contactCopy.narrative).toBe('TODA IDEA COMIENZA CON UN CONTACTO.');
    expect(contactCopy.navigationLabel).not.toBe('');
  });

  it('keeps unconfirmed contact details pending without producing placeholder links', () => {
    expect(contactChannels).toEqual({ email: null, socials: [] });
    for (const { id } of contactPanels) expect(getContactActions(id)).toEqual([]);
    expect(contactCopy.pendingEmail).not.toBe('');
    expect(contactCopy.pendingSocials).not.toBe('');
  });
});

describe('contact email actions', () => {
  it('trims a configured address and gives the collaboration panel a safely encoded subject', () => {
    const channels = channelsWithEmail('  Hola@collective.art  ');
    expect(getContactActions('conversemos', channels)).toEqual([
      { label: 'ESCRÍBENOS', href: 'mailto:Hola@collective.art', external: false },
    ]);
    expect(getContactActions('colaboremos', channels)).toEqual([
      {
        label: 'PROPONER UNA IDEA',
        href: `mailto:Hola@collective.art?subject=${encodeURIComponent(contactCopy.collaborationSubject)}`,
        external: false,
      },
    ]);
    expect(getContactActions('conectemos', channels)).toEqual([]);
  });

  it('encodes mailbox punctuation so it cannot introduce additional mailto headers', () => {
    const [action] = getContactActions('conversemos', channelsWithEmail('hello?bcc=other@collective.art'));
    expect(action.href).toBe('mailto:hello%3Fbcc%3Dother@collective.art');
    expect(action.href).not.toContain('?bcc=');
  });

  it.each([
    '',
    'not an address',
    'hello@localhost',
    'hello@example.com',
    'hello@collective.invalid',
    'hello@collective.art?bcc=other@collective.art',
    'hello@collective.art\r\nBcc:other@collective.art',
    '\nhello@collective.art',
    'hello%0d%0aBcc=other@collective.art',
    'hello..there@collective.art',
    '.hello@collective.art',
    'hello.@collective.art',
  ])('does not create links for invalid or injected email %j', (email) => {
    expect(getContactActions('conversemos', channelsWithEmail(email))).toEqual([]);
    expect(getContactActions('colaboremos', channelsWithEmail(email))).toEqual([]);
  });
});

describe('contact social actions', () => {
  it('uses trimmed HTTPS links and their accessible labels only in the social panel', () => {
    const channels = channelsWithSocial('  https://www.instagram.com/confirmed-profile/  ', '  Instagram  ');
    expect(getContactActions('conectemos', channels)).toEqual([
      { label: 'Instagram', href: 'https://www.instagram.com/confirmed-profile/', external: true },
    ]);
    expect(getContactActions('conversemos', channels)).toEqual([]);
  });

  it.each([
    '',
    '#',
    '/pending',
    'javascript:alert(1)',
    'data:text/html,hello',
    'http://www.instagram.com/profile/',
    'https://localhost/profile',
    'https://contact.local/profile',
    'https://private.internal/profile',
    'https://127.0.0.1/profile',
    'https://[::1]/profile',
    'https://192.168.1.2/profile',
    'https://example.com/profile',
    'https://social.example.org/profile',
    'https://collective.test/profile',
    'https://user:password@www.instagram.com/profile',
    'https://www.instagram.com:8443/profile',
    'https://www.insta\ngram.com/profile',
  ])('does not create links for unsafe, local or placeholder URL %j', (url) => {
    expect(getContactActions('conectemos', channelsWithSocial(url))).toEqual([]);
  });

  it('ignores unlabeled channels and deduplicates the normalized URLs', () => {
    const channels: ContactChannels = {
      email: null,
      socials: [
        { label: ' ', url: 'https://www.instagram.com/confirmed-profile/' },
        { label: 'Instagram', url: 'https://www.instagram.com/confirmed-profile/' },
        { label: 'Repeated', url: '  https://www.instagram.com/confirmed-profile/  ' },
      ],
    };
    expect(getContactActions('conectemos', channels)).toEqual([
      { label: 'Instagram', href: 'https://www.instagram.com/confirmed-profile/', external: true },
    ]);
  });

  it('does not expose any action for an unknown panel', () => {
    expect(getContactActions('unknown' as ContactPanelId, channelsWithEmail('hello@collective.art'))).toEqual([]);
  });
});
