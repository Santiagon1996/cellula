import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import source from '../../warp-text-upstream.json';
import registry from '../../warp-text-registry.json';
import provenance from '../../warp-text-provenance.json';

describe('Warp Text official source identity', () => {
  it('keeps the retrieved registry and source snapshots byte-identical with their declared hash', () => {
    expect(registry.files[0].content).toBe(source.content);
    expect(createHash('sha256').update(source.content).digest('hex')).toBe(provenance.upstreamContentSha256);
    expect(createHash('sha1').update(`blob ${Buffer.byteLength(source.content)}\0${source.content}`).digest('hex')).toBe(source.blob);
    expect(registry.dependencies).toEqual(['ogl@^1.0.11']);
  });

  it('preserves both official shader programs and the text rasterizer in the adapted engine', () => {
    const local = readFileSync(resolve('src/features/about/components/warp-text/WarpText.tsx'), 'utf8').replace(/\r\n/g, '\n');
    for (const name of ['vertex', 'fragment']) {
      const pattern = new RegExp(`const ${name} = \x60([\\s\\S]*?)\x60;`);
      expect(local.match(pattern)?.[1]).toBe(source.content.match(pattern)?.[1]);
    }
    const raster = (text: string) => text.slice(text.indexOf('const buildTextCanvas ='), text.indexOf('const syncUniforms ='));
    expect(raster(local)).toBe(raster(source.content));
  });
});
