import { describe, expect, it } from 'vitest';
import { chunkCoordinate, getCapability, javaHashCode, navigation, parseSeed, requireEngine, splitSeed, validateBounds, validatePosition, VersionCapabilityRegistry } from '../packages/generator-core';

describe('Java seeds', () => {
  it.each(['-9223372036854775808', '9223372036854775807', '-1', '0', '9007199254740993'])('preserves %s without floating point', value => {
    expect(parseSeed(value)).toBe(value);
    const [low, high] = splitSeed(value);
    expect(BigInt.asIntN(64, (BigInt(high) << 32n) | BigInt(low)).toString()).toBe(value);
  });
  it('uses signed Java UTF-16 hashes for text and overflowing numbers', () => {
    expect(parseSeed('hello')).toBe('99162322');
    expect(javaHashCode('😀')).toBe(1772899);
    expect(parseSeed('9223372036854775808')).toBe(String(javaHashCode('9223372036854775808')));
    expect(parseSeed('  +00042  ')).toBe('42');
  });
  it('rejects missing and unbounded input', () => {
    expect(() => parseSeed('   ')).toThrow();
    expect(() => parseSeed('a'.repeat(1025))).toThrow();
  });
});
describe('coordinates and bounds', () => {
  it.each([[-1, -1], [-16, -1], [-17, -2], [0, 0], [15, 0], [16, 1]])('floors block %s to chunk %s', (block, chunk) => expect(chunkCoordinate(block)).toBe(chunk));
  it('separates dimension heights', () => {
    expect(() => validatePosition({ x: -12, y: -64, z: 17 }, 'overworld')).not.toThrow();
    expect(() => validatePosition({ x: -12, y: -64, z: 17 }, 'nether')).toThrow();
    expect(() => validatePosition({ x: 0.5, y: 64, z: 0 }, 'overworld')).toThrow();
    expect(() => validatePosition({ x: Infinity, y: 64, z: 0 }, 'overworld')).toThrow();
  });
  it('calculates straight-line distance and compass direction', () => {
    const value = navigation({ x: 0, y: 0, z: 0 }, { x: 3, y: 12, z: 4 });
    expect(value.horizontal).toBe(5); expect(value.direct).toBe(13); expect(value.direction).toBe('SE');
  });
  it('bounds scans by both radius and work', () => {
    expect(() => validateBounds(4096, 64)).not.toThrow();
    expect(() => validateBounds(4096, 16)).toThrow();
    expect(() => validateBounds(99999, 64)).toThrow();
  });
});
describe('capability honesty', () => {
  it('never inherits a previous version adapter', () => {
    for (const version of ['26.1', '26.3', '26.4 Snapshot 5']) {
      expect(getCapability(version).biomes).toBe('unsupported');
      expect(() => requireEngine(version)).toThrow();
    }
    expect(() => getCapability('unknown')).toThrow();
    expect(VersionCapabilityRegistry.every(item => item.ores === 'unsupported')).toBe(true);
    expect(VersionCapabilityRegistry.some(item => item.biomes === 'exact-validated')).toBe(false);
  });
  it('registers Java 26.2 with its own engine and provenance', () => {
    expect(requireEngine('26.2')).toBe(262);
    expect(getCapability('26.2').biomes).toBe('predicted');
    expect(getCapability('26.2').engineModule).toBe('/engine/atlas26.js');
    expect(getCapability('26.2').adapter).not.toBe(getCapability('1.21.3').adapter);
  });
});
