export type ContactPanelId = 'conversemos' | 'colaboremos' | 'conectemos';

export type ContactChannels = Readonly<{
  email: string | null;
  socials: readonly Readonly<{
    label: string;
    url: string;
  }>[];
}>;

export type ContactPanelContent = Readonly<{
  id: ContactPanelId;
  index: '01' | '02' | '03';
  label: string;
  kicker: string;
  title: string;
  description: string;
  actionLabel: string;
}>;

export type ContactAction = Readonly<{
  label: string;
  href: string;
  external: boolean;
}>;
