import Image from 'next/image';
import type { Laboratory, LaboratorySelection } from '../types';

type LaboratoryCardProps = {
  laboratory: Laboratory;
  index: number;
  copy?: boolean;
  onSelect: (selection: LaboratorySelection) => void;
};

export function LaboratoryCard({ laboratory, index, copy = false, onSelect }: LaboratoryCardProps) {
  const content = (
    <>
      <div className="laboratory-card__media" data-lab-media data-flip-id={`laboratory-${laboratory.id}`}>
        <Image {...laboratory.coverImage} alt={laboratory.coverImage.alt} sizes="(max-width: 700px) 84vw, 440px" draggable={false} className="laboratory-card__image" />
      </div>
      <div className="laboratory-card__caption" aria-hidden="true">
        <span className="laboratory-card__category font-mono font-normal">{laboratory.category}</span>
        <span className="laboratory-card__title font-medium">{laboratory.title}</span>
        <span className="laboratory-card__description">{laboratory.shortDescription}</span>
        <span className="laboratory-card__open font-mono font-normal">EXPLORAR <span aria-hidden="true">&#8599;</span></span>
      </div>
    </>
  );

  return (
    <article className="laboratory-card" data-laboratory-card data-lab-index={index} data-copy={copy} aria-hidden={copy || undefined}>
      {copy ? <div className="laboratory-card__button">{content}</div> : (
        <button
          type="button" className="laboratory-card__button" aria-label={`Abrir laboratorio: ${laboratory.title}`}
          onClick={(event) => {
            const source = event.currentTarget.querySelector<HTMLElement>('[data-lab-media]');
            if (source) onSelect({ laboratory, source, trigger: event.currentTarget });
          }}
        >{content}</button>
      )}
    </article>
  );
}
