import { ArrowIcon } from '@/shared/ui/arrow-icon';

type ExhibitionCardSwapControlsProps = {
  current: number;
  total: number;
  title: string;
  deckId: string;
  detailId: string;
  details: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleDetails: () => void;
};

export function ExhibitionCardSwapControls({
  current,
  total,
  title,
  deckId,
  detailId,
  details,
  onPrevious,
  onNext,
  onToggleDetails,
}: ExhibitionCardSwapControlsProps) {
  return (
    <footer className="exhibition-card-swap__controls font-mono font-normal">
      <div className="exhibition-card-swap__position">
        <span className="exhibition-card-swap__counter" aria-hidden="true">
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <p className="exhibition-card-swap__active-title">{title}</p>
      </div>
      <div className="exhibition-card-swap__actions">
        <button
          type="button"
          className="exhibition-card-swap__information"
          aria-label={`${details ? 'Ocultar' : 'Mostrar'} información de la obra`}
          aria-expanded={details}
          aria-controls={detailId}
          onClick={onToggleDetails}
        >
          <span aria-hidden="true">{details ? 'Cerrar ficha' : 'Ver ficha'}</span>
        </button>
        <div className="exhibition-card-swap__navigation">
          <button type="button" aria-label="Obra anterior" aria-controls={deckId} disabled={total < 2} onClick={onPrevious}>
            <ArrowIcon direction="left" />
          </button>
          <button type="button" aria-label="Obra siguiente" aria-controls={deckId} disabled={total < 2} onClick={onNext}>
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </footer>
  );
}
