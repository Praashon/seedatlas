#include "generator.h"
#include "finders.h"
#include "util.h"
#include <stdint.h>

static Generator generator;
static uint64_t world_seed;
static int current_version;
static int current_dimension;
static int result_x, result_z;

int atlas_init(int version, int dimension, uint32_t low, uint32_t high) {
    if (version != MC_1_18_2 && version != MC_1_20_6 && version != MC_1_21_3) return 0;
    if (dimension != DIM_OVERWORLD && dimension != DIM_NETHER && dimension != DIM_END) return 0;
    current_version = version;
    current_dimension = dimension;
    world_seed = ((uint64_t)high << 32) | low;
    setupGenerator(&generator, version, 0);
    applySeed(&generator, dimension, world_seed);
    return 1;
}
int atlas_biome(int x, int y, int z) { return getBiomeAt(&generator, 1, x, y, z); }
const char *atlas_biome_name(int biome) { return biome2str(current_version, biome); }
int atlas_biome_supported(int biome) { return biomeExists(current_version, biome) && getDimension(biome) == current_dimension; }
int atlas_region_size(int type) {
    StructureConfig config;
    if (!getStructureConfig(type, current_version, &config) || config.dim != current_dimension) return 0;
    return config.regionSize * 16;
}
int atlas_structure(int type, int region_x, int region_z) {
    Pos position;
    if (!atlas_region_size(type)) return 0;
    if (!getStructurePos(type, current_version, world_seed, region_x, region_z, &position)) return 0;
    if (!isViableStructurePos(type, &generator, position.x, position.z, 0)) return 0;
    result_x = position.x;
    result_z = position.z;
    return 1;
}
int atlas_result_x(void) { return result_x; }
int atlas_result_z(void) { return result_z; }
