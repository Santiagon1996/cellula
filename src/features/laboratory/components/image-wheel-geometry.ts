import { circularGeometry, nearestCircularPosition, wrapCircularIndex } from './laboratory-circular-geometry';
import type { LaboratoryView, LaboratoryAxis } from '../data/laboratory-views';

export const TAU = Math.PI * 2;
const sizes = [1, .72, .93, .66, 1.08, .8, .9, .7];
const offsets = [-.1, .12, -.16, .07, .13, -.08, .02, -.13];

export function imageWheelGeometry(views: readonly LaboratoryView[], width: number, height: number, axis: LaboratoryAxis) {
  const w = Math.max(1, width), h = Math.max(1, height), horizontal = axis === 'horizontal';
  const perspective = horizontal ? 1000 : 850;
  const frontZ = horizontal ? 36 : 24;
  const base = Math.min(horizontal ? Math.min(330, w * .25) : w * .68, h * (horizontal ? .48 : .38) * .8);
  const dimensions = views.map((view, index) => {
    const ratio = view.image.width / Math.max(1, view.image.height);
    const cardWidth = Math.max(1, Math.min(base * sizes[index % sizes.length], w * (horizontal ? .45 : .72), (h * .64 - 44) * ratio));
    return { width: cardWidth, height: cardWidth / ratio + 44, cross: offsets[index % offsets.length] * (horizontal ? h : w) };
  });
  const reference = dimensions[0] ?? { width: 1, height: 1 };
  const cylinder = circularGeometry({ count: views.length, cardWidth: reference.width, cardHeight: reference.height, gap: 20, orientation: axis });
  return { count: views.length, axis, perspective, frontZ, step: TAU / Math.max(1, views.length), dimensions,
    radius: views.length > 1 ? Math.max(1, Math.min(cylinder.radius * .84, horizontal ? w * .42 : h * .39)) : 0 };
}

export type ImageWheelGeometry = ReturnType<typeof imageWheelGeometry>;

/** A billboard-corrected orbit: full circular positions, curved faces, readable rear images. */
export function imageWheelPose(index: number, rotation: number, geometry: ImageWheelGeometry) {
  const angle = index * geometry.step + rotation;
  const along = Math.sin(angle) * geometry.radius;
  const z = geometry.frontZ + geometry.radius * (Math.cos(angle) - 1);
  const turn = Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle)) + .45) * .82 * 180 / Math.PI;
  const cross = geometry.dimensions[index]?.cross ?? 0;
  return { angle, x: geometry.axis === 'horizontal' ? along : cross,
    y: geometry.axis === 'vertical' ? along : cross, z,
    rotateX: geometry.axis === 'vertical' ? -turn : 0,
    rotateY: geometry.axis === 'horizontal' ? turn : 0,
    projectedScale: geometry.perspective / (geometry.perspective - z) };
}

export function wheelFront(rotation: number, geometry: ImageWheelGeometry) {
  return wrapCircularIndex(Math.round(-rotation / geometry.step), geometry.count);
}

export function wheelTarget(index: number, rotation: number, geometry: ImageWheelGeometry) {
  return -nearestCircularPosition(index, -rotation / geometry.step, geometry.count) * geometry.step;
}

export function angularCursorSpeed(position: number) {
  const magnitude = Math.min(1, Math.abs(position));
  return magnitude <= .2 ? 0 : -Math.sign(position) * ((magnitude - .2) / .8) ** 1.5 * .85;
}

/** Integrate exponential damping exactly, so momentum distance is independent of frame rate. */
export function wheelMomentum(velocity: number, seconds: number) {
  const dt = Math.max(0, Math.min(.05, seconds)), damping = 6.5;
  const next = velocity * Math.exp(-damping * dt);
  return { velocity: next, distance: (velocity - next) / damping };
}

export function dragRotation(deltaPixels: number, radius: number) {
  return deltaPixels / Math.max(140, radius);
}
