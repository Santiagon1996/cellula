import { describe, expect, it } from 'vitest';
import { dragExceeded, loopPosition, wrapLoop } from './laboratory-loop';

describe('laboratory loop geometry', () => {
  it('wraps positive and negative offsets onto the same period', () => {
    expect(wrapLoop(-10, 120)).toBe(110);
    expect(wrapLoop(250, 120)).toBe(10);
    expect(wrapLoop(10, 0)).toBe(0);
  });

  it('wraps every card independently outside the visible lane', () => {
    const height = 550;
    const step = height + 24;
    const count = 3;
    const viewportHeight = 720;
    const period = step * count;
    const before = loopPosition(-step + 1, 0, step, count);
    const after = loopPosition(-step - 1, 0, step, count);

    expect(before + height).toBeLessThan(0);
    expect(after).toBeGreaterThan(viewportHeight);
    for (let offset = -period; offset <= period; offset += 31) {
      const positions = Array.from({ length: count }, (_, index) => loopPosition(offset, index, step, count)).sort((a, b) => a - b);
      expect(positions[1] - positions[0]).toBeCloseTo(step);
      expect(positions[2] - positions[1]).toBeCloseTo(step);
      expect(positions.some((position) => position < viewportHeight && position + height > 0)).toBe(true);
      for (let index = 0; index < count; index++) {
        expect(loopPosition(offset + period, index, step, count)).toBeCloseTo(loopPosition(offset, index, step, count));
      }
    }
  });

  it('distinguishes small taps from drags in either direction', () => {
    expect(dragExceeded(100, 100, 102, 105)).toBe(false);
    expect(dragExceeded(100, 100, 100, 108)).toBe(true);
    expect(dragExceeded(100, 100, 92, 100)).toBe(true);
  });
});
