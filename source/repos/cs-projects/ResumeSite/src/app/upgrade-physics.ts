// Pure physics helpers for upgrade-driven forces (tractor aim, gravity well)

import { Particle, GoalPost } from './particle-field-types';

export function applyTractorAim(
  p: Particle,
  goals: readonly GoalPost[],
  strength: number,
): void {
  let nearest: GoalPost | null = null;
  let nearestDist = Infinity;
  for (const g of goals) {
    if (g.scored) continue;
    const dx = g.x - p.x;
    const dy = g.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= nearestDist) continue;
    nearestDist = d;
    nearest = g;
  }
  if (!nearest) return;
  const ax = nearest.x - p.x;
  const ay = nearest.y - p.y;
  p.vx += (ax / nearestDist) * strength;
  p.vy += (ay / nearestDist) * strength;
}

export function applyGravityWell(
  p: Particle,
  goals: readonly GoalPost[],
  strength: number,
  maxRange: number,
): void {
  for (const g of goals) {
    if (g.scored) continue;
    const dx = g.x - p.x;
    const dy = g.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > maxRange) continue;
    p.vx += (dx / d) * strength;
    p.vy += (dy / d) * strength;
  }
}
