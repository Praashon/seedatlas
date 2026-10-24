# Deployment

## Static, local or hosted

Build with Node 24 and `npm ci && npm run build`. Deploy `apps/web/dist` at the origin root using a static HTTPS server. Serve `.wasm` as `application/wasm`, JS as JavaScript and retain all files in `engine`, `assets` and `licenses`. No secret environment variables are needed. Localhost also works. The production service worker precaches the complete static build and keeps worlds in IndexedDB, separately from application caches.

Use a Content-Security-Policy allowing the site's own scripts, workers, fonts, styles, images and `wasm-unsafe-eval`. Inline React styles are used for marker positioning, so a strict style-src policy must account for style attributes. No third-party resource origins are required. Use HSTS on a dedicated HTTPS origin, X-Content-Type-Options nosniff and an appropriate referrer policy. Do not cache index.html or sw.js indefinitely at the CDN; hashed asset files may be immutable.

## Optional community API

Build the API with Rust stable and `cargo build --release --locked -p seedatlas-api`. Default bind is loopback. Use a reverse proxy and HTTPS if exposing the health service. Accounts and sync are not implemented, so the service is not a hosted user-data backend yet.

## Database foundation

Docker Compose requires an explicit POSTGRES_PASSWORD. Only a loopback database port is published. A new named volume runs SQL initialization. Existing databases need a real migration runner, backups and reviewed upgrades. Initial schema includes owner-scoped foreign keys and revision/event foundations but no authenticated CRUD routes.

Back up with a trusted version-matched pg_dump and restore to an isolated database before relying on a backup. Never load an untrusted SQL dump as an administrator. Future private API access requires owner authorization even with these schema constraints.

## Limits

Static hosting can be free or self-hosted; third-party free plans have their own limits. No subscription or payment infrastructure exists. Browser generation uses one search worker plus one map worker, bounded scans, a 128 MiB ceiling per engine instance and cancellation through worker termination. An optional precision service must later enforce separate CPU, memory and timeout limits.
