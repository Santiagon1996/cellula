import { FluidGradientCanvas } from './fluid-gradient-canvas';

/** GPU fluid backdrop with a CSS pastel fallback; no hand or static photograph. */
export function HomeAtmosphere() {
  return (
    <div className="home-atmosphere" aria-hidden="true">
      <FluidGradientCanvas />
    </div>
  );
}
