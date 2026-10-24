# Security

Do not put secrets, private world saves, seeds, tokens or personal notes into public issues. Use the repository owner's private reporting channel when available. No dedicated security mailbox is configured yet.

This foundation stores guest data in browser IndexedDB and performs generation locally. It has no login, uploads, telemetry or server synchronization. The optional API binds to loopback by default and exposes only health and service capabilities. Do not expose a database port publicly.

Future auth must use established OIDC, server-managed HttpOnly sessions, OAuth state and PKCE, CSRF defenses, per-resource owner checks and bounded requests. Future save readers must treat NBT and compression as untrusted and limit all input sizes. Future companion connections must authenticate a loopback channel and reject unauthorized origins. Neither importer nor companion is shipped in this release.
