import { createRocketParticle, pickGoalForRocketSpawn, placeRocketNearGoal } from './particle-spawner';
import { GoalPost, Particle } from './particle-field-types';

function makeGoal(x: number, y: number, scored = false): GoalPost {
  return {
    x,
    y,
    scored,
    scoreTimer: 0,
    pulsePhase: 0,
    radius: 30,
    diskTilt: 0.2,
    diskAxis: 0,
    spinSpeed: 0.3,
  };
}

function makeRocket(x: number, y: number): Particle {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    r: 5,
    opacity: 1,
    driftAngle: 0,
    driftRate: 0,
    golden: true,
    pushTime: 0,
  };
}

describe('particle-spawner rocket placement', () => {
  it('places rockets in orbit around a goal', () => {
    const goal = makeGoal(400, 600);
    const rocket = createRocketParticle(800, 1200, 0.15);
    placeRocketNearGoal(rocket, 800, 1200, goal, []);

    const dx = rocket.x - goal.x;
    const dy = rocket.y - goal.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThan(goal.radius + 320);
    expect(dist).toBeLessThan(goal.radius + 580);
  });

  it('keeps rockets outside capture range when goal is near a page edge', () => {
    const goal = makeGoal(40, 40);
    const rocket = createRocketParticle(800, 1200, 0.15);
    placeRocketNearGoal(rocket, 800, 1200, goal, []);

    const dist = Math.hypot(rocket.x - goal.x, rocket.y - goal.y);
    expect(dist).toBeGreaterThan(goal.radius + 320);
  });

  it('prefers goals with fewer nearby rockets', () => {
    const goals = [makeGoal(200, 400), makeGoal(900, 400)];
    const rockets = [makeRocket(205, 405), makeRocket(210, 410)];

    const picked = pickGoalForRocketSpawn(goals, rockets);
    expect(picked?.x).toBe(900);
  });
});
