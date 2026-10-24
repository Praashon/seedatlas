export interface AtlasModule {
  _atlas_init(version: number, dimension: number, low: number, high: number): number;
  _atlas_biome(x: number, y: number, z: number): number;
  _atlas_biome_name(biome: number): number;
  _atlas_biome_supported(biome: number): number;
  _atlas_region_size(type: number): number;
  _atlas_structure(type: number, regionX: number, regionZ: number): number;
  _atlas_result_x(): number;
  _atlas_result_z(): number;
  UTF8ToString(pointer: number): string;
}
export const biomeLabel = (name: string): string =>
  name
    .replace(/^minecraft:/, '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export function biomeColor(name: string): [number, number, number] {
  if (/sulfur/.test(name)) return [167, 172, 79];
  if (/pale_garden/.test(name)) return [165, 176, 152];
  if (/frozen|snow|ice|grove/.test(name) && !/cherry/.test(name)) return [192, 207, 191];
  if (/ocean/.test(name)) return /deep/.test(name) ? [48, 80, 84] : [69, 105, 106];
  if (/river/.test(name)) return [89, 131, 128];
  if (/beach|desert/.test(name)) return [204, 186, 134];
  if (/badlands/.test(name)) return [174, 119, 88];
  if (/savanna/.test(name)) return [160, 161, 103];
  if (/cherry/.test(name)) return [188, 149, 157];
  if (/dark_forest/.test(name)) return [60, 80, 56];
  if (/jungle/.test(name)) return [78, 112, 62];
  if (/forest|taiga/.test(name)) return [91, 115, 74];
  if (/swamp/.test(name)) return [109, 123, 79];
  if (/mushroom/.test(name)) return [153, 131, 153];
  if (/peak|hill|slope|shore/.test(name)) return [149, 154, 133];
  if (/plains|meadow/.test(name)) return [143, 164, 103];
  if (/crimson/.test(name)) return [146, 74, 71];
  if (/warped/.test(name)) return [65, 117, 111];
  if (/nether/.test(name)) return [124, 79, 66];
  if (/basalt|soul/.test(name)) return [103, 96, 91];
  if (/end/.test(name)) return [163, 157, 115];
  if (/deep_dark/.test(name)) return [51, 86, 83];
  if (/lush/.test(name)) return [102, 139, 83];
  if (/dripstone/.test(name)) return [147, 125, 101];
  return [130, 145, 100];
}
