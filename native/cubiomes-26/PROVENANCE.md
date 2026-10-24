# Java 26.2 adapter source

Source: [xpple/cubiomes](https://github.com/xpple/cubiomes), an active MIT-licensed fork of Cubitect/cubiomes.

Pinned commit: `d934de1d4e5e71db0b789296241f929a50306504`.

The selected core C/header files, biome tables, feature headers and regression examples are copied without algorithm changes from that commit. The original MIT LICENSE is retained. The browser build compiles only the biome and structure paths; ore simulation, loot, carvers and full terrain APIs are not exposed.

This adapter is compiled separately as `atlas26.js` and `atlas26.wasm`. The existing legacy binary remains separate. Our wrapper accepts public version ID 262, explicitly maps structure IDs where the fork's enum differs, and refuses other versions. The registry exposes only Java 26.2 even though the fork also contains later-version code.

`tests/test_biomes.c` and `tests/test_structures.c` are primary upstream regression references. SeedAtlas additionally checks published 26.2 sulfur-cave, snowy-village and trial-chamber predictions from [Seeder](https://mcseeder.com/versions/26.2/). These establish useful regression coverage but are not a comprehensive independent vanilla reference suite. Results remain labeled predicted. No Minecraft game binaries or Java source are included.
