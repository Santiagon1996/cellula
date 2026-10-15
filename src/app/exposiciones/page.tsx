import type { Metadata } from 'next';
import Link from 'next/link';
import { ExhibitionSlider } from '@/features/exhibitions/components/exhibition-slider';
import { demoArtworks } from '@/features/exhibitions/data/demo-artworks';
import '@/features/exhibitions/styles/exhibition.css';

export const metadata: Metadata = {
  title: 'Exposiciones — CÉLULA',
  description:
    'Una selección de estudio para explorar imágenes, detenerse en una obra y descubrir sus detalles.',
};

export default function ExhibitionsPage() {
  return (
    <main className="exhibition-page">
      <header className="exhibition-header">
        <Link href="/" className="exhibition-brand" aria-label="Célula, volver al inicio">
          Cél·ula
        </Link>
        <nav className="exhibition-header__navigation font-medium" aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Exposiciones</span>
        </nav>
      </header>

      <section className="exhibition-intro" aria-labelledby="exhibition-heading">
        <div>
          <p className="exhibition-eyebrow font-mono font-normal">
            <span aria-hidden="true" className="exhibition-eyebrow__dot" />
            Selección de estudio
          </p>
          <h1 id="exhibition-heading">
            Una pausa <em>para mirar.</em>
          </h1>
        </div>
        <p className="exhibition-intro__description">
          Formas que se encuentran. Colores que conversan.
          <br />
          Desliza las obras y detente en la que te llame.
        </p>
      </section>

      <ExhibitionSlider artworks={demoArtworks} />

      <footer className="exhibition-footer font-mono font-normal">
        <span>Obras de demostración</span>
        <span>Un espacio para la creación, el arte y la experimentación.</span>
      </footer>
    </main>
  );
}
