import { describe, expect, it } from 'vitest';
import { circularGeometry, circularOffset, nearestCircularPosition, wrapCircularIndex } from './laboratory-circular-geometry';
const options = { count: 3, cardWidth: 280, cardHeight: 320, gap: 24, orientation: 'vertical' as const };
describe('shared circular laboratory geometry', () => {
  it('wraps logical identity in both directions, including an empty collection', () => {
    expect(wrapCircularIndex(-1, 3)).toBe(2); expect(wrapCircularIndex(7, 3)).toBe(1); expect(wrapCircularIndex(4, 0)).toBe(0);
    expect(circularOffset(2, 0, 3)).toBe(-1); expect(circularOffset(0, 2.75, 3)).toBe(.25);
  });
  it('uses the nearest equivalent destination without resetting a live rotation', () => {
    expect(nearestCircularPosition(0, 2.8, 3)).toBe(3); expect(nearestCircularPosition(2, .1, 3)).toBe(-1); expect(nearestCircularPosition(0, 9, 1)).toBe(0);
  });
  it('preserves the approved chord-based radius and changes dimensions with the axis', () => {
    const vertical = circularGeometry(options), horizontal = circularGeometry({ ...options, orientation: 'horizontal' });
    expect(vertical.step * 180 / Math.PI).toBe(45); expect(vertical.radius).toBeCloseTo((320 + 24) / (2 * Math.sin(Math.PI / 8)));
    expect(vertical.radius).toBeGreaterThan(horizontal.radius);
  });
  it('keeps small collections finite and preserves the two-item navigation tie', () => {
    for (const count of [0, 1, 2]) expect(Object.values(circularGeometry({ ...options, count })).every(Number.isFinite)).toBe(true);
    expect(circularOffset(1, 0, 2)).toBe(1); expect(circularOffset(0, 1, 2)).toBe(-1);
  });
});
