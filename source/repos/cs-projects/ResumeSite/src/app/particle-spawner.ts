// Spawning logic for particles and goals — extracted for file size

import { Particle, GoalPost } from './particle-field-types';

export function createDustParticles(
  count: number,
  w: number,
  h: number,
  driftSpeed: number,
  minR: number,
  maxR: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = driftSpeed * (0.3 + Math.random() * 0.7);
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: minR + Math.random() * (maxR - minR),
      opacity: 0.1 + Math.random() * 0.3,
      driftAngle: angle,
      driftRate: (Math.random() - 0.5) * 0.008,
      golden: false,
      pushTime: 0,
    });
  }
  return particles;
}

export function createRocketParticle(w: number, h: number, driftSpeed: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = driftSpeed * (0.2 + Math.random() * 0.4);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 4.5 + Math.random() * 1.6,
    opacity: 0.6 + Math.random() * 0.3,
    driftAngle: angle,
    driftRate: (Math.random() - 0.5) * 0.025,
    golden: true,
    pushTime: 0,
  };
}

export function placeAwayFromOccupied(
  particle: Particle,
  w: number,
  h: number,
  occupied: readonly { x: number; y: number }[],
  minDist: number,
): void {
  let attempts = 0;
  do {
    particle.x = Math.random() * w;
    particle.y = Math.random() * h;
    attempts++;
  } while (attempts < 40 && isTooClose(particle, occupied, minDist));
}

/** Place a rocket in the current viewport so players can keep scoring without scrolling. */
export function placeRocketInViewport(
  particle: Particle,
  w: number,
  viewTop: number,
  viewBottom: number,
  occupied: readonly { x: number; y: number }[],
  minDist: number,
  margin = 72,
): void {
  const bandTop = viewTop + margin;
  const bandBottom = viewBottom - margin;
  const bandHeight = Math.max(bandBottom - bandTop, margin * 2);
  const bandLeft = margin;
  const bandRight = Math.max(w - margin, bandLeft + margin * 2);
  const bandWidth = bandRight - bandLeft;

  let attempts = 0;
  do {
    particle.x = bandLeft + Math.random() * bandWidth;
    particle.y = bandTop + Math.random() * bandHeight;
    attempts++;
  } while (attempts < 50 && isTooClose(particle, occupied, minDist));
}

function isTooClose(
  particle: Particle,
  occupied: readonly { x: number; y: number }[],
  minDist: number,
): boolean {
  const minDistSq = minDist * minDist;
  return occupied.some((o) => {
    const dx = o.x - particle.x;
    const dy = o.y - particle.y;
    return dx * dx + dy * dy < minDistSq;
  });
}

function clampToPage(particle: Particle, w: number, h: number, margin = 48): void {
  particle.x = Math.max(margin, Math.min(w - margin, particle.x));
  particle.y = Math.max(margin, Math.min(h - margin, particle.y));
}

/** Extra distance beyond goal.radius — keeps spawns outside capture + assist radii. */
const ROCKET_ORBIT_MIN_OFFSET = 340;
const ROCKET_ORBIT_MAX_OFFSET = 560;
const ROCKET_PAIRING_RADIUS = 640;

