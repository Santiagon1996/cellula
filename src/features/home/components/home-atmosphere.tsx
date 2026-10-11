import { FluidGradientCanvas } from './fluid-gradient-canvas';

/** Decorative Three.js liquid gradient below the persistent GSAP identity. */
export function HomeAtmosphere() {
  return (
    <div className="home-atmosphere" aria-hidden="true">
      <FluidGradientCanvas />
    </div>
  );
}
