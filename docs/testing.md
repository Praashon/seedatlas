# Verification record

## Current evidence

- Unit tests exercise Java UTF-16 hashes, signed 64-bit bounds, full seed halves, negative coordinate flooring, dimension heights, distances, scan budgets and capability refusal.
- WASM tests run the shipped binary, including the upstream 1.18 seed 262 mushroom-fields example, dimension isolation and negative-coordinate determinism.
- Browser tests execute real worker searches, guest persistence across reload, visited state, saved waypoints, dimension changes, unsupported-version refusal and mobile overflow checks.
- Rust tests ensure the service does not advertise unimplemented account, sync or precision features.
- Production browser coverage disconnects the network, reloads the precached atlas, and computes a different seed entirely offline. Desktop and mobile screenshots are reviewed for layout.

The Java 26.2 update adds a separate binary regression suite for sulfur-cave and surface-height samples, published village/trial-chamber predictions, the primary fork End-ring case, stable structure IDs, Nether isolation and full-range seeds. Browser coverage includes 26.2 sulfur-cave search, larger computed font sizes, desktop/mobile layouts and a 125 percent display-scaling regression. These remain prediction-level checks, not comprehensive vanilla validation.

Executed locally: TypeScript checks, ESLint, Prettier checks, production build, unit/WASM suites, desktop/mobile browser tests, the production offline test, one Rust unit test, rustfmt and Clippy with warnings denied. The initial GitHub Actions run also verified the PostgreSQL migration on a clean PostgreSQL 17.11 instance. npm dependency audit reported zero vulnerabilities. This is not a complete production security or accessibility audit.

These are regression tests, not independent vanilla generation validation. Exact world-generation status remains unavailable.

## Reference-world work still required

For each supported version and preset, generate reference worlds locally using a licensed matching vanilla installation. Extract biome samples and structure presence/absence over multiple seeds, heights, dimensions and negative chunk boundaries. Record generator parameters and version provenance. Do not commit game binaries or proprietary source. Add both expected matches and expected non-matches before promoting a capability.

Ore simulation requires full block-set comparisons, replacement-rule and air-exposure cases, feature ordering, neighboring-chunk generation and original generation history. A handful of visual matches is insufficient.

## Environment limits

Docker and psql were not available during initial implementation. The SQL migration and Compose service are provided, but their runtime integration was not verified here. CI includes a disposable PostgreSQL migration check. The optional Java runner and companion are intentionally absent pending version-specific implementation.
