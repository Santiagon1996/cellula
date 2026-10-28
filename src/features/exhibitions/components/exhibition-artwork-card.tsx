import Image from 'next/image';
import type { ExhibitionArtwork } from '../types';

type ExhibitionArtworkCardProps = {
  artwork: ExhibitionArtwork;
  index: number;
  total: number;
  active: boolean;
  details: boolean;
  detailId: string;
  headingLevel?: 2 | 3;
};

export function ExhibitionArtworkCard({ artwork, index, total, active, details, detailId, headingLevel = 2 }: ExhibitionArtworkCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <article
      className="exhibition-artwork-card"
      data-artwork-id={artwork.id}
      data-active={active}
      data-details={details}
      role="group"
      aria-roledescription="diapositiva"
      aria-label={`${index + 1} de ${total}: ${artwork.title}`}
    >
      <div className="exhibition-artwork-card__media">
        <Image
          src={artwork.src}
          alt={artwork.alt}
          fill
          loading={index === 0 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 75vw, 460px"
          className="exhibition-artwork-card__image"
          draggable={false}
        />
        <span className="exhibition-artwork-card__frost" aria-hidden="true" />
      </div>
      <div id={detailId} className="exhibition-artwork-card__detail">
        <p className="exhibition-artwork-card__technique font-mono font-normal">{artwork.technique}</p>
        <Heading className="exhibition-artwork-card__title">{artwork.title}</Heading>
        <p className="exhibition-artwork-card__description font-mono font-normal">{artwork.description}</p>
      </div>
    </article>
  );
}
