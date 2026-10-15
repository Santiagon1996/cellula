import type {
  ContactAction,
  ContactChannels,
  ContactPanelContent,
  ContactPanelId,
} from '../types';

export const contactCopy = {
  introTitle: '¿HACEMOS ALGO JUNTOS?',
  introLines: ['¿HACEMOS', 'ALGO', 'JUNTOS?'],
  narrative: 'TODA IDEA COMIENZA CON UN CONTACTO.',
  navigationLabel: 'Elige una forma de conectar con CÉLULA',
  sectionLabel: '05 / CONTACTO',
  sectionNote: 'EL PUNTO DE ENCUENTRO',
  stageLabel: 'UNA CONEXIÓN, MUCHAS FORMAS.',
  artCaption: 'PUNTOS DE ENCUENTRO',
  stageBaseline: 'CÉLULA / CONEXIONES EN POTENCIA',
  moduleNote: 'TRES FORMAS DE EMPEZAR. ELIGE LA TUYA.',
  finaleIndex: 'SIN UN GUIÓN PREVIO.',
  finaleLines: ['LO QUE VIENE', 'AÚN NO TIENE'],
  finaleEmphasis: 'FORMA.',
  finaleDescription: ['Y eso es lo que nos interesa.', 'Hagamos espacio para encontrarnos.'],
  backToTop: 'VOLVER AL PRINCIPIO',
  pendingEmail: 'Pronto abriremos este canal de contacto.',
  pendingSocials: 'Pronto compartiremos nuevas formas de encontrarnos.',
  collaborationSubject: 'Propuesta de colaboración — CÉLULA',
} as const;

export const contactPanels = [
  {
    id: 'conversemos',
    index: '01',
    label: 'CONVERSEMOS',
    kicker: 'UN PRIMER GESTO',
    title: 'ABRAMOS\nUNA CONVERSACIÓN.',
    description: 'Una pregunta, una intuición o algo que quieras compartir. Todo encuentro empieza por un primer gesto.',
    actionLabel: 'ESCRÍBENOS',
  },
  {
    id: 'colaboremos',
    index: '02',
    label: 'COLABOREMOS',
    kicker: 'UN PUNTO DE ENCUENTRO',
    title: 'TU IDEA.\nOTRA MIRADA.',
    description: 'Las ideas toman otra forma cuando se encuentran. Comparte una propuesta y exploremos lo que puede surgir.',
    actionLabel: 'PROPONER UNA IDEA',
  },
  {
    id: 'conectemos',
    index: '03',
    label: 'CONECTEMOS',
    kicker: 'OTRAS COORDENADAS',
    title: 'SIGAMOS\nEN CONTACTO.',
    description: 'La conversación puede continuar en otros lugares. Aquí reunimos nuestros canales para seguir cerca.',
    actionLabel: 'ENCONTRARNOS EN REDES',
  },
] as const satisfies readonly ContactPanelContent[];

// Add only confirmed official channels here. Pending channels never become links.
export const contactChannels: ContactChannels = {
  email: null,
  socials: [],
};

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

function isPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const labels = host.split('.');

  if (host.length > 253 || labels.length < 2) return false;
  if (labels.some((label) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))) return false;

  const suffix = labels.at(-1)!;
  if (!/^[a-z]{2,63}$/i.test(suffix) && !/^xn--[a-z\d-]+$/i.test(suffix)) return false;
  if (['localhost', 'local', 'internal', 'lan', 'home', 'test', 'invalid', 'example', 'onion'].includes(suffix)) return false;

  return !['example.com', 'example.net', 'example.org', 'home.arpa'].some(
    (reserved) => host === reserved || host.endsWith(`.${reserved}`),
  );
}

function getEmailHref(value: string | null): string | null {
  if (typeof value !== 'string' || hasControlCharacters(value)) return null;

  const email = value.trim();
  if (email.length > 254) return null;

  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const [mailbox, hostname] = parts;
  if (!mailbox || mailbox.length > 64 || !/^[a-z\d.!#$&'*+/=?^_`{|}~-]+$/i.test(mailbox)) return null;
  if (mailbox.startsWith('.') || mailbox.endsWith('.') || mailbox.includes('..')) return null;
  if (!isPublicHostname(hostname)) return null;

  // Encoding the mailbox prevents valid email punctuation from becoming headers.
  return `mailto:${encodeURIComponent(mailbox)}@${hostname.toLowerCase()}`;
}

function getSocialAction(social: ContactChannels['socials'][number]): ContactAction | null {
  if (typeof social?.label !== 'string' || typeof social?.url !== 'string') return null;
  const label = social.label.trim();
  if (!label || hasControlCharacters(label) || hasControlCharacters(social.url)) return null;

  try {
    const url = new URL(social.url.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!isPublicHostname(url.hostname)) return null;

    return { label, href: url.href, external: true };
  } catch {
    return null;
  }
}

export function getContactActions(
  panelId: ContactPanelId,
  channels: ContactChannels = contactChannels,
): readonly ContactAction[] {
  const panel = contactPanels.find(({ id }) => id === panelId);
  if (!panel || !channels) return [];

  if (panelId === 'conectemos') {
    if (!Array.isArray(channels.socials)) return [];
    const actions = channels.socials.map(getSocialAction).filter((action) => action !== null);
    return actions.filter((action, index) => actions.findIndex(({ href }) => href === action.href) === index);
  }

  const emailHref = getEmailHref(channels.email);
  if (!emailHref) return [];

  const href = panelId === 'colaboremos'
    ? `${emailHref}?subject=${encodeURIComponent(contactCopy.collaborationSubject)}`
    : emailHref;

  return [{ label: panel.actionLabel, href, external: false }];
}
