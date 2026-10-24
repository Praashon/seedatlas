import type { Dimension, Position, VersionCapability } from '../contracts';

const MIN_SEED = -(1n << 63n);
const MAX_SEED = (1n << 63n) - 1n;
/** Java String.hashCode iterates UTF-16 code units, not Unicode code points. */
export function javaHashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  return hash;
}
export function parseSeed(raw: string): string {
  const input = raw.trim();
  if (!input) throw new Error('Enter a seed or a world seed phrase.');
  if (input.length > 1024) throw new Error('Seeds must be 1,024 characters or fewer.');
  if (/^[+-]?\d+$/.test(input)) {
    const value = BigInt(input);
    if (value >= MIN_SEED && value <= MAX_SEED) return value.toString();
  }
  return String(javaHashCode(input));
}
export function splitSeed(seed: string): [number, number] {
  const value = BigInt.asUintN(64, BigInt(seed));
  return [Number(value & 0xffffffffn), Number(value >> 32n)];
}
export const chunkCoordinate = (value: number): number => Math.floor(value / 16);
export const horizontalDistance = (
  a: Pick<Position, 'x' | 'z'>,
  b: Pick<Position, 'x' | 'z'>,
): number => Math.hypot(b.x - a.x, b.z - a.z);
export function navigation(from: Position, to: Position) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    dz = to.z - from.z;
  const bearing = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
  return {
    dx,
    dy,
    dz,
    horizontal: Math.hypot(dx, dz),
    direct: Math.hypot(dx, dy, dz),
    bearing,
    direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(bearing / 45) % 8],
  };
}
export const HEIGHTS: Record<Dimension, [number, number]> = {
  overworld: [-64, 319],
  nether: [0, 255],
  end: [0, 255],
};
export function validatePosition(position: Position, dimension: Dimension): void {
  if (![position.x, position.y, position.z].every(Number.isInteger))
    throw new Error('Coordinates must be whole numbers.');
  if (Math.abs(position.x) > 29990000 || Math.abs(position.z) > 29990000)
    throw new Error('X and Z must stay within ±29,990,000 blocks.');
  const [min, max] = HEIGHTS[dimension];
  if (position.y < min || position.y > max)
    throw new Error(`Y must be between ${min} and ${max} in this dimension.`);
}
export function validateBounds(radius: number, resolution: number): void {
  if (!Number.isInteger(radius) || radius < 128 || radius > 4096)
    throw new Error('Choose a radius from 128 to 4,096 blocks.');
  if (![16, 32, 64, 128].includes(resolution)) throw new Error('Unsupported sampling resolution.');
  if (((2 * radius) / resolution + 1) ** 2 > 70000)
    throw new Error('This scan is too large. Increase sampling spacing or reduce radius.');
}
export const ENGINE_FINGERPRINT = 'cubiomes-e61f9058-seedatlas-abi1';
export const JAVA_26_2_FINGERPRINT = 'cubiomes-xpple-d934de1d-seedatlas-abi1';
const dimensions = ['overworld', 'nether', 'end'] as const;
function capability(id: string, engineVersion: number | null, reason: string): VersionCapability {
  return {
    id,
    engineVersion,
    status: id.includes('Snapshot') ? 'snapshot' : 'release',
    dataPackVersion: id === '26.3' ? '121.0' : null,
    dataVersion: null,
    dimensions,
    biomes: engineVersion === null ? 'unsupported' : 'predicted',
    structures: engineVersion === null ? 'unsupported' : 'predicted',
    ores: 'unsupported',
    adapter:
      engineVersion === null ? null : id === '26.2' ? JAVA_26_2_FINGERPRINT : ENGINE_FINGERPRINT,
    engineModule:
      engineVersion === null ? null : id === '26.2' ? '/engine/atlas26.js' : '/engine/atlas.js',
    testCoverage:
      'Seed and coordinate unit tests; upstream regression fixture. Independent vanilla suite pending.',
    limitations: [reason, 'Exact ore generation is not implemented.'],
    minimumCompanionVersion: null,
  };
}
export const VersionCapabilityRegistry: readonly VersionCapability[] = [
  capability(
    '26.2',
    262,
    'Java 26.2 browser adapter with sulfur caves. Predictions include upstream regression coverage; terrain checks and comprehensive vanilla validation remain incomplete.',
  ),
  capability(
    '1.21.3',
    27,
    'Upstream prediction. Terrain checks and independent vanilla validation are incomplete.',
  ),
  capability(
    '1.20.6',
    25,
    'Upstream prediction. Terrain checks and independent vanilla validation are incomplete.',
  ),
  capability(
    '1.18.2',
    22,
    'Upstream prediction. Includes the seed 262 regression example, not full vanilla validation.',
  ),
  capability('26.1', null, 'The version-matched browser adapter has not been validated yet.'),
  capability(
    '26.3',
    null,
    'Dappled forests, abandoned camps and changed world-generation definitions need a new browser adapter.',
  ),
  capability(
    '26.4 Snapshot 5',
    null,
    'Snapshot generation and changed ore rules are not supported.',
  ),
];
export function getCapability(version: string): VersionCapability {
  const result = VersionCapabilityRegistry.find((item) => item.id === version);
  if (!result) throw new Error(`Minecraft ${version} is not in the compatibility registry.`);
  return result;
}
export function requireEngine(version: string): number {
  const capability = getCapability(version);
  if (capability.engineVersion === null) throw new Error(capability.limitations[0]);
  return capability.engineVersion;
}
export const DIMENSION_IDS: Record<Dimension, number> = { overworld: 0, nether: -1, end: 1 };
export const STRUCTURES = [
  { id: 5, name: 'Village', dimension: 'overworld', color: '#e2bd79' },
  { id: 11, name: 'Ruined portal', dimension: 'overworld', color: '#bd9bc9' },
  { id: 13, name: 'Ancient city', dimension: 'overworld', color: '#74b8be' },
  { id: 7, name: 'Shipwreck', dimension: 'overworld', color: '#c99a7c' },
  { id: 8, name: 'Ocean monument', dimension: 'overworld', color: '#75b2ad' },
  { id: 1, name: 'Desert pyramid', dimension: 'overworld', color: '#e0c689' },
  { id: 2, name: 'Jungle temple', dimension: 'overworld', color: '#94ad6c' },
  { id: 9, name: 'Woodland mansion', dimension: 'overworld', color: '#b498a9' },
  { id: 10, name: 'Pillager outpost', dimension: 'overworld', color: '#c28e7d' },
  { id: 23, name: 'Trail ruins', dimension: 'overworld', color: '#bfa480' },
  { id: 24, name: 'Trial chambers', dimension: 'overworld', color: '#bc9e69' },
  { id: 18, name: 'Nether fortress', dimension: 'nether', color: '#d99b80' },
  { id: 19, name: 'Bastion remnant', dimension: 'nether', color: '#cfb477' },
  { id: 12, name: 'Ruined portal', dimension: 'nether', color: '#bd9bc9' },
  { id: 20, name: 'End city', dimension: 'end', color: '#bd9bc9' },
] as const;
