import Link from 'next/link';
import { demoArtworks } from '../data/demo-artworks';
import { exhibitionCopy } from '../data/exhibition-copy';
import { ExhibitionCardSwap } from './exhibition-card-swap';
import { ExhibitionSlider } from './exhibition-slider';
import '../styles/exhibition.css';
import '../styles/exhibition-card-swap.css';

type ExhibitionPageProps = {
  preview?: boolean;
};

export function ExhibitionPage({ preview = false }: ExhibitionPageProps) {
  return (
    <main className="exhibition-page">
      <header className="exhibition-header">
        <Link href="/" className="exhibition-brand" aria-label="CÈL·LULA, volver al inicio">
          CÈL·LULA
        </Link>
        <nav className="exhibition-header__navigation font-medium" aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          {preview ? <Link href="/exposiciones">Exposiciones</Link> : <span aria-current="page">Exposiciones</span>}
        </nav>
      </header>

      <section className="exhibition-intro" aria-labelledby="exhibition-heading">
        <div>
          <p className="exhibition-eyebrow font-mono font-normal">
            <span aria-hidden="true" className="exhibition-eyebrow__dot" />
            {exhibitionCopy.demoLabel}
          </p>
          <h1 id="exhibition-heading">{exhibitionCopy.title}</h1>
        </div>
        <p className="exhibition-intro__description font-mono font-normal">{exhibitionCopy.description}</p>
      </section>

      {preview ? (
        <>
          <p className="exhibition-card-swap-preview font-mono font-normal">
            Prototipo CardSwap · Navegación manual. <Link href="/exposiciones">Ver la galería actual</Link>
          </p>
          <ExhibitionCardSwap artworks={demoArtworks} />
        </>
      ) : (
        <ExhibitionSlider artworks={demoArtworks} />
      )}

      <footer className="exhibition-footer font-mono font-normal">
        <span>{exhibitionCopy.demoNotice}</span>
        <span>{exhibitionCopy.footer}</span>
      </footer>
    </main>
  );
}
