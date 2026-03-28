import { applyTractorAim, applyGravityWell } from './upgrade-physics';
import { Particle, GoalPost } from './particle-field-types';

function makeParticle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 100, y: 100, vx: 1, vy: 0, r: 2, opacity: 1,
    driftAngle: 0, driftRate: 0, golden: true, pushTime: 10,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<GoalPost> = {}): GoalPost {
  return {
    x: 300, y: 100, pulsePhase: 0, scored: false,
    scoreTimer: 0, radius: 30, diskTilt: 0.3, diskAxis: 0.5, spinSpeed: 0.01,
    ...overrides,
  };
}

describe('upgrade-physics', () => {

  describe('applyTractorAim', () => {
    it('should steer particle toward nearest unscored goal', () => {
      const p = makeParticle({ x: 100, y: 100, vx: 0, vy: 0 });
      const goals = [makeGoal({ x: 300, y: 100 })];

      applyTractorAim(p, goals, 0.5);

      expect(p.vx).toBeGreaterThan(0);
      expect(p.vy).toBeCloseTo(0, 5);
    });

    it('should pick the closer goal when multiple exist', () => {
      const p = makeParticle({ x: 100, y: 100, vx: 0, vy: 0 });
      const nearGoal = makeGoal({ x: 150, y: 100 });
      const farGoal = makeGoal({ x: 500, y: 500 });

      applyTractorAim(p, [farGoal, nearGoal], 0.5);

      // Should steer toward nearGoal (positive x, zero y)
      expect(p.vx).toBeGreaterThan(0);
    });

    it('should skip scored goals', () => {
      const p = makeParticle({ x: 100, y: 100, vx: 0, vy: 0 });
      const scored = makeGoal({ x: 150, y: 100, scored: true });
      const active = makeGoal({ x: 100, y: 300 });

      applyTractorAim(p, [scored, active], 0.5);

      // Should steer toward active goal (positive y)
      expect(p.vy).toBeGreaterThan(0);
    });

    it('should do nothing with no unscored goals', () => {
      const p = makeParticle({ vx: 1, vy: 2 });
      const scored = makeGoal({ scored: true });

      applyTractorAim(p, [scored], 0.5);

      expect(p.vx).toBe(1);
      expect(p.vy).toBe(2);
    });

    it('should do nothing with empty goals array', () => {
      const p = makeParticle({ vx: 1, vy: 2 });
      applyTractorAim(p, [], 0.5);
      expect(p.vx).toBe(1);
      expect(p.vy).toBe(2);
    });
  });

  describe('applyGravityWell', () => {
    it('should pull particle toward goal within range', () => {
      const p = makeParticle({ x: 200, y: 100, vx: 0, vy: 0 });
      const goal = makeGoal({ x: 300, y: 100 });

      applyGravityWell(p, [goal], 0.5, 200);

      expect(p.vx).toBeGreaterThan(0);
    });

    it('should not affect particle outside maxRange', () => {
      const p = makeParticle({ x: 100, y: 100, vx: 0, vy: 0 });
      const goal = makeGoal({ x: 500, y: 500 });

      applyGravityWell(p, [goal], 0.5, 50);

      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
    });

    it('should skip scored goals', () => {
      const p = makeParticle({ x: 200, y: 100, vx: 0, vy: 0 });
      const goal = makeGoal({ x: 300, y: 100, scored: true });

      applyGravityWell(p, [goal], 0.5, 200);

      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
    });

    it('should accumulate pull from multiple goals in range', () => {
      const p = makeParticle({ x: 200, y: 200, vx: 0, vy: 0 });
      const g1 = makeGoal({ x: 250, y: 200 });
      const g2 = makeGoal({ x: 200, y: 250 });

      applyGravityWell(p, [g1, g2], 0.5, 200);

      expect(p.vx).toBeGreaterThan(0);
      expect(p.vy).toBeGreaterThan(0);
    });

    it('should produce zero effect with zero strength', () => {
      const p = makeParticle({ x: 200, y: 100, vx: 0, vy: 0 });
      const goal = makeGoal({ x: 300, y: 100 });

      applyGravityWell(p, [goal], 0, 200);

      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
    });
  });
});
