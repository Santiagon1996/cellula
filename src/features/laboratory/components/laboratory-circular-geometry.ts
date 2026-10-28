/**
 * Cylinder geometry adapted from David Haz's React Bits Circular Carousel:
 * https://reactbits.dev/components/circular-carousel
 * Upstream MIT + Commons Clause terms: ../REACT-BITS-LICENSE.md.
 */
export type CircularOrientation = 'vertical' | 'horizontal';

type GeometryOptions = {
  count: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  orientation: CircularOrientation;
};

export type CircularGeometry = {
  radius: number;
  step: number;
};

export function wrapCircularIndex(value: number, count: number) {
  return count > 0 ? ((value % count) + count) % count : 0;
}

/** Logical distances wrap by item identity; the cylinder need not contain clones. */
export function circularOffset(index: number, position: number, count: number) {
  if (count <= 1) return 0;
  const distance = wrapCircularIndex(index - position + count / 2, count) - count / 2;
  // Keep the second card on the forward side at the exact two-item boundary.
  return distance === -count / 2 && index - position > 0 ? count / 2 : distance;
}

export function nearestCircularPosition(index: number, position: number, count: number) {
  return count > 1 ? position + circularOffset(index, position, count) : 0;
}

export function circularGeometry({ count, cardWidth, cardHeight, gap, orientation }: GeometryOptions): CircularGeometry {
  // A three-item collection would otherwise place its neighbours at 120 degrees.
  const step = Math.PI * 2 / Math.max(8, count);
  const along = Math.max(1, orientation === 'vertical' ? cardHeight : cardWidth);
  const pitch = along + Math.max(0, gap);
  return { step, radius: pitch / (2 * Math.sin(step / 2)) };
}

export function circularCardPose(index: number, position: number, count: number, geometry: CircularGeometry, orientation: CircularOrientation) {
  const distance = circularOffset(index, position, count);
  const angle = distance * geometry.step;
  const shift = geometry.radius * Math.sin(angle);
  const depth = geometry.radius * (Math.cos(angle) - 1);
  const degrees = angle * 180 / Math.PI;
  const reach = Math.abs(distance);
  const seam = count / 2;
  // Fade the furthest card before it crosses the logical wrap seam.
  const seamFade = count >= 3 ? Math.min(1, Math.max(0, (seam - reach) / .45)) : 1;
  const facingFade = Math.min(1, Math.max(0, (115 - Math.abs(degrees)) / 30));
  const opacity = count > 0 ? seamFade * facingFade : 0;
  return {
    x: orientation === 'horizontal' ? shift : 0,
    y: orientation === 'vertical' ? shift : 0,
    z: depth,
    rotateX: orientation === 'vertical' ? -degrees * .7 : 0,
    rotateY: orientation === 'horizontal' ? degrees * .7 : 0,
    scale: 1 - Math.min(reach, 1) * .045,
    opacity,
    zIndex: Math.round(1000 - reach * 100),
  };
}

/** Momentum is bounded to less than one additional card after a deliberate drag. */
export function snapCircularPosition(position: number, velocity = 0) {
  const momentum = Math.min(.65, Math.max(-.65, velocity * .14));
  return Math.round(position + momentum);
}
