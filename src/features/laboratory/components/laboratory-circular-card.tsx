import Image from 'next/image';
import { useId } from 'react';
import { ArrowIcon } from '@/shared/ui/arrow-icon';
import { laboratoryCopy } from '../data/laboratory-copy';
import type { Laboratory, LaboratorySelection } from '../types';

type Props = {
  laboratory: Laboratory;
  index: number;
  total: number;
  active: boolean;
  blocked: boolean;
  onSelect: (selection: LaboratorySelection) => void;
};

export function LaboratoryCircularCard({ laboratory, index, total, active, blocked, onSelect }: Props) {
  const descriptionId = useId();
  return (
    <article
      className="laboratory-circular-card"
      data-circular-card
      data-lab-id={laboratory.id}
      data-active={active}
      role="group"
      aria-roledescription="diapositiva"
      aria-label={`${index + 1} de ${total}`}
    >
      <button
        type="button"
        className="laboratory-circular-card__button"
        tabIndex={active ? 0 : -1}
        aria-disabled={blocked || undefined}
        aria-current={active ? 'true' : undefined}
        aria-label={`${active ? laboratoryCopy.explore : laboratoryCopy.selectStudy}: ${laboratory.title}`}
        aria-describedby={descriptionId}
        onClick={(event) => {
          if (blocked) return;
          const source = event.currentTarget.querySelector<HTMLElement>('[data-lab-media]');
          if (source) onSelect({ laboratory, source, trigger: event.currentTarget });
        }}
      >
        <div className="laboratory-circular-card__media" data-lab-media data-flip-id={`laboratory-${laboratory.id}`}>
          <Image
            {...laboratory.coverImage}
            alt={laboratory.coverImage.alt}
            className="laboratory-circular-card__image"
            sizes="(max-width: 767px) 84vw, 360px"
            draggable={false}
          />
          <span className="laboratory-circular-card__frost" aria-hidden="true" />
        </div>
        <span className="laboratory-circular-card__caption">
          <span className="laboratory-circular-card__category font-mono font-normal">{laboratory.category}</span>
          <span className="laboratory-circular-card__title font-sans font-medium">{laboratory.title}</span>
          <span id={descriptionId} className="laboratory-circular-card__description font-mono font-normal">{laboratory.shortDescription}</span>
          {laboratory.temporary && <span className="laboratory-circular-card__temporary font-mono font-normal">ESTUDIO TEMPORAL</span>}
          <span className="laboratory-circular-card__cta font-mono font-medium">{laboratoryCopy.explore}<span><ArrowIcon direction="up-right" /></span></span>
        </span>
      </button>
    </article>
  );
}
