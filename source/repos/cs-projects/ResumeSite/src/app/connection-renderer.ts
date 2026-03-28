// Draws faint connection lines between nearby non-golden particles

import { Particle } from './particle-field-types';

export function drawConnections(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  viewTop: number,
  viewBottom: number,
  isDark: boolean,
): void {
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    if (a.golden || a.galaxyColor || a.y < viewTop || a.y > viewBottom) continue;
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      if (b.golden || b.galaxyColor || b.y < viewTop || b.y > viewBottom) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 100) continue;

      const alpha = (1 - dist / 100) * (isDark ? 0.06 : 0.12);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isDark
        ? `rgba(124, 92, 255, ${alpha})`
        : `rgba(80, 50, 200, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}
