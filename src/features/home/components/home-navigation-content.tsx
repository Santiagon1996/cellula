import type { MouseEventHandler } from 'react';
import styles from './home-navigation.module.css';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import { homeCopy } from '../data/home-copy';

// Add a destination here when each pending section exists; no placeholder routes.
const homeSections = [
  { label: 'HOME', href: '#inicio' },
  { label: `QUÉ ES ${homeCopy.name}`, href: '#que-es-celula' },
  { label: 'EXPOSICIONES', href: '#exposiciones' },
  { label: 'LAB', href: '#laboratorio' },
  { label: 'QUÉ HACEMOS', href: null },
  { label: 'CONTACTO', href: null },
] as const;

export function HomeNavigationContent({ onNavigate }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <div className={styles.content}>
      <nav className={styles.nav} aria-label="Navegación principal">
        <ol className={styles.links}>
          {homeSections.map((item, index) => {
            const label = (
              <>
                <span className={`${styles.number} font-mono font-normal`} aria-hidden="true">0{index + 1}</span>
                <span className={`${styles.label} font-medium`}>{item.label}</span>
              </>
            );
            return (
              <li key={item.label} className={styles.row} data-nav-row>
                {item.href ? (
                  <a className={styles.link} href={item.href} onClick={onNavigate}>
                    {label}<span className={styles.arrow}><ArrowIcon direction="up-right" /></span>
                  </a>
                ) : (
                  <span className={styles.link} aria-disabled="true">
                    {label}<span className={`${styles.pending} font-mono font-normal`}>PRÓXIMAMENTE</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
