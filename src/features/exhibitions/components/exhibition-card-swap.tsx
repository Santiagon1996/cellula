'use client';

import { useCallback, useId, useRef, useState } from 'react';
import CardSwap, { Card, type CardSwapHandle } from './CardSwap';
import type { ExhibitionArtwork } from '../types';
import { ExhibitionArtworkCard } from './exhibition-artwork-card';
import { ExhibitionCardSwapControls } from './exhibition-card-swap-controls';

type ExhibitionCardSwapProps = {
  artworks: readonly ExhibitionArtwork[];
  headingLevel?: 2 | 3;
};

export function ExhibitionCardSwap({ artworks, headingLevel = 2 }: ExhibitionCardSwapProps) {
  const deckRef = useRef<CardSwapHandle>(null);
  const id = useId();
  const [activeId, setActiveId] = useState<string | null>(() => artworks[0]?.id ?? null);
  const [details, setDetails] = useState(false);
  const onChange = useCallback((index: number) => {
    setActiveId(artworks[index]?.id ?? null);
    setDetails(false);
  }, [artworks]);

  if (!artworks.length) {
    return <p className="exhibition-card-swap__empty font-mono font-normal">La selección estará disponible próximamente.</p>;
  }

  const current = Math.max(0, artworks.findIndex((artwork) => artwork.id === activeId));
  const artwork = artworks[current];
  const deckId = `${id}-deck`;
  const detailId = (artworkId: string) => `${id}-detail-${encodeURIComponent(artworkId)}`;

  return (
    <section
      className="exhibition-card-swap"
      aria-label="Obras de Exhibition"
      aria-roledescription="carrusel"
      data-active-id={artwork.id}
      data-details={details}
    >
      <p id={`${id}-instructions`} className="exhibition-card-swap__hint font-mono font-normal">
        Arrastra o desliza para explorar. Usa las flechas para cambiar de obra y «Ver ficha» para descubrirla.
      </p>
      <div className="exhibition-card-swap__stage">
        <CardSwap
          ref={deckRef}
          id={deckId}
          ariaLabel="Galería de obras; usa las flechas para navegar"
          ariaDescribedBy={`${id}-instructions`}
          className="exhibition-card-swap__deck"
          width={460}
          height={340}
          cardDistance={60}
          verticalDistance={70}
          depth={90}
          skewAmount={6}
          visibleCards={4}
          cardRadius={18}
          speed={1}
          bounce={0.35}
          parallax={0.5}
          hoverSpread={0.12}
          dim={0.5}
          autoplay={false}
          intro={false}
          draggable
          onChange={onChange}
          onCardClick={(index) => {
            if (artworks[index]?.id === artwork.id) setDetails(true);
          }}
        >
          {artworks.map((item, index) => (
            <Card key={item.id} className="exhibition-card-swap__card">
              <ExhibitionArtworkCard
                artwork={item}
                index={index}
                total={artworks.length}
                active={item.id === artwork.id}
                details={details && item.id === artwork.id}
                detailId={detailId(item.id)}
                headingLevel={headingLevel}
              />
            </Card>
          ))}
        </CardSwap>
      </div>
      <ExhibitionCardSwapControls
        current={current}
        total={artworks.length}
        title={artwork.title}
        deckId={deckId}
        detailId={detailId(artwork.id)}
        details={details}
        onPrevious={() => deckRef.current?.prev()}
        onNext={() => deckRef.current?.next()}
        onToggleDetails={() => setDetails((value) => !value)}
      />
      <p className="exhibition-card-swap__status" aria-live="polite" aria-atomic="true">
        {`Obra ${current + 1} de ${artworks.length}: ${artwork.title}`}
      </p>
    </section>
  );
}
