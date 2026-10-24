import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import type { AtlasModule } from '../apps/web/src/lib/engine';
import { splitSeed } from '../packages/generator-core';

let engine: AtlasModule;
beforeAll(async () => {
  const { default: createAtlas } = await import('../apps/web/public/engine/atlas26.js');
  engine = await createAtlas({ wasmBinary: await readFile(new URL('../apps/web/public/engine/atlas26.wasm', import.meta.url)) });
});
describe('Java 26.2 browser adapter', () => {
  it('uses 26.2 sulfur-cave parameters and height-aware sampling', () => {
    // Cross-engine regression: https://mcseeder.com/versions/26.2/ seed 1.
    // This is not a comprehensive independently generated vanilla fixture suite.
    expect(engine._atlas_init(262, 0, ...splitSeed('9692138235802224'))).toBe(1);
    expect(engine._atlas_biome(0, 0, 0)).toBe(187);
    expect(engine._atlas_biome(0, 64, 0)).toBe(12);
    expect(engine._atlas_biome_supported(187)).toBe(1);
    expect(engine.UTF8ToString(engine._atlas_biome_name(187))).toBe('sulfur_caves');
    expect(engine._atlas_biome_supported(188)).toBe(0);
  });
  it('matches the published snowy-village and trial-chamber predictions', () => {
    engine._atlas_init(262, 0, ...splitSeed('9692138235802224'));
    expect(engine._atlas_structure(5, 0, 0)).toBe(1);
    expect([engine._atlas_result_x(), engine._atlas_result_z()]).toEqual([176, 96]);
    expect(engine._atlas_structure(24, 0, -1)).toBe(1);
    expect([engine._atlas_result_x(), engine._atlas_result_z()]).toEqual([16, -208]);
  });
  it('preserves the primary fork 26.2 End-ring regression and public type IDs', () => {
    // xpple/cubiomes tests/test_biomes.c, test_end_rings, pinned d934de1d.
    engine._atlas_init(262, 1, ...splitSeed('856461443495910397'));
    expect(engine._atlas_biome(-371136, 0, -64)).toBe(43);
    expect(engine._atlas_region_size(20)).toBe(320);
    expect(engine._atlas_region_size(5)).toBe(0);
    expect(engine._atlas_init(27, 0, 0, 0)).toBe(0);
  });
  it('isolates Nether generation and handles the full signed seed range', () => {
    for (const seed of ['-9223372036854775808', '9223372036854775807']) {
      engine._atlas_init(262, -1, ...splitSeed(seed));
      expect([8, 170, 171, 172, 173]).toContain(engine._atlas_biome(-17, 64, -17));
      expect(engine._atlas_biome_supported(187)).toBe(0);
      expect(engine._atlas_region_size(18)).toBeGreaterThan(0);
    }
  });
});
