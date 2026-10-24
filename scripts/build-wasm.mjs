import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const local = resolve(root, '.tools/emsdk/upstream/emscripten/emcc.py');
const python = resolve(root, '.tools/emsdk/python/3.13.3_64bit/python.exe');
const source = ['noise.c', 'biomes.c', 'layers.c', 'biomenoise.c', 'generator.c', 'finders.c', 'util.c', 'quadbase.c'].map(s => resolve(root, 'native/cubiomes', s));
mkdirSync(resolve(root, 'apps/web/public/engine'), { recursive: true });
const args = [resolve(root, 'native/wasm-bindings/atlas.c'), ...source, '-I' + resolve(root, 'native/cubiomes'), '-O3', '-flto', '-fwrapv', '-DNDEBUG', '-sMODULARIZE=1', '-sEXPORT_ES6=1', '-sENVIRONMENT=web,worker,node', '-sALLOW_MEMORY_GROWTH=1', '-sMAXIMUM_MEMORY=134217728', '-sINITIAL_MEMORY=33554432', '-sFILESYSTEM=0', '-sEXPORTED_FUNCTIONS=["_atlas_init","_atlas_biome","_atlas_biome_name","_atlas_biome_supported","_atlas_region_size","_atlas_structure","_atlas_result_x","_atlas_result_z"]', '-sEXPORTED_RUNTIME_METHODS=["UTF8ToString"]', '-o', resolve(root, 'apps/web/public/engine/atlas.js')];
const command = existsSync(local) && existsSync(python) ? python : process.env.EMCC || 'emcc';
const temporary = resolve(root, '.artifacts/compiler-tmp');
mkdirSync(temporary, { recursive: true });
const result = spawnSync(command, command === python ? [local, ...args] : args, { stdio: 'inherit', cwd: root, env: { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary } });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
