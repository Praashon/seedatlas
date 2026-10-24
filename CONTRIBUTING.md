# Contributing

Read README.md and docs/research.md before changing generation behavior. Use Node 24, npm ci, and Rust stable. Run type checking, unit/WASM tests, browser tests, formatting, lint, build, Rust tests and Clippy for affected work.

Keep generation adapters version-specific and bounded. Never promote predictions to exact status without independent vanilla reference fixtures. Do not commit proprietary Minecraft binaries, game source or assets. Preserve dependency notices and provenance. Keep guest exploration local and free. Do not add mandatory accounts or a companion requirement to ordinary biome/structure search.

Use UUID world identities independent of seed. Keep dimension and generator fingerprints on discoveries. Await persistence and report failures. Never silently merge progress across seeds, dimensions, versions, or ambiguous cluster matches.

Describe the player-visible behavior, limitations and verification in pull requests. A compatibility contribution must document source provenance, license, version metadata, sampling semantics and positive/negative reference coverage.
