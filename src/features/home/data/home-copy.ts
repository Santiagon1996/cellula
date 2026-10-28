import { siteConfig } from '@/shared/config/site';

export const homeCopy = {
  name: siteConfig.name,
  title: `${siteConfig.name} — Laboratorio cultural`,
  category: 'LABORATORIO CULTURAL',
  principles: 'ARTE · PROCESO · COMUNIDAD',
  description: siteConfig.description,
  scrollLabel: 'DESLIZA PARA DESCUBRIR',
  exhibitionsLabel: 'EXPOSICIONES / ARTISTAS',
  exhibitionsLink: 'EXPLORAR EXPOSICIONES',
  contactLink: 'IR A CONTACTO',
} as const;
