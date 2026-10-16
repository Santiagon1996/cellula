import { LiquidGradient } from '@/shared/ui/liquid-gradient/liquid-gradient';

/** Home adapter; the reusable component owns the shader and Three.js resources. */
export function FluidGradientCanvas() {
  return <LiquidGradient className="home-atmosphere__canvas" priority />;
}
