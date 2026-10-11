'use client';

import { useState } from 'react';

const homeSections = [
  { label: 'HOME', href: '#inicio' },
  { label: 'QUÉ ES CÉLULA', href: '#laboratorio' },
  { label: 'DESTACADO', href: '#exposiciones' },
  { label: 'LAB', href: '#laboratorio' },
  { label: 'QUÉ HACEMOS', href: '#laboratorio' },
  { label: 'CONTACTO', href: '#contacto' },
] as const;

export function HomeNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="home-nav">
      <div className="home-nav__brand-spacer" aria-hidden="true" />
      <button
        type="button"
        className="home-nav__toggle"
        aria-expanded={isOpen}
        aria-controls="home-navigation-panel"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? '✕' : 'MENÚ'}
      </button>
      <nav
        id="home-navigation-panel"
        className={`home-nav__panel ${isOpen ? 'is-open' : ''}`}
        aria-label="Navegación principal"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {homeSections.map((item) => (
          <a key={item.label} href={item.href} onClick={() => setIsOpen(false)}>{item.label}</a>
        ))}
      </nav>
    </header>
  );
}
