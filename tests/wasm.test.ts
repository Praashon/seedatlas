import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import type { AtlasModule } from '../apps/web/src/lib/engine';
import { splitSeed } from '../packages/generator-core';

let engine: AtlasModule;
beforeAll(async () => {
  // Public generated ESM is imported directly to exercise the shipped binary.
  const { default: createAtlas } = await import('../apps/web/public/engine/atlas.js');
  engine = await createAtlas({ wasmBinary: await readFile(new URL('../apps/web/public/engine/atlas.wasm', import.meta.url)) });
});
describe('shipped Cubiomes WASM ABI', () => {
  it('matches the upstream seed 262 mushroom-fields example', () => {
    expect(engine._atlas_init(22, 0, ...splitSeed('262'))).toBe(1);
    expect(engine._atlas_biome(0, 63, 0)).toBe(14);
    expect(engine.UTF8ToString(engine._atlas_biome_name(14))).toBe('mushroom_fields');
  });
  it('isolates dimensions and rejects unsupported versions', () => {
    engine._atlas_init(27, -1, ...splitSeed('-9223372036854775808'));
    expect([8, 170, 171, 172, 173]).toContain(engine._atlas_biome(-17, 64, -17));
    expect(engine._atlas_region_size(5)).toBe(0);
    expect(engine._atlas_region_size(18)).toBeGreaterThan(0);
    expect(engine._atlas_init(999, 0, 0, 0)).toBe(0);
  });
  it('is deterministic at negative coordinates and across full seed halves', () => {
    function scan(seed: string) {
      engine._atlas_init(27, 0, ...splitSeed(seed));
      return [-2049, -17, 0, 2049].map(x => engine._atlas_biome(x, -32, -512));
    }
    expect(scan('9223372036854775807')).toEqual(scan('9223372036854775807'));
    expect(scan('-1')).not.toEqual(scan('9223372036854775807'));
  });
  it('returns repeatable structure candidates after biome viability checks', () => {
    engine._atlas_init(27, 0, ...splitSeed('262'));
    const scan = () => {
      const positions: string[] = [];
      for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
        if (engine._atlas_structure(5, x, z)) positions.push(`${engine._atlas_result_x()},${engine._atlas_result_z()}`);
      }
      return positions;
    };
    const first = scan(); expect(first.length).toBeGreaterThan(0); expect(scan()).toEqual(first);
  });
});
