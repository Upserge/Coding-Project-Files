// Draws faint connection lines between nearby non-golden particles (spatial grid, not O(n²))

import { Particle } from './particle-field-types';

const LINK_DIST = 100;
const CELL = LINK_DIST;

function cellKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function drawConnections(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  viewTop: number,
  viewBottom: number,
  isDark: boolean,
): void {
  const grid = new Map<string, number[]>();
  const linkDistSq = LINK_DIST * LINK_DIST;
  const rgb = isDark ? '124, 92, 255' : '80, 50, 200';
  const alphaMul = isDark ? 0.06 : 0.12;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.golden || p.galaxyColor || p.y < viewTop || p.y > viewBottom) continue;

    const cx = Math.floor(p.x / CELL);
    const cy = Math.floor(p.y / CELL);
    const key = cellKey(cx, cy);
    const bucket = grid.get(key);
    if (bucket) bucket.push(i);
    else grid.set(key, [i]);
  }

  for (const [key, indices] of grid) {
    const [cx, cy] = key.split(',').map(Number);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const neighbor = grid.get(cellKey(cx + ox, cy + oy));
        if (!neighbor) continue;

        for (let aIdx = 0; aIdx < indices.length; aIdx++) {
          const i = indices[aIdx];
          const a = particles[i];
          for (const j of neighbor) {
            if (j <= i) continue;
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx * dx + dy * dy;
            if (distSq >= linkDistSq) continue;

            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / LINK_DIST) * alphaMul})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }
  }
}
