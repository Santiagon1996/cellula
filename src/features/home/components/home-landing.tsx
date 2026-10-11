import { HomeNavigation } from './home-navigation';

export function HomeLanding() {
  return (
    <>
      <HomeNavigation />
      <main id="inicio" className="home-page">
        <section className="home-hero" aria-labelledby="home-title">
          <div aria-hidden="true" className="home-hero__ambient" />
          <div aria-hidden="true" className="home-hero__hand" />
          <div aria-hidden="true" className="home-hero__veil" />
          <div className="home-hero__wordmark">
            <p className="home-hero__eyebrow">Espacio de arte y experimentación</p>
            <h1 id="home-title">CÉLULA</h1>
          </div>
          <a href="#laboratorio" className="home-hero__scroll">DESLIZA PARA DESCUBRIR <span aria-hidden="true">↓</span></a>
        </section>
        <section id="laboratorio" className="home-about" aria-labelledby="home-about-title">
          <div className="home-about__statement" aria-hidden="true">CREAR · EXPLORAR · CONECTAR</div>
          <div className="home-about__content">
            <p className="home-about__kicker">UNA PLATAFORMA EN MOVIMIENTO</p>
            <h2 id="home-about-title">¿QUÉ ES<br /><em>CÉLULA?</em></h2>
            <p>Un espacio para la creación, el arte y la experimentación.</p>
            <a className="home-link" href="#nosotros">DESCUBRE CÉLULA <span aria-hidden="true">↗</span></a>
          </div>
        </section>
        <section id="exposiciones" className="home-featured" aria-labelledby="home-featured-title">
          <p className="home-featured__eyebrow">EXPOSICIONES / ARTISTAS</p>
          <h2 id="home-featured-title">DESTACADO<br />DEL MES</h2>
          <p>Próximamente</p>
          <a className="home-link home-link--light" href="#contacto">VER MÁS <span aria-hidden="true">↗</span></a>
        </section>
        <footer id="contacto" className="home-footer">
          <span>CÉLULA © {new Date().getFullYear()}</span>
          <span>CONTACTO · PRÓXIMAMENTE</span>
          <span id="nosotros">ARTE / CULTURA / EXPERIMENTACIÓN</span>
        </footer>
      </main>
    </>
  );
}
