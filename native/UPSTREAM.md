# Cubiomes provenance

Repository: https://github.com/Cubitect/cubiomes

Pinned commit: `e61f90580cbdd883214a8054670dacae655e59c0`.

MIT license: `cubiomes/LICENSE`, retained unmodified. Upstream C sources are vendored, not a submodule. No SeedForge patches, extracted vanilla biome tables, proprietary game code, or game assets are included.

Our wrapper is `wasm-bindings/atlas.c`. Emscripten 4.0.15 compiles it with signed wrapping enabled. Rebuild with `npm run build:wasm` after installing Emscripten or setting `EMCC`. Committed JS/WASM artifacts let ordinary frontend development work without a compiler.
