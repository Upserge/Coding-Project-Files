// Black hole goal rendering — studio accretion disk + score flash
import { GoalPost } from './particle-field-types';

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  goal: GoalPost,
  isDark: boolean,
  hintStrength = 0,
  scoreFlash = 0,
): void {
  const r = goal.radius;
  const x = goal.x;
  const y = goal.y;
  const phase = goal.pulsePhase;
  const hintPulse = hintStrength * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(phase * 3.5)));
  const darkMul = isDark ? 1 : 1.45;
  const diskRotation = phase * goal.spinSpeed;
  const shimmer = 0.5 + 0.5 * Math.sin(phase * 4.2);
  const flash = Math.max(scoreFlash, 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(goal.diskAxis);
  ctx.translate(-x, -y);

  const outerGlow = ctx.createRadialGradient(x, y, r * 0.35, x, y, r * 3.2);
  outerGlow.addColorStop(0, `rgba(130, 90, 255, ${(0.2 + flash * 0.55) * darkMul})`);
  outerGlow.addColorStop(0.35, `rgba(255, 160, 80, ${(0.12 + flash * 0.35) * darkMul})`);
  outerGlow.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  if (flash > 0.02) {
    ctx.beginPath();
    ctx.arc(x, y, r * (2.4 + flash * 0.85), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 230, 180, ${flash * 0.72 * darkMul})`;
    ctx.lineWidth = 3 + flash * 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r * (3.2 + flash * 1.1), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 140, 255, ${flash * 0.28 * darkMul})`;
    ctx.lineWidth = 1.5 + flash * 2.5;
    ctx.stroke();
  }

  if (hintPulse > 0.01) {
    ctx.beginPath();
    ctx.arc(x, y, r * (1.7 + hintPulse * 0.25), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 220, 150, ${hintPulse * 0.28 * darkMul})`;
    ctx.lineWidth = 1.5 + hintPulse * 1.2;
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(diskRotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 2.1, r * 2.1 * goal.diskTilt, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 210, 150, ${(0.28 + shimmer * 0.14 + flash * 0.45) * darkMul})`;
  ctx.lineWidth = r * 0.38;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.45, r * 1.45 * goal.diskTilt, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(200, 160, 255, ${(0.12 + shimmer * 0.1) * darkMul})`;
  ctx.lineWidth = r * 0.14;
  ctx.stroke();
  ctx.restore();

  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
  coreGrad.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.97)' : 'rgba(8, 2, 18, 0.92)');
  coreGrad.addColorStop(0.85, 'rgba(20, 5, 40, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r * 1.03, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 210, 150, ${(0.22 + hintPulse * 0.12 + flash * 0.4) * darkMul})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.restore();
}
