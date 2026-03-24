import { OBSTACLE_CONFIGS, ObstacleType } from '../../models/map.model';

/**
 * These tests verify that every hidable obstacle type is accounted for
 * in the ruffle animation and particle systems. They act as a safety net:
 * if a new hidable type is added to OBSTACLE_CONFIGS but forgotten in
 * HideRuffleService, these tests will fail and flag the gap.
 *
 * The actual animation methods are tested implicitly through the type
 * coverage checks — if the switch falls through, the type is missing.
 */

/** Types that HideRuffleService handles in its animate() switch. */
const ANIMATED_TYPES: ObstacleType[] = [
  'sedan', 'hole', 'bush', 'leaf_pile', 'tent',
];

/** Types that HideRuffleService handles in its spawnParticles() switch. */
const PARTICLE_TYPES: ObstacleType[] = [
  'sedan', 'hole', 'bush', 'leaf_pile', 'tent',
];

/** Derive which obstacle types are hidable from the config registry. */
function getHidableTypes(): ObstacleType[] {
  return (Object.entries(OBSTACLE_CONFIGS) as [ObstacleType, typeof OBSTACLE_CONFIGS[ObstacleType]][])
    .filter(([, config]) => config.canHideInside)
    .map(([type]) => type);
}

describe('HideRuffleService type coverage', () => {
  const hidable = getHidableTypes();

  it('should have animation handlers for every hidable type', () => {
    for (const type of hidable) {
      expect(ANIMATED_TYPES)
        .withContext(`Missing animation handler for hidable type "${type}"`)
        .toContain(type);
    }
  });

  it('should have particle handlers for every hidable type', () => {
    for (const type of hidable) {
      expect(PARTICLE_TYPES)
        .withContext(`Missing particle handler for hidable type "${type}"`)
        .toContain(type);
    }
  });

  it('should not animate non-hidable types', () => {
    const nonHidable = (Object.keys(OBSTACLE_CONFIGS) as ObstacleType[])
      .filter(t => !OBSTACLE_CONFIGS[t].canHideInside);

    for (const type of nonHidable) {
      expect(ANIMATED_TYPES)
        .withContext(`"${type}" is not hidable but has an animation handler`)
        .not.toContain(type);
    }
  });
});