function distanceToGoal(particle: Particle, goal: GoalPost): number {
  const dx = particle.x - goal.x;
  const dy = particle.y - goal.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Orbit an unscored black hole — paired with the hole but outside auto-capture range. */
export function placeRocketNearGoal(
  particle: Particle,
  w: number,
  h: number,
  goal: GoalPost,
  occupied: readonly { x: number; y: number }[],
  minDistFromOthers = 160,
  driftSpeed = 0.15,
): void {
  const minOrbit = goal.radius + ROCKET_ORBIT_MIN_OFFSET;
  const maxOrbit = goal.radius + ROCKET_ORBIT_MAX_OFFSET;

  let spawnAngle = 0;
  let attempts = 0;
  let placed = false;
  do {
    spawnAngle = Math.random() * Math.PI * 2;
    const dist = minOrbit + Math.random() * (maxOrbit - minOrbit);
    particle.x = goal.x + Math.cos(spawnAngle) * dist;
    particle.y = goal.y + Math.sin(spawnAngle) * dist;
    clampToPage(particle, w, h);

    const distFromGoal = distanceToGoal(particle, goal);
    const tooCloseToGoal = distFromGoal < minOrbit;
    attempts++;
    if (!tooCloseToGoal && !isTooClose(particle, occupied, minDistFromOthers)) {
      placed = true;
    }
  } while (attempts < 50 && !placed);

  if (!placed) {
    // Edge clamp can pull spawns into capture range — push outward from the goal.
    const angle = Math.atan2(h / 2 - goal.y, w / 2 - goal.x);
    const dist = minOrbit + (maxOrbit - minOrbit) * 0.45;
    particle.x = goal.x + Math.cos(angle) * dist;
    particle.y = goal.y + Math.sin(angle) * dist;
    const distFromGoal = distanceToGoal(particle, goal);
    if (distFromGoal < minOrbit && distFromGoal > 0) {
      const scale = minOrbit / distFromGoal;
      particle.x = goal.x + (particle.x - goal.x) * scale;
      particle.y = goal.y + (particle.y - goal.y) * scale;
    }
    clampToPage(particle, w, h);
    spawnAngle = angle;
  }

  // Tangential drift so rockets don't idle-drift straight into the hole
  const tangent = spawnAngle + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
  const speed = driftSpeed * (0.22 + Math.random() * 0.32);
  particle.vx = Math.cos(tangent) * speed;
  particle.vy = Math.sin(tangent) * speed;
  particle.driftAngle = tangent;
  particle.driftRate = (Math.random() - 0.5) * 0.012;
  particle.pushTime = 0;
}

export function getActiveGoals(goals: readonly GoalPost[]): GoalPost[] {
  return goals.filter((g) => !g.scored);
}

/** Prefer goals with fewer nearby rockets; optionally skip one (e.g. just scored). */
export function pickGoalForRocketSpawn(
  goals: readonly GoalPost[],
  rockets: readonly Particle[],
  excludeGoal?: GoalPost,
): GoalPost | null {
  const active = goals.filter((g) => !g.scored && g !== excludeGoal);
  const pool = active.length > 0 ? active : goals.filter((g) => g !== excludeGoal);
  if (pool.length === 0) return goals[0] ?? null;

  let best = pool[0];
  let bestCount = countRocketsNear(rockets, best);

  for (let i = 1; i < pool.length; i++) {
    const candidate = pool[i];
    const count = countRocketsNear(rockets, candidate);
    if (count < bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
}

function countRocketsNear(rockets: readonly Particle[], goal: GoalPost, radius = ROCKET_PAIRING_RADIUS): number {
  const radiusSq = radius * radius;
  let count = 0;
  for (const rocket of rockets) {
    if (!rocket.golden) continue;
    const dx = rocket.x - goal.x;
    const dy = rocket.y - goal.y;
    if (dx * dx + dy * dy <= radiusSq) count++;
  }
  return count;
}

export function isRocketNearActiveGoal(
  rocket: Particle,
  goals: readonly GoalPost[],
  maxDist = ROCKET_PAIRING_RADIUS,
): boolean {
  const maxDistSq = maxDist * maxDist;
  for (const goal of goals) {
    if (goal.scored) continue;
    const dx = rocket.x - goal.x;
    const dy = rocket.y - goal.y;
    if (dx * dx + dy * dy <= maxDistSq) return true;
  }
  return getActiveGoals(goals).length === 0;
}

export function createGoalPost(
  w: number,
  h: number,
  margin: number,
  occupied: readonly { x: number; y: number }[],
): GoalPost {
  let x: number, y: number;
  let attempts = 0;
  do {
    x = margin + Math.random() * (w - margin * 2);
    y = margin + Math.random() * (h - margin * 2);
    attempts++;
  } while (attempts < 40 && occupied.some(o => {
    const dx = o.x - x;
    const dy = o.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 250;
  }));

  return {
    x, y,
    pulsePhase: Math.random() * Math.PI * 2,
    scored: false,
    scoreTimer: 0,
    radius: 22 + Math.random() * 22,
    diskTilt: 0.18 + Math.random() * 0.32,
    diskAxis: Math.random() * Math.PI * 2,
    spinSpeed: 0.2 + Math.random() * 0.25,
  };
}
