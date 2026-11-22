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
