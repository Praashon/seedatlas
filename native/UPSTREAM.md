# Cubiomes provenance

Repository: https://github.com/Cubitect/cubiomes

Pinned commit: `e61f90580cbdd883214a8054670dacae655e59c0`.

MIT license: `cubiomes/LICENSE`, retained unmodified. This is the legacy adapter. Upstream C sources are vendored, not a submodule. No SeedForge patches, proprietary game code, or game assets are included.

Our wrapper is `wasm-bindings/atlas.c`. Emscripten 4.0.15 compiles it with signed wrapping enabled. Rebuild with `npm run build:wasm` after installing Emscripten or setting `EMCC`. Committed JS/WASM artifacts let ordinary frontend development work without a compiler.

Java 26.2 uses a separate MIT-licensed active fork under `cubiomes-26`, pinned to xpple/cubiomes `d934de1d4e5e71db0b789296241f929a50306504`. See its PROVENANCE.md. The public wrapper maps structure enums explicitly so End cities, trail ruins and trial chambers retain their public IDs across engines. No legacy version is silently moved to the new generator.
