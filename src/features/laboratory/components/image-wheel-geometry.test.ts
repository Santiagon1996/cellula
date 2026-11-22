import { describe, expect, it } from 'vitest';
import { demoLaboratories } from '../data/laboratories';
import { laboratoryViews } from '../data/laboratory-views';
import { angularCursorSpeed, dragRotation, imageWheelGeometry, imageWheelPose, TAU, wheelFront, wheelMomentum, wheelTarget } from './image-wheel-geometry';

const views = laboratoryViews(demoLaboratories);
describe('True image wheel geometry', () => {
  it.each(['horizontal', 'vertical'] as const)('places every image on a real circular %s trajectory, including rear positions', axis => {
    const geometry = imageWheelGeometry(views, 1000, 600, axis);
    expect(geometry.step * views.length).toBeCloseTo(TAU);
    for (let i = 0; i < views.length; i++) {
      const pose = imageWheelPose(i, .27, geometry);
      const along = axis === 'horizontal' ? pose.x : pose.y;
      expect(along ** 2 + (pose.z - geometry.frontZ + geometry.radius) ** 2).toBeCloseTo(geometry.radius ** 2);
      expect(axis === 'horizontal' ? pose.rotateX : pose.rotateY).toBe(0);
    }
    expect(imageWheelPose(2, 0, geometry)[axis === 'horizontal' ? 'rotateY' : 'rotateX']).not.toBe(0);
  });
  it('derives occlusion and apparent size from depth rather than arbitrary z-index or scaling', () => {
    const geometry = imageWheelGeometry(views, 1200, 650, 'horizontal');
    const front = imageWheelPose(0, 0, geometry), side = imageWheelPose(2, 0, geometry), rear = imageWheelPose(4, 0, geometry);
    expect(front.z).toBeGreaterThan(side.z); expect(side.z).toBeGreaterThan(rear.z);
    expect(front.projectedScale).toBeGreaterThan(1); expect(rear.projectedScale).toBeLessThan(.7);
    expect(Math.abs(side.x)).toBeCloseTo(geometry.radius);
    expect(Math.abs(rear.x)).toBeLessThan(.0001);
  });
  it('preserves intrinsic aspect ratios, deterministic varied sizes and editorial offsets on resize', () => {
    const geometry = imageWheelGeometry(views, 300, 560, 'vertical');
    expect(geometry).toEqual(imageWheelGeometry(views, 300, 560, 'vertical'));
    expect(new Set(geometry.dimensions.map(size => size.width)).size).toBeGreaterThan(2);
    expect(new Set(geometry.dimensions.map(size => size.cross)).size).toBeGreaterThan(2);
    geometry.dimensions.forEach((size, index) => expect(size.width / (size.height - 44)).toBeCloseTo(views[index].image.width / views[index].image.height));
    expect(imageWheelGeometry(views, 1000, 700, 'horizontal').radius).not.toBe(geometry.radius);
  });
  it('wraps a complete revolution without a seam and centres an item using the shortest existing circular navigation path', () => {
    const geometry = imageWheelGeometry(views, 1200, 650, 'horizontal');
    const a = imageWheelPose(1, .4, geometry), b = imageWheelPose(1, .4 + TAU, geometry);
    for (const property of ['x', 'y', 'z', 'rotateY'] as const) expect(a[property]).toBeCloseTo(b[property]);
    expect(Math.abs(wheelTarget(7, 0, geometry))).toBeCloseTo(geometry.step);
    expect(wheelFront(-geometry.step * 3, geometry)).toBe(3);
  });
  it('controls angular velocity with a neutral zone, opposite directions and a hard speed cap', () => {
    expect(angularCursorSpeed(.19)).toBe(0); expect(angularCursorSpeed(-.19)).toBe(0);
    expect(angularCursorSpeed(1)).toBe(-.85); expect(angularCursorSpeed(-1)).toBe(.85);
    expect(Math.abs(angularCursorSpeed(8))).toBe(.85);
    expect(Math.abs(angularCursorSpeed(.8))).toBeGreaterThan(Math.abs(angularCursorSpeed(.4)));
  });
  it('integrates touch inertia independently of frame rate and settles without snapping to a card', () => {
    const integrate = (fps: number) => {
      let velocity = 2.2, distance = 0;
      for (let i = 0; i < fps; i++) { const next = wheelMomentum(velocity, 1 / fps); velocity = next.velocity; distance += next.distance; }
      return { velocity, distance };
    };
    expect(integrate(30).distance).toBeCloseTo(integrate(120).distance, 10);
    expect(integrate(60).velocity).toBeLessThan(.004);
    expect(integrate(60).distance).toBeLessThan(.34);
    expect(wheelMomentum(-1, .016).distance).toBeLessThan(0);
    expect(dragRotation(160, 240)).toBeCloseTo(2 / 3);
    expect(dragRotation(-80, 240)).toBeCloseTo(-1 / 3);
  });
  it('keeps empty and one-view collections finite', () => {
    expect(imageWheelGeometry([], 320, 600, 'vertical').dimensions).toHaveLength(0);
    const geometry = imageWheelGeometry(views.slice(0, 1), 320, 600, 'vertical');
    expect(geometry.radius).toBe(0);
    expect(imageWheelPose(0, 0, geometry).z).toBe(geometry.frontZ);
  });
});
