# Third-party notices

| Component | License | Source and distribution |
| --- | --- | --- |
| Cubiomes | MIT, copyright 2020 Cubitect | https://github.com/Cubitect/cubiomes, commit e61f90580cbdd883214a8054670dacae655e59c0; unmodified source in native/cubiomes, compiled JS/WASM in apps/web/public/engine |
| Cubiomes Java 26.2 adapter | MIT, original copyright 2020 Cubitect; active fork maintained by xpple | https://github.com/xpple/cubiomes, commit d934de1d4e5e71db0b789296241f929a50306504; selected source in native/cubiomes-26, separate atlas26 JS/WASM; original license retained |
| Poppins | SIL Open Font License 1.1, copyright 2020 The Poppins Project Authors | https://github.com/itfoundry/Poppins; bundled locally via @fontsource/poppins, full license in apps/web/public/licenses |
| Lucide React | ISC, copyright 2026 Lucide Icons and Contributors | https://github.com/lucide-icons/lucide; full notice in apps/web/public/licenses |
| React / React DOM | MIT | https://github.com/facebook/react; full notice in apps/web/public/licenses |
| Emscripten generated runtime | MIT / University of Illinois NCSA | https://github.com/emscripten-core/emscripten; compiler/runtime notices in apps/web/public/licenses |

Development dependencies and transitive runtime packages retain their license metadata in npm and Cargo package distributions and lockfiles. The browser bundle's direct runtime dependencies are React, React DOM, Lucide and Poppins. Vite, Vitest, Playwright, Prettier and ESLint are development tools.

The SeedForge project was inspected for architecture and compatibility research; none of its patches, generated tables, assets or source were incorporated. No Minecraft game binaries, source, textures, sounds or extracted registry data are included.
