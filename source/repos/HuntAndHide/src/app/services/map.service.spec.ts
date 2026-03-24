import { MapService } from './map.service';
import { ObstacleType } from '../models/map.model';

/** Every obstacle type the map generator should produce. */
const EXPECTED_TYPES: ObstacleType[] = [
  'tree', 'bush', 'leaf_pile', 'hole', 'sedan',
  'safari_gear', 'rock', 'tent', 'picnic_scene',
];

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    service = new MapService();
  });

  describe('generateJungleMap', () => {
    it('should return a map with id "jungle"', () => {
      const map = service.generateJungleMap();
      expect(map.id).toBe('jungle');
    });

    it('should generate obstacles for every registered type', () => {
      const map = service.generateJungleMap();
      const producedTypes = new Set(map.obstacles.map(o => o.type));

      for (const type of EXPECTED_TYPES) {
        expect(producedTypes.has(type))
          .withContext(`Map should contain at least one "${type}" obstacle`)
          .toBeTrue();
      }
    });

    it('should assign unique ids to all obstacles', () => {
      const map = service.generateJungleMap();
      const ids = map.obstacles.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should place obstacles within map bounds', () => {
      const map = service.generateJungleMap();
      const halfW = map.width / 2;
      const halfD = map.depth / 2;

      for (const obs of map.obstacles) {
        expect(Math.abs(obs.position.x)).toBeLessThanOrEqual(halfW);
        expect(Math.abs(obs.position.z)).toBeLessThanOrEqual(halfD);
      }
    });

    it('should cache the map on repeated calls', () => {
      const first = service.generateJungleMap();
      const second = service.generateJungleMap();
      expect(first).toBe(second);
    });

    it('should regenerate after resetMap', () => {
      const first = service.generateJungleMap();
      service.resetMap();
      const second = service.generateJungleMap();
      expect(first).not.toBe(second);
    });
  });

  describe('water features', () => {
    it('should generate at least one pond', () => {
      const map = service.generateJungleMap();
      const ponds = map.waterFeatures.filter(w => w.type === 'pond');
      expect(ponds.length)
        .withContext('Map should contain at least one pond')
        .toBeGreaterThan(0);
    });

    it('should assign unique ids to all water features', () => {
      const map = service.generateJungleMap();
      const ids = map.waterFeatures.map(w => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should assign positive size to every water feature', () => {
      const map = service.generateJungleMap();
      for (const water of map.waterFeatures) {
        expect(water.size)
          .withContext(`Water feature "${water.id}" should have positive size`)
          .toBeGreaterThan(0);
      }
    });
  });
});
