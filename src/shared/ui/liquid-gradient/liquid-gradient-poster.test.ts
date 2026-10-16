// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { liquidGradientPoster } from './liquid-gradient-poster';

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url));

/** Read the WebP container, without importing an image decoder into the tests. */
function webpDimensions(bytes: Buffer) {
  expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
  expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
  expect(bytes.readUInt32LE(4) + 8).toBe(bytes.byteLength);

  for (let offset = 12; offset + 8 <= bytes.length;) {
    const chunk = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    expect(start + size).toBeLessThanOrEqual(bytes.length);
    if (chunk === 'VP8X') {
      expect(size).toBeGreaterThanOrEqual(10);
      return { width: bytes.readUIntLE(start + 4, 3) + 1, height: bytes.readUIntLE(start + 7, 3) + 1 };
    }
    if (chunk === 'VP8 ') {
      expect(bytes.subarray(start + 3, start + 6)).toEqual(Buffer.from([0x9d, 0x01, 0x2a]));
      return { width: bytes.readUInt16LE(start + 6) & 0x3fff, height: bytes.readUInt16LE(start + 8) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      expect(bytes[start]).toBe(0x2f);
      const dimensions = bytes.readUInt32LE(start + 1);
      return { width: (dimensions & 0x3fff) + 1, height: ((dimensions >>> 14) & 0x3fff) + 1 };
    }
    offset = start + size + (size % 2);
  }
  throw new Error('WebP has no image dimensions');
}

describe('generated liquid gradient reference frame', () => {
  it('matches the current shader source, requiring regeneration after shader changes', () => {
    const source = readFileSync(path.join(projectRoot, 'src/shared/ui/liquid-gradient/liquid-gradient-shaders.ts'), 'utf8');
    const extractShader = (name: string) => {
      const match = source.match(new RegExp('export const ' + name + ' = `([\\s\\S]*?)`;'));
      if (!match) throw new Error(`Missing shader export: ${name}`);
      return match[1];
    };
    // Keep this byte sequence identical to scripts/generate-liquid-poster.mjs.
    const hash = createHash('sha256')
      .update(extractShader('liquidGradientVertexShader') + '\n' + extractShader('liquidGradientFragmentShader'))
      .digest('hex');

    expect(liquidGradientPoster.shaderSha256, 'Run scripts/generate-liquid-poster.mjs after changing the shader').toBe(hash);
  });

  it('records the original initial frame and palette in sRGB', () => {
    expect(liquidGradientPoster.time).toBe(0);
    expect(liquidGradientPoster.palette).toEqual(['#f7b3d4', '#a1d6e4', '#fff1d7', '#c8b4e5']);
    expect(liquidGradientPoster.colorSpace).toBe('srgb');
    expect(liquidGradientPoster.portrait.width / liquidGradientPoster.portrait.height).toBe(1 / 4);
    expect(liquidGradientPoster.landscape.width / liquidGradientPoster.landscape.height).toBe(4);
  });

  it.each(['portrait', 'landscape'] as const)('%s asset agrees with the generated size and dimensions', (orientation) => {
    const frame = liquidGradientPoster[orientation];
    const bytes = readFileSync(path.join(projectRoot, 'public', frame.src));

    expect(bytes.byteLength).toBe(frame.bytes);
    expect(bytes.byteLength).toBeLessThan(40_000);
    expect(webpDimensions(bytes)).toEqual({ width: frame.width, height: frame.height });
  });

  it.each(['portrait', 'landscape'] as const)('%s inline frame stays small and agrees with its thumbnail dimensions', (orientation) => {
    const frame = liquidGradientPoster[orientation];
    expect(frame.placeholder).toMatch(/^data:image\/webp;base64,/);
    const bytes = Buffer.from(frame.placeholder.split(',')[1], 'base64');

    expect(bytes.byteLength).toBeLessThan(2_000);
    expect(webpDimensions(bytes)).toEqual({ width: frame.thumbnailWidth, height: frame.thumbnailHeight });
    expect(frame.thumbnailWidth / frame.thumbnailHeight).toBe(frame.width / frame.height);
  });
});
