import Link from 'next/link';
import { AboutSection } from '@/features/about';
import { ExhibitionCardSwap } from '@/features/exhibitions';
import { ExhibitionFeatured } from '@/features/exhibitions/components/exhibition-featured';
import { demoArtworks } from '@/features/exhibitions/data/demo-artworks';
import { exhibitionCopy } from '@/features/exhibitions/data/exhibition-copy';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import { ContinuousBackground } from '@/shared/ui/continuous-background/continuous-background';
import { homeCopy } from '../data/home-copy';
import '@/features/exhibitions/styles/exhibition-card-swap.css';
import '@/features/exhibitions/styles/exhibition-featured.css';
import { LaboratorySection } from '@/features/laboratory';
import '@/features/laboratory/styles/laboratory.css';
import '@/features/laboratory/styles/laboratory-circular-carousel.css';
import '@/features/laboratory/styles/laboratory-detail.css';
import { HomeNavigation } from './home-navigation';
import { HomeIdentity } from './home-identity';
import { HomeAtmosphere } from './home-atmosphere';
export function HomeLanding() {
  return (
    <>
      <HomeNavigation />
      <HomeIdentity />
      <ContinuousBackground />
      <main id="inicio" className="home-page">
        <section className="home-hero" aria-label={`Portada de ${homeCopy.name}`}>
          <HomeAtmosphere />
          <a href="#laboratorio" className="home-hero__scroll font-mono font-medium">{homeCopy.scrollLabel} <span><ArrowIcon direction="down" /></span></a>
        </section>
        <AboutSection />
        <section id="exposiciones" className="home-featured" aria-labelledby="home-featured-title">
          <ExhibitionFeatured />
          <div className="home-featured__gallery">
            <p className="home-featured__eyebrow font-mono font-normal">{homeCopy.exhibitionsLabel}</p>
            <h2 id="home-featured-title">{exhibitionCopy.title}</h2>
            <p className="home-featured__description">{exhibitionCopy.description}</p>
            <p className="home-featured__notice">{exhibitionCopy.demoLabel}</p>
            <ExhibitionCardSwap artworks={demoArtworks} headingLevel={3} />
            <Link className="home-link home-link--light font-mono font-medium" href="/exposiciones">{homeCopy.exhibitionsLink} <span><ArrowIcon direction="up-right" /></span></Link>
          </div>
        </section>
        <LaboratorySection />
        {/* <ContactSection /> */}
        <footer className="home-footer font-mono font-normal">
          <span>{homeCopy.name} © {new Date().getFullYear()}</span>
          <a href="#contacto">{homeCopy.contactLink} <ArrowIcon direction="up-right" /></a>
          <span id="nosotros">{homeCopy.principles}</span>
        </footer>
      </main>
    </>
  );
}
