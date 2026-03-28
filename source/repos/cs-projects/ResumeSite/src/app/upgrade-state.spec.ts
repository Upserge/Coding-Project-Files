import { UpgradeState } from './upgrade-state';
import { UPGRADE_POOL, Upgrade } from './upgrade-registry';

function findUpgrade(id: string): Upgrade {
  const u = UPGRADE_POOL.find(u => u.id === id);
  if (!u) throw new Error(`Upgrade ${id} not found`);
  return u;
}

describe('UpgradeState', () => {
  let state: UpgradeState;

  beforeEach(() => {
    state = new UpgradeState();
  });

  describe('score tracking', () => {
    it('should start at zero', () => {
      expect(state.score).toBe(0);
    });

    it('should accumulate points', () => {
      state.addScore(3);
      state.addScore(2);
      expect(state.score).toBe(5);
    });
  });

  describe('applyUpgrade', () => {
    it('should increment stack count', () => {
      state.applyUpgrade(findUpgrade('bigger-push'));
      expect(state.getStacks('bigger-push')).toBe(1);
    });

    it('should not exceed maxStacks', () => {
      const upgrade = findUpgrade('momentum-lock'); // maxStacks: 2
      state.applyUpgrade(upgrade);
      state.applyUpgrade(upgrade);
      state.applyUpgrade(upgrade);
      expect(state.getStacks('momentum-lock')).toBe(2);
    });

    it('should track multiple upgrades independently', () => {
      state.applyUpgrade(findUpgrade('bigger-push'));
      state.applyUpgrade(findUpgrade('tractor-aim'));
      expect(state.getStacks('bigger-push')).toBe(1);
      expect(state.getStacks('tractor-aim')).toBe(1);
    });
  });

  describe('checkMilestone', () => {
    it('should trigger at first milestone (score 1)', () => {
      expect(state.checkMilestone(1)).toBeTrue();
    });

    it('should not trigger below first milestone', () => {
      expect(state.checkMilestone(0)).toBeFalse();
    });

    it('should trigger at each fixed milestone in order', () => {
      expect(state.checkMilestone(1)).toBeTrue();   // milestone 0
      expect(state.checkMilestone(5)).toBeTrue();   // milestone 1
      expect(state.checkMilestone(15)).toBeTrue();  // milestone 2
      expect(state.checkMilestone(30)).toBeTrue();  // milestone 3
      expect(state.checkMilestone(50)).toBeTrue();  // milestone 4
    });

    it('should not double-trigger the same milestone', () => {
      expect(state.checkMilestone(1)).toBeTrue();
      expect(state.checkMilestone(1)).toBeFalse();
      expect(state.checkMilestone(3)).toBeFalse();
    });

    it('should trigger repeating milestones every 20 after 50', () => {
      // Exhaust fixed milestones
      state.checkMilestone(1);
      state.checkMilestone(5);
      state.checkMilestone(15);
      state.checkMilestone(30);
      state.checkMilestone(50);

      expect(state.checkMilestone(70)).toBeTrue();  // 50 + 20
      expect(state.checkMilestone(70)).toBeFalse(); // same score
      expect(state.checkMilestone(90)).toBeTrue();  // 50 + 40
    });
  });

  describe('nextMilestoneProgress', () => {
    it('should start at 0/1 fraction 0', () => {
      const progress = state.nextMilestoneProgress();
      expect(progress.current).toBe(0);
      expect(progress.target).toBe(1);
      expect(progress.fraction).toBe(0);
    });

    it('should show progress toward first milestone', () => {
      // First milestone is at score 1, prev is 0
      // At score 0: progress 0/1
      expect(state.nextMilestoneProgress().fraction).toBe(0);
    });

    it('should show progress toward second milestone after first triggers', () => {
      state.addScore(1);
      state.checkMilestone(1); // triggers milestone 0, now looking at milestone 1 (score 5)
      const progress = state.nextMilestoneProgress();
      // prev = MILESTONES[0] = 1, target = MILESTONES[1] = 5, range = 4
      // current score = 1, progress = 1 - 1 = 0
      expect(progress.target).toBe(4);
      expect(progress.current).toBe(0);
    });

    it('should show repeating interval progress after fixed milestones', () => {
      state.addScore(55);
      state.checkMilestone(1);
      state.checkMilestone(5);
      state.checkMilestone(15);
      state.checkMilestone(30);
      state.checkMilestone(50);
      const progress = state.nextMilestoneProgress();
      expect(progress.target).toBe(20);
      expect(progress.current).toBe(5);
    });

    it('should cap fraction at 1', () => {
      state.addScore(100);
      // Don't trigger milestones — fraction capped at 1
      const progress = state.nextMilestoneProgress();
      expect(progress.fraction).toBeLessThanOrEqual(1);
    });
  });

  describe('computeScorePoints', () => {
    it('should return 1 with no double-collapse stacks', () => {
      expect(state.computeScorePoints()).toBe(1);
    });

    it('should return 1 or 2 with double-collapse stacks', () => {
      state.applyUpgrade(findUpgrade('double-collapse'));
      const results = new Set<number>();
      for (let i = 0; i < 200; i++) {
        results.add(state.computeScorePoints());
      }
      expect(results.has(1)).toBeTrue();
      // With 20% chance, should see 2 in 200 tries
      expect(results.has(2)).toBeTrue();
    });
  });

  describe('modifiers', () => {
    it('should return base values with no upgrades', () => {
      const mods = state.modifiers;
      expect(mods.repulseRadiusMul).toBe(1);
      expect(mods.repulseForceMul).toBe(1);
      expect(mods.dragRetention).toBe(0.98);
      expect(mods.goalRadiusMul).toBe(1);
      expect(mods.gravityWellStrength).toBe(0);
      expect(mods.tractorAimStrength).toBe(0);
      expect(mods.doubleCollapseChance).toBe(0);
      expect(mods.extraRockets).toBe(0);
      expect(mods.extraGoals).toBe(0);
      expect(mods.chainReactionActive).toBeFalse();
    });

    it('should scale with stacks', () => {
      state.applyUpgrade(findUpgrade('bigger-push'));
      state.applyUpgrade(findUpgrade('bigger-push'));
      expect(state.modifiers.repulseRadiusMul).toBeCloseTo(1.4);
    });

    it('should reflect multi-rocket stacks as extra rockets', () => {
      state.applyUpgrade(findUpgrade('multi-rocket'));
      expect(state.modifiers.extraRockets).toBe(1);
    });

    it('should reflect dark-matter-rush as extra goals', () => {
      state.applyUpgrade(findUpgrade('dark-matter-rush'));
      expect(state.modifiers.extraGoals).toBe(2);
    });
  });

  describe('chain reaction', () => {
    it('should not activate without chain-reaction stacks', () => {
      state.triggerChainReaction();
      expect(state.modifiers.chainReactionActive).toBeFalse();
    });

    it('should activate with chain-reaction stacks', () => {
      state.applyUpgrade(findUpgrade('chain-reaction'));
      state.triggerChainReaction();
      expect(state.modifiers.chainReactionActive).toBeTrue();
    });

    it('should deactivate after enough ticks', () => {
      state.applyUpgrade(findUpgrade('chain-reaction'));
      state.triggerChainReaction();
      for (let i = 0; i < 90; i++) {
        state.tickChainReaction();
      }
      expect(state.modifiers.chainReactionActive).toBeFalse();
    });

    it('should enlarge goalRadiusMul when active', () => {
      state.applyUpgrade(findUpgrade('chain-reaction'));
      const baseMul = state.modifiers.goalRadiusMul;
      state.triggerChainReaction();
      expect(state.modifiers.goalRadiusMul).toBeGreaterThan(baseMul);
    });
  });
});
