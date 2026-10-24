# Compatibility research

Research date: 2026-10-24. These are implementation boundaries, not a claim that every requested milestone is complete.

## Primary references inspected

- [Minecraft 26.1 release](https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1): Java 25 and dimension-directory migration affect a future importer and runner. Read `dimensions/minecraft/{overworld,the_nether,the_end}` as version-aware paths; do not infer original generation version from chunk DataVersion.
- [Minecraft 26.2 release](https://www.minecraft.net/en-us/article/minecraft-java-edition-26-2): underground sulfur caves require the new biome parameters and height-aware sampling.
- [Minecraft 26.3 release](https://www.minecraft.net/en-us/article/minecraft-java-edition-26-3): dappled forests, abandoned camps, data pack 121.0, and level.dat version history. This requires a distinct capability adapter.
- [Fabric 26.3 technical guidance](https://fabricmc.net/2026/09/15/263.html): worldgen feature definitions and material-rule registries changed. Copying an earlier adapter's support status is unsafe.
- [26.4 Snapshot 5](https://www.minecraft.net/en-us/article/minecraft-26-4-snapshot-5): ore/scattered ore changes are another reason not to inherit ore simulation support.
- [Fabric developer documentation](https://docs.fabricmc.net/): relevant for the later optional companion, not needed for browser exploration.
- [Cubiomes source and README](https://github.com/Cubitect/cubiomes): inspected version enum, generator, placement and biome APIs. Upstream enumerates the 1.21 winter drop as its newest version. It cannot be treated as a 26.x implementation. It explicitly documents structure false positives from terrain conditions and does not generate actual ore blocks.
- [SeedForge](https://github.com/fwsoapy/seedforge): inspected browser-worker architecture, binding/build script and patch provenance. Its newer patches are not incorporated. Transitive biome table provenance and independent vanilla fixtures need review before reuse.
- [Minecraft EULA](https://www.minecraft.net/en-us/eula) and [usage guidelines](https://www.minecraft.net/en-us/usage-guidelines): reviewed for the distribution boundary. No Minecraft binaries, original assets, game source, or branding are bundled. This project is unofficial and not affiliated with Mojang or Microsoft.

## Accuracy policy

Upstream algorithms run locally, but project-owned vanilla reference worlds have not yet been supplied. Consequently enabled older adapters are **predicted with limitations**, not exact and validated. The upstream seed 262 mushroom-fields example is a regression fixture for the binding, not independent validation of all generation. A repeated output only establishes determinism.

Numeric seeds use signed 64-bit BigInt; non-numeric or out-of-range input follows Java UTF-16 String.hashCode. Empty input is rejected rather than silently replaced by a random seed. Block-to-chunk conversion floors negative values. Structure candidates use their individual region configuration, lower-48-bit placement and full-seed biome viability. Missing structure Y stays null. Terrain and full piece layout remain unverified.

Three-dimensional biome sampling passes actual Y to upstream, with explicit 4-block coordinate scaling. A map samples a plane at selected Y. A bounded lattice search can miss narrow biomes between samples; empty means no sampled match. Overworld, Nether and End are isolated. Custom presets and data packs are unavailable pending registry fingerprinting.

Exact ores require terrain, carvers, aquifers, replacement blocks, feature order, random streams, air exposure, and neighboring chunks. None is replaced by random points. Imported generated blocks would be observed data, while a precision runner would return simulated data. Each needs its own validation fixtures.

## Registry

| Version         | Biomes / structures | Ores        | Reason                                                            |
| --------------- | ------------------- | ----------- | ----------------------------------------------------------------- |
| 1.18.2          | Predicted, upstream | Unsupported | Upstream binding regression fixture, no independent vanilla suite |
| 1.20.6          | Predicted, upstream | Unsupported | No project-owned vanilla reference suite                          |
| 1.21.3          | Predicted, upstream | Unsupported | No project-owned vanilla reference suite                          |
| 26.1            | Unsupported         | Unsupported | Version-matched adapter and fixtures pending                      |
| 26.2            | Unsupported         | Unsupported | Sulfur-cave parameters and fixtures pending                       |
| 26.3            | Unsupported         | Unsupported | Registry, biome and abandoned-camp changes                        |
| 26.4 Snapshot 5 | Unsupported         | Unsupported | Experimental game version; ore changes                            |

Data pack and DataVersion values remain null unless checked against the corresponding official version metadata. No fabricated capability counts are used.
