import { describe, expect, it } from 'vitest';
import {
  circularCardPose,
  circularGeometry,
  circularOffset,
  nearestCircularPosition,
  snapCircularPosition,
  wrapCircularIndex,
} from './laboratory-circular-geometry';

const options = { count: 3, cardWidth: 280, cardHeight: 320, gap: 24, orientation: 'vertical' as const };

describe('circular laboratory geometry', () => {
  it('wraps logical identity in both directions, including an empty collection', () => {
    expect(wrapCircularIndex(-1, 3)).toBe(2);
    expect(wrapCircularIndex(7, 3)).toBe(1);
    expect(wrapCircularIndex(4, 0)).toBe(0);
    expect(circularOffset(2, 0, 3)).toBe(-1);
    expect(circularOffset(0, 2.75, 3)).toBe(.25);
  });

  it('uses the nearest equivalent destination without resetting a live rotation', () => {
    expect(nearestCircularPosition(0, 2.8, 3)).toBe(3);
    expect(nearestCircularPosition(2, .1, 3)).toBe(-1);
    expect(nearestCircularPosition(0, 9, 1)).toBe(0);
  });

  it('keeps three cards on a readable arc instead of placing neighbours at 120 degrees', () => {
    const geometry = circularGeometry(options);
    expect(geometry.step * 180 / Math.PI).toBe(45);
    const previous = circularCardPose(2, 0, 3, geometry, 'vertical');
    const next = circularCardPose(1, 0, 3, geometry, 'vertical');
    expect(previous.y).toBeLessThan(0);
    expect(next.y).toBeGreaterThan(0);
    expect(previous.y).toBeCloseTo(-next.y);
    expect(next.opacity).toBe(1);
    expect(next.z).toBeLessThan(0);
    expect(next.scale).toBeLessThan(1);
  });

  it('gives the active visual an exact unrotated origin for GSAP Flip', () => {
    const geometry = circularGeometry(options);
    expect(circularCardPose(1, 1, 3, geometry, 'vertical')).toMatchObject({ x: 0, y: 0, z: 0, rotateY: 0, scale: 1, opacity: 1 });
    expect(circularCardPose(1, 1, 3, geometry, 'vertical').rotateX).toBeCloseTo(0);
  });

  it('changes the translation and rotation axes using real card dimensions', () => {
    const vertical = circularGeometry(options);
    const horizontal = circularGeometry({ ...options, orientation: 'horizontal' });
    expect(vertical.radius).toBeGreaterThan(horizontal.radius);
    const pose = circularCardPose(1, 0, 3, horizontal, 'horizontal');
    expect(pose.x).toBeGreaterThan(0);
    expect(pose.y).toBe(0);
    expect(pose.rotateX).toBe(0);
    expect(pose.rotateY).toBeGreaterThan(0);
  });

  it('hides the wrap seam before moving a distant card to the opposite side', () => {
    const geometry = circularGeometry(options);
    const before = circularCardPose(2, .499, 3, geometry, 'horizontal');
    const after = circularCardPose(2, .501, 3, geometry, 'horizontal');
    expect(before.opacity).toBeLessThan(.01);
    expect(after.opacity).toBeLessThan(.01);
    expect(before.x).toBeLessThan(0);
    expect(after.x).toBeGreaterThan(0);
  });

  it('keeps zero, one and two-item collections finite without requiring clones', () => {
    for (const count of [0, 1, 2]) {
      const geometry = circularGeometry({ ...options, count });
      const pose = circularCardPose(0, 0, count, geometry, 'vertical');
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      expect(pose.opacity).toBe(count ? 1 : 0);
    }
    expect(circularOffset(1, 0, 2)).toBe(1);
    expect(circularOffset(0, 1, 2)).toBe(-1);
  });

  it('snaps with bounded momentum and respects reverse direction', () => {
    expect(snapCircularPosition(.3)).toBe(0);
    expect(snapCircularPosition(.3, 3)).toBe(1);
    expect(snapCircularPosition(-.3, -3)).toBe(-1);
    expect(snapCircularPosition(.1, 1000)).toBe(1);
    expect(snapCircularPosition(-.1, -1000)).toBe(-1);
  });
});
