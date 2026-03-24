import {
  ALL_WATER_GLB_ENTRIES,
  POND_GLB_ENTRIES,
  POND_MODEL_DEF,
} from './water-model.config';

describe('Water model config', () => {
  describe('ALL_WATER_GLB_ENTRIES', () => {
    it('should include all pond entries', () => {
      for (const entry of POND_GLB_ENTRIES) {
        expect(ALL_WATER_GLB_ENTRIES).toContain(entry);
      }
    });

    it('should have no duplicate keys', () => {
      const keys = ALL_WATER_GLB_ENTRIES.map(e => e.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe('GLB entries', () => {
    for (const entry of ALL_WATER_GLB_ENTRIES) {
      it(`"${entry.key}" should have a path starting with models/water_features/`, () => {
        expect(entry.path).toMatch(/^models\/water_features\/.+\.glb$/);
      });

      it(`"${entry.key}" should have a non-empty key`, () => {
        expect(entry.key.length).toBeGreaterThan(0);
      });
    }
  });

  describe('Model definitions', () => {
    it('POND_MODEL_DEF should have positive dimensions', () => {
      expect(POND_MODEL_DEF.width).toBeGreaterThan(0);
      expect(POND_MODEL_DEF.depth).toBeGreaterThan(0);
      expect(POND_MODEL_DEF.height).toBeGreaterThan(0);
    });
  });
});
