import Link from 'next/link';
import { AboutSection } from '@/features/about';
import { ExhibitionSlider } from '@/features/exhibitions';
import { demoArtworks } from '@/features/exhibitions/data/demo-artworks';
import '@/features/exhibitions/styles/exhibition.css';
import { LaboratorySection } from '@/features/laboratory';
import '@/features/laboratory/styles/laboratory.css';
import '@/features/laboratory/styles/laboratory-carousel.css';
import '@/features/laboratory/styles/laboratory-detail.css';
import { HomeNavigation } from './home-navigation';
import { HomeIdentity } from './home-identity';
import { HomeAtmosphere } from './home-atmosphere';
export function HomeLanding() {
  return (
    <>
      <HomeNavigation />
      <HomeIdentity />
      <main id="inicio" className="home-page">
        <section className="home-hero" aria-label="Portada de Célula">
          <HomeAtmosphere />
          <a href="#laboratorio" className="home-hero__scroll font-mono font-normal">DESLIZA PARA DESCUBRIR <span aria-hidden="true">↓</span></a>
        </section>
        <AboutSection />
        <section id="exposiciones" className="home-featured" aria-labelledby="home-featured-title">
          <p className="home-featured__eyebrow font-mono font-normal">EXPOSICIONES / ARTISTAS</p>
          <h2 id="home-featured-title">DESTACADO<br />DEL MES</h2>
          <ExhibitionSlider artworks={demoArtworks} />
          <Link className="home-link home-link--light font-mono font-normal" href="/exposiciones">VER MÁS <span aria-hidden="true">↗</span></Link>
        </section>
        <LaboratorySection />
        <footer id="contacto" className="home-footer font-mono font-normal">
          <span>CÉLULA © {new Date().getFullYear()}</span>
          <span>CONTACTO · PRÓXIMAMENTE</span>
          <span id="nosotros">ARTE / CULTURA / EXPERIMENTACIÓN</span>
        </footer>
      </main>
    </>
  );
}
