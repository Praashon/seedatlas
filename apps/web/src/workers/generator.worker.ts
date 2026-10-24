/// <reference lib="webworker" />
import type { Discovery, EngineRequest, EngineResponse } from '../../../../packages/contracts';
import {
  DIMENSION_IDS,
  getCapability,
  requireEngine,
  splitSeed,
  STRUCTURES,
  validateBounds,
  validatePosition,
} from '../../../../packages/generator-core';
import { biomeColor, biomeLabel, type AtlasModule } from '../lib/engine';

const scope = self as unknown as DedicatedWorkerGlobalScope;
function send(message: EngineResponse) {
  scope.postMessage(message);
}
async function load(engineModule: string): Promise<AtlasModule> {
  const url = new URL(engineModule, scope.location.origin).href;
  const module = (await import(/* @vite-ignore */ url)) as {
    default: (options: { locateFile: (file: string) => string }) => Promise<AtlasModule>;
  };
  return module.default({
    locateFile: (file) => new URL('/engine/' + file, scope.location.origin).href,
  });
}
const engines = new Map<string, Promise<AtlasModule>>();
scope.onmessage = async (event: MessageEvent<EngineRequest>) => {
  const request = event.data;
  try {
    const version = requireEngine(request.version);
    const capability = getCapability(request.version);
    if (!capability.engineModule || !capability.adapter)
      throw new Error('No engine is registered for this game version.');
    const fingerprint = capability.adapter;
    validatePosition(request, request.dimension);
    let engine = engines.get(capability.engineModule);
    if (!engine) {
      engine = load(capability.engineModule);
      engines.set(capability.engineModule, engine);
    }
    const core = await engine;
    const [low, high] = splitSeed(request.seed);
    if (!core._atlas_init(version, DIMENSION_IDS[request.dimension], low, high))
      throw new Error('The browser engine rejected this generation profile.');
    const name = (id: number) => core.UTF8ToString(core._atlas_biome_name(id));
    if (request.kind === 'map') {
      if (request.size !== 128 || request.span < 256 || request.span > 16384)
        throw new Error('Map bounds exceed the local compute budget.');
      const pixels = new Uint8ClampedArray(request.size * request.size * 4);
      const biomes: number[] = [];
      for (let row = 0; row < request.size; row++) {
        for (let col = 0; col < request.size; col++) {
          const x = Math.floor(request.x - request.span / 2 + (col * request.span) / request.size);
          const z = Math.floor(request.z - request.span / 2 + (row * request.span) / request.size);
          const id = core._atlas_biome(x, request.y, z);
          biomes.push(id);
          const color = biomeColor(name(id));
          const i = (row * request.size + col) * 4;
          const edge =
            (col > 0 && biomes[row * request.size + col - 1] !== id) ||
            (row > 0 && biomes[(row - 1) * request.size + col] !== id);
          pixels[i] = color[0] - (edge ? 9 : 0);
          pixels[i + 1] = color[1] - (edge ? 9 : 0);
          pixels[i + 2] = color[2] - (edge ? 9 : 0);
          pixels[i + 3] = 255;
        }
      }
      send({ kind: 'map', requestId: request.requestId, pixels, biomes, size: request.size });
      return;
    }
    validateBounds(request.radius, request.resolution);
    if (
      request.types.length > 15 ||
      request.types.some(
        (type) => !STRUCTURES.some((s) => s.id === type && s.dimension === request.dimension),
      )
    )
      throw new Error('A structure filter is unavailable in this dimension.');
    const results: Discovery[] = [];
    const make = (
      type: number,
      label: string,
      x: number,
      y: number | null,
      z: number,
      biome: string,
    ): Discovery => ({
      id: `${request.version}:${request.dimension}:${type}:${x}:${y ?? 'xz'}:${z}`,
      type,
      name: label,
      x,
      y,
      z,
      dimension: request.dimension,
      biome,
      distance: Math.hypot(x - request.x, z - request.z),
      accuracy: 'predicted',
      source: 'cubiomes-wasm',
      fingerprint,
      version: request.version,
      complete: true,
      limitations: [
        'Upstream prediction; independent vanilla validation pending.',
        ...(y === null
          ? ['Vertical position, terrain viability and structure layout are not verified.']
          : [
              `Biome sampled every ${request.resolution} blocks at Y ${y}; narrow patches can be missed.`,
            ]),
      ],
    });
    if (request.biomeId !== undefined) {
      if (!core._atlas_biome_supported(request.biomeId))
        throw new Error('This biome is unavailable in the selected version or dimension.');
      let nearest: Discovery | undefined;
      const step = request.resolution;
      const startX = Math.ceil((request.x - request.radius) / step) * step;
      const startZ = Math.ceil((request.z - request.radius) / step) * step;
      const rows = Math.floor((request.z + request.radius - startZ) / step) + 1;
      for (let row = 0; row < rows; row++) {
        const z = startZ + row * step;
        for (let x = startX; x <= request.x + request.radius; x += step) {
          const distance = Math.hypot(x - request.x, z - request.z);
          if (distance > request.radius || (nearest && distance >= nearest.distance)) continue;
          if (core._atlas_biome(x, request.y, z) === request.biomeId)
            nearest = make(
              -1,
              biomeLabel(name(request.biomeId)),
              x,
              request.y,
              z,
              biomeLabel(name(request.biomeId)),
            );
        }
        if (row % 8 === 0)
          send({
            kind: 'progress',
            requestId: request.requestId,
            progress: Math.round((100 * row) / rows),
            results: nearest ? [nearest] : [],
          });
      }
      send({
        kind: 'results',
        requestId: request.requestId,
        results: nearest ? [nearest] : [],
        complete: true,
      });
      return;
    }
    for (let index = 0; index < request.types.length; index++) {
      const type = request.types[index];
      const region = core._atlas_region_size(type);
      if (region === 0) continue;
      const label = STRUCTURES.find((s) => s.id === type)?.name ?? 'Structure';
      for (
        let rx = Math.floor((request.x - request.radius) / region);
        rx <= Math.floor((request.x + request.radius) / region);
        rx++
      ) {
        for (
          let rz = Math.floor((request.z - request.radius) / region);
          rz <= Math.floor((request.z + request.radius) / region);
          rz++
        ) {
          if (!core._atlas_structure(type, rx, rz)) continue;
          const x = core._atlas_result_x(),
            z = core._atlas_result_z();
          if (Math.hypot(x - request.x, z - request.z) > request.radius) continue;
          results.push(
            make(type, label, x, null, z, biomeLabel(name(core._atlas_biome(x, request.y, z)))),
          );
        }
      }
      results.sort((a, b) => a.distance - b.distance);
      send({
        kind: 'progress',
        requestId: request.requestId,
        progress: Math.round((100 * (index + 1)) / request.types.length),
        results,
      });
    }
    send({ kind: 'results', requestId: request.requestId, results, complete: true });
  } catch (error) {
    send({
      kind: 'error',
      requestId: request.requestId,
      message: error instanceof Error ? error.message : 'The local generation engine failed.',
    });
  }
};
