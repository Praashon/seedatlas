# Architecture

SeedAtlas is an offline-first static React application. The initial product is a working guest atlas. No account, Fabric installation, Java runner, server, or API key is needed for browser biome and structure calculations.

## Boundaries

- `apps/web`: Poppins UI, canvas viewport, bounded Web Worker computation, IndexedDB guest worlds and per-world progress.
- `packages/contracts`: versioned result, world, dimension, and capability contracts.
- `packages/generator-core`: Java-compatible seed parsing, coordinates, version registry, search validation.
- `native/cubiomes`: pinned, unmodified MIT upstream source. `native/wasm-bindings` is our narrow C ABI. Built JS/WASM ships with the static frontend.
- `apps/api`: optional Rust/Axum service foundation. Health and capabilities only; private data endpoints wait for authenticated authorization and integration tests.
- `precision` and `companion`: future independent adapters for exact blocks, save inspection, and live coordinates. Neither is a browser search prerequisite.

Canvas 2D is sufficient for the bounded 128 by 128 biome raster and a small marker set. WebGL and state/query/form libraries would add complexity without solving a current bottleneck. React owns UI state; workers own generator memory. All seeds cross boundaries as canonical decimal strings, then enter C as two unsigned 32-bit halves.

## Data and computation

Each world has a UUID independent of seed. Waypoints and visited state include world and dimension. IndexedDB writes are awaited and failure is surfaced. Export uses an explicit user action. Browser data is never uploaded. The optional API has no access to guest state.

A request includes seed, exact version, dimension, preset, player position, bounds, sampling height, and engine fingerprint. Default preset only. One worker per operation, hard radius and sample limits, incremental progress, cancellation by termination, and small bounded memory use. Stale worker messages cannot overwrite a newer request. Map data is a sampled horizontal plane, not terrain elevation or a complete underground survey.

## Future synchronization

Use owner-authorized resources, HttpOnly secure sessions, OAuth state and PKCE, CSRF protection, UUID event IDs, revisions and idempotent transactions. Preserve conflicts for explicit resolution. Never merge worlds by seed. No authentication UI is shipped before these guarantees exist.

## Cluster identity

Future ore inspection uses six-face adjacency across chunk boundaries. Persistent discovery UUIDs are separate from member hashes. Reconcile expansions through overlapping observed block sets and provenance. Ambiguous merges preserve records and require resolution; absence never implies a player mined the deposit.
