export type Dimension = 'overworld' | 'nether' | 'end';
export type Accuracy =
  | 'exact-validated'
  | 'predicted'
  | 'observed'
  | 'experimental'
  | 'unsupported';
export type Progress = 'planned' | 'explored' | 'mined';
export interface Position {
  x: number;
  y: number;
  z: number;
}
export interface Waypoint extends Position {
  id: string;
  name: string;
  dimension: Dimension;
}
export interface World {
  id: string;
  name: string;
  seed: string;
  seedInput: string;
  version: string;
  preset: 'default';
  createdAt: string;
  position: Position;
  waypoints: Waypoint[];
  progress: Record<string, Progress>;
}
export interface VersionCapability {
  id: string;
  status: 'release' | 'snapshot';
  engineVersion: number | null;
  dataPackVersion: string | null;
  dataVersion: number | null;
  dimensions: readonly Dimension[];
  biomes: Accuracy;
  structures: Accuracy;
  ores: Accuracy;
  adapter: string | null;
  testCoverage: string;
  limitations: string[];
  minimumCompanionVersion: string | null;
}
export interface Discovery {
  id: string;
  type: number;
  name: string;
  x: number;
  y: number | null;
  z: number;
  dimension: Dimension;
  biome: string;
  distance: number;
  accuracy: Accuracy;
  source: 'cubiomes-wasm';
  fingerprint: string;
  version: string;
  complete: boolean;
  limitations: string[];
}
export interface MapRequest {
  kind: 'map';
  requestId: string;
  seed: string;
  version: string;
  dimension: Dimension;
  x: number;
  y: number;
  z: number;
  span: number;
  size: number;
}
export interface SearchRequest {
  kind: 'search';
  requestId: string;
  seed: string;
  version: string;
  dimension: Dimension;
  x: number;
  y: number;
  z: number;
  radius: number;
  types: number[];
  biomeId?: number;
  resolution: number;
}
export type EngineRequest = MapRequest | SearchRequest;
export type EngineResponse =
  | { kind: 'progress'; requestId: string; progress: number; results: Discovery[] }
  | { kind: 'results'; requestId: string; results: Discovery[]; complete: boolean }
  | { kind: 'map'; requestId: string; pixels: Uint8ClampedArray; biomes: number[]; size: number }
  | { kind: 'error'; requestId: string; message: string };
