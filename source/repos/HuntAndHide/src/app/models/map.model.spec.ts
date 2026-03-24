import { OBSTACLE_CONFIGS, ObstacleType } from './map.model';

/** All obstacle types that must exist in the config registry. */
const ALL_TYPES: ObstacleType[] = [
  'tree', 'bush', 'leaf_pile', 'hole', 'sedan',
  'safari_gear', 'rock', 'tent', 'picnic_scene',
];

/** Types players can hide inside — must match canHideInside: true. */
const HIDABLE_TYPES: ObstacleType[] = [
  'bush', 'leaf_pile', 'hole', 'sedan', 'tent',
];

describe('OBSTACLE_CONFIGS', () => {
  it('should have a config entry for every ObstacleType', () => {
    for (const type of ALL_TYPES) {
      expect(OBSTACLE_CONFIGS[type]).toBeDefined(`Missing config for "${type}"`);
    }
  });

  it('should have a type field that matches its key', () => {
    for (const [key, config] of Object.entries(OBSTACLE_CONFIGS)) {
      expect(config.type).toBe(key);
    }
  });

  it('should have positive collision footprints for all types', () => {
    for (const [key, config] of Object.entries(OBSTACLE_CONFIGS)) {
      expect(config.size.x).toBeGreaterThan(0, `${key} has non-positive x size`);
      expect(config.size.z).toBeGreaterThan(0, `${key} has non-positive z size`);
    }
  });

  it('should mark expected types as hidable', () => {
    for (const type of HIDABLE_TYPES) {
      expect(OBSTACLE_CONFIGS[type].canHideInside)
        .withContext(`"${type}" should be hidable`)
        .toBeTrue();
    }
  });

  it('should not mark non-hidable types as hidable', () => {
    const nonHidable = ALL_TYPES.filter(t => !HIDABLE_TYPES.includes(t));
    for (const type of nonHidable) {
      expect(OBSTACLE_CONFIGS[type].canHideInside)
        .withContext(`"${type}" should not be hidable`)
        .toBeFalse();
    }
  });
});
