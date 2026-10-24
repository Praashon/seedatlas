# Implementation checklist

- [x] Milestone 0: inspect empty workspace and toolchain, research primary sources, document architecture, version boundaries and legal limitations.
- [x] Milestone 1: strict React foundation, Rust service, shared contracts, original theme, navigation, local configuration, PostgreSQL migration and CI. Local database runtime unavailable; CI applies the schema.
- [ ] Milestone 2 acceptance: seed parser, capability registry, dimensions, bounded WASM adapter and upstream regression tests implemented. Independent version-matched vanilla validation remains required.
- [x] Milestone 3: worker-driven interactive map, coordinate navigation, pan, zoom, coordinate grid, search-radius overlay, filters and waypoints.
- [ ] Milestone 4 acceptance: browser biome/structure predictions, progress, cancellation, nearest sampled queries and accuracy labels implemented. Generation-result caching and independent vanilla validation remain.
- [ ] Milestone 5 acceptance: guest world UUIDs, waypoints, visit status, IndexedDB persistence, export and offline production reload implemented. OAuth, account migration and conflict-aware synchronization remain.
- [ ] Milestone 6: bounded local NBT and region importer.
- [ ] Milestone 7: observed ore clusters and independently validated exact simulation.
- [ ] Milestone 8: optional authenticated companion and precision runner.
- [ ] Milestone 9: full production security, accessibility, deployment and performance review.

Java 26.2 update: available through its own pinned MIT browser adapter, including sulfur-cave sampling, structure predictions and regression coverage. New worlds default to 26.2. The interface now uses a larger rem-based type scale, with 12 px minimum labels and 14–16 px primary text at standard browser defaults.

Next milestone: expand independent vanilla biome and structure fixtures, implement the remaining 26.x browser adapters, and add bounded generation caching. Keep every capability predicted or unsupported until its reference suite passes. The optional companion is not part of ordinary browser search.
