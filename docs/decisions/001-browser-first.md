# ADR 001: Browser-first exploration

Accepted: 2026-10-24.

Use a vendored, pinned MIT Cubiomes core compiled to WebAssembly in a dedicated worker. Ship static JS/WASM so ordinary search does not require installing a mod or contacting an API. Preserve upstream notices. Use our own small wrapper instead of adopting patches with unresolved transitive provenance.

Expose honest predicted support for explicitly enumerated older adapters and unsupported states for 26.x. A new release never inherits exact support. Exact status requires independently generated vanilla fixtures covering positive and negative results across multiple seeds, heights and dimensions.

The optional local runner handles resource-intensive exact generation from user-owned game installations. The companion handles live coordinates and accessible block data. Neither is required for ordinary seed exploration. Do not redistribute Minecraft binaries or attempt to recover private server seeds.
