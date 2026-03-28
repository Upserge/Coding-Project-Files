import { UPGRADE_POOL, pickRandomUpgrades, getCategoryIcon, RARITY_COLORS, RARITY_LABELS, UpgradeRarity } from './upgrade-registry';

describe('upgrade-registry', () => {

  describe('UPGRADE_POOL integrity', () => {
    it('should have unique ids', () => {
      const ids = UPGRADE_POOL.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have a valid rarity on every upgrade', () => {
      const validRarities: UpgradeRarity[] = ['common', 'uncommon', 'rare', 'ultra-rare'];
      for (const u of UPGRADE_POOL) {
        expect(validRarities).toContain(u.rarity);
      }
    });

    it('should have maxStacks >= 1 for every upgrade', () => {
      for (const u of UPGRADE_POOL) {
        expect(u.maxStacks).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('pickRandomUpgrades', () => {
    it('should return the requested number of upgrades', () => {
      const result = pickRandomUpgrades(new Map(), 3);
      expect(result.length).toBe(3);
    });

    it('should return fewer if pool is too small', () => {
      const maxedAll = new Map(UPGRADE_POOL.map(u => [u.id, u.maxStacks]));
      const result = pickRandomUpgrades(maxedAll, 3);
      expect(result.length).toBe(0);
    });

    it('should exclude upgrades at max stacks', () => {
      const stacks = new Map<string, number>();
      stacks.set('bigger-push', 3);
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        for (const u of pickRandomUpgrades(stacks, 3)) {
          results.add(u.id);
        }
      }
      expect(results.has('bigger-push')).toBeFalse();
    });

    it('should never return duplicate upgrades in a single pick', () => {
      for (let i = 0; i < 50; i++) {
        const result = pickRandomUpgrades(new Map(), 3);
        const ids = result.map(u => u.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('should still work when requesting 1 upgrade', () => {
      const result = pickRandomUpgrades(new Map(), 1);
      expect(result.length).toBe(1);
    });

    it('should cap at available pool size when requesting more than available', () => {
      const stacks = new Map<string, number>();
      // Max out all but one
      for (const u of UPGRADE_POOL.slice(1)) {
        stacks.set(u.id, u.maxStacks);
      }
      const result = pickRandomUpgrades(stacks, 3);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(UPGRADE_POOL[0].id);
    });
  });

  describe('getCategoryIcon', () => {
    it('should return an emoji for each category', () => {
      expect(getCategoryIcon('mobility')).toBeTruthy();
      expect(getCategoryIcon('control')).toBeTruthy();
      expect(getCategoryIcon('scoring')).toBeTruthy();
      expect(getCategoryIcon('chaos')).toBeTruthy();
    });
  });

  describe('RARITY_COLORS', () => {
    it('should have a color for every rarity tier', () => {
      const rarities: UpgradeRarity[] = ['common', 'uncommon', 'rare', 'ultra-rare'];
      for (const r of rarities) {
        expect(RARITY_COLORS[r]).toBeTruthy();
      }
    });
  });

  describe('RARITY_LABELS', () => {
    it('should have a label for every rarity tier', () => {
      const rarities: UpgradeRarity[] = ['common', 'uncommon', 'rare', 'ultra-rare'];
      for (const r of rarities) {
        expect(RARITY_LABELS[r]).toBeTruthy();
      }
    });
  });
});
