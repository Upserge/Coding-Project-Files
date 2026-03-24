import {
  ALL_FOLIAGE_GLB_ENTRIES,
  TREE_GLB_ENTRIES,
  BUSH_GLB_ENTRIES,
  TENT_GLB_ENTRIES,
  PICNIC_GLB_ENTRIES,
  TREE_VARIANT_KEYS,
  BUSH_VARIANT_KEYS,
  TREE_MODEL_DEF,
  BUSH_MODEL_DEF,
  TENT_MODEL_DEF,
  PICNIC_MODEL_DEF,
} from './foliage-model.config';

describe('Foliage model config', () => {
  describe('ALL_FOLIAGE_GLB_ENTRIES', () => {
    it('should include all tree entries', () => {
      for (const entry of TREE_GLB_ENTRIES) {
        expect(ALL_FOLIAGE_GLB_ENTRIES).toContain(entry);
      }
    });

    it('should include all bush entries', () => {
      for (const entry of BUSH_GLB_ENTRIES) {
        expect(ALL_FOLIAGE_GLB_ENTRIES).toContain(entry);
      }
    });

    it('should include tent entries', () => {
      for (const entry of TENT_GLB_ENTRIES) {
        expect(ALL_FOLIAGE_GLB_ENTRIES).toContain(entry);
      }
    });

    it('should include picnic entries', () => {
      for (const entry of PICNIC_GLB_ENTRIES) {
        expect(ALL_FOLIAGE_GLB_ENTRIES).toContain(entry);
      }
    });

    it('should have no duplicate keys', () => {
      const keys = ALL_FOLIAGE_GLB_ENTRIES.map(e => e.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe('GLB entries', () => {
    it('should have at least one tree variant', () => {
      expect(TREE_GLB_ENTRIES.length).toBeGreaterThan(0);
    });

    it('should have at least one bush variant', () => {
      expect(BUSH_GLB_ENTRIES.length).toBeGreaterThan(0);
    });

    for (const entry of ALL_FOLIAGE_GLB_ENTRIES) {
      it(`"${entry.key}" should have a path starting with models/foliage/`, () => {
        expect(entry.path).toMatch(/^models\/foliage\/.+\.glb$/);
      });

      it(`"${entry.key}" should have a non-empty key`, () => {
        expect(entry.key.length).toBeGreaterThan(0);
      });
    }
  });

  describe('Variant key arrays', () => {
    it('TREE_VARIANT_KEYS should match TREE_GLB_ENTRIES keys', () => {
      expect(TREE_VARIANT_KEYS).toEqual(TREE_GLB_ENTRIES.map(e => e.key));
    });

    it('BUSH_VARIANT_KEYS should match BUSH_GLB_ENTRIES keys', () => {
      expect(BUSH_VARIANT_KEYS).toEqual(BUSH_GLB_ENTRIES.map(e => e.key));
    });
  });

  describe('Model definitions', () => {
    for (const [name, def] of [
      ['TREE_MODEL_DEF', TREE_MODEL_DEF],
      ['BUSH_MODEL_DEF', BUSH_MODEL_DEF],
      ['TENT_MODEL_DEF', TENT_MODEL_DEF],
      ['PICNIC_MODEL_DEF', PICNIC_MODEL_DEF],
    ] as const) {
      it(`${name} should have positive dimensions`, () => {
        expect(def.width).toBeGreaterThan(0);
        expect(def.depth).toBeGreaterThan(0);
        expect(def.height).toBeGreaterThan(0);
      });
    }
  });
});
