export function wrapLoop(value: number, length: number) {
  return length > 0 ? ((value % length) + length) % length : 0;
}

export function loopPosition(offset: number, index: number, step: number, count: number) {
  return wrapLoop(offset + index * step + step, step * count) - step;
}

export function dragExceeded(startX: number, startY: number, x: number, y: number) {
  return Math.hypot(x - startX, y - startY) >= 8;
}
