'use client';

import { useState } from 'react';
import { navigation } from '@/shared/config/navigation';

export function HomeNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="home-nav">
      <a className="home-nav__brand" href="#inicio" aria-label="CÉLULA — inicio">CÉLULA</a>
      <button
        type="button"
        className="home-nav__toggle"
        aria-expanded={isOpen}
        aria-controls="home-navigation-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'CERRAR' : 'MENÚ'}
      </button>
      <nav id="home-navigation-panel" className={`home-nav__panel ${isOpen ? 'is-open' : ''}`} aria-label="Navegación principal" aria-hidden={!isOpen}>
        {navigation.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setIsOpen(false)} tabIndex={isOpen ? 0 : -1}>{item.label}</a>
        ))}
      </nav>
    </header>
  );
}
