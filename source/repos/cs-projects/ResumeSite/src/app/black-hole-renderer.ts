// Black hole goal rendering — lightweight canvas draws
import { GoalPost } from './particle-field-types';

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  goal: GoalPost,
  isDark: boolean,
  hintStrength = 0,
): void {
  const r = goal.radius;
  const x = goal.x;
  const y = goal.y;
  const phase = goal.pulsePhase;
  const hintPulse = hintStrength * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(phase * 3.5)));
  const darkMul = isDark ? 1 : 1.4;
  const diskRotation = phase * goal.spinSpeed;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(goal.diskAxis);
  ctx.translate(-x, -y);

  const outerGlow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.5);
  outerGlow.addColorStop(0, `rgba(100, 60, 200, ${0.12 * darkMul})`);
  outerGlow.addColorStop(0.5, `rgba(255, 140, 40, ${0.05 * darkMul})`);
  outerGlow.addColorStop(1, 'rgba(255, 100, 20, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  if (hintPulse > 0.01) {
    ctx.beginPath();
    ctx.arc(x, y, r * (1.6 + hintPulse * 0.2), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 220, 150, ${hintPulse * 0.22 * darkMul})`;
    ctx.lineWidth = 1.5 + hintPulse;
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(diskRotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.9, r * 1.9 * goal.diskTilt, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 140, ${0.2 * darkMul})`;
  ctx.lineWidth = r * 0.35;
  ctx.stroke();
  ctx.restore();

  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
  coreGrad.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(10, 2, 20, 0.9)');
  coreGrad.addColorStop(0.85, 'rgba(20, 5, 40, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r * 1.02, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 140, ${(0.18 + hintPulse * 0.1) * darkMul})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}
