import type { MouseEventHandler } from 'react';
import Image from 'next/image';
import styles from './home-navigation.module.css';

// Add a destination here when each pending section exists; no placeholder routes.
const homeSections = [
  { label: 'HOME', href: '#inicio' },
  { label: 'QUÉ ES CÉLULA', href: '#laboratorio' },
  { label: 'EXPOSICIONES', href: '#exposiciones' },
  { label: 'LAB', href: null },
  { label: 'QUÉ HACEMOS', href: null },
  { label: 'CONTACTO', href: '#contacto' },
] as const;

export function HomeNavigationContent({ onNavigate }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.introduction} data-nav-reveal>
        <Image
          className={styles.symbol}
          src="/home/celula-symbol.png"
          alt=""
          width={378}
          height={280}
          sizes="(max-width: 800px) 80px, 272px"
        />
        <p className={`${styles.kicker} font-mono font-normal`}>ARTE / CULTURA / EXPERIMENTACIÓN</p>
        <p className={styles.note}>Una plataforma en movimiento.</p>
      </div>
      <nav aria-label="Navegación principal">
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
                    {label}<span className={styles.arrow} aria-hidden="true">↗</span>
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
      <div className={`${styles.footer} font-mono font-normal`} data-nav-reveal>
        <span>DESDE EL MOVIMIENTO</span>
        <span>CÉLULA © {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
