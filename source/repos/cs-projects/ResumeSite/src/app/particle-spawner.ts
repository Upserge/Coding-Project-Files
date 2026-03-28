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
  } while (attempts < 40 && occupied.some(o => {
    const dx = o.x - particle.x;
    const dy = o.y - particle.y;
    return Math.sqrt(dx * dx + dy * dy) < minDist;
  }));
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
