// Particle and rocket (Ranger) rendering
import { Particle, GoalPost } from './particle-field-types';

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  spagGoal: GoalPost | null,
  spagDist: number,
  isDark: boolean,
  spaghettiRadius: number
): void {
  // Compute spaghettification stretch
  let stretchX = 1;
  let stretchY = 1;
  let stretchAngle = 0;
  if (spagGoal && spagDist < spaghettiRadius) {
    const t = 1 - spagDist / spaghettiRadius;
    const intensity = t * t; // quadratic ramp
    stretchAngle = Math.atan2(spagGoal.y - p.y, spagGoal.x - p.x);
    stretchX = 1 + intensity * 2.5; // stretch toward hole
    stretchY = 1 - intensity * 0.5; // compress perpendicular
  }

  if (p.golden) {
    drawRocket(ctx, p, spagGoal, stretchX, stretchY, stretchAngle, isDark);
  } else {
    drawNormalParticle(ctx, p, spagGoal, stretchX, stretchY, stretchAngle, isDark);
  }
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  spagGoal: GoalPost | null,
  stretchX: number, stretchY: number, stretchAngle: number,
  isDark: boolean
): void {
  const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  const heading = spd > 0.01 ? Math.atan2(p.vy, p.vx) : 0;
  const len = p.r * 3.2;
  const wid = p.r * 1.3;

  ctx.save();
  ctx.translate(p.x, p.y);
  // Apply spaghettification before rocket rotation
  if (spagGoal) {
    ctx.rotate(stretchAngle);
    ctx.scale(stretchX, stretchY);
    ctx.rotate(-stretchAngle);
  }
  ctx.rotate(heading);
  ctx.globalAlpha = p.opacity;

  // Glow behind ship
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 2.2);
  glow.addColorStop(0, 'rgba(200, 210, 230, 0.08)');
  glow.addColorStop(1, 'rgba(200, 210, 230, 0)');
  ctx.beginPath();
  ctx.arc(0, 0, len * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // === Ranger-inspired flat angular wedge ===
  // Proportions: wider and flatter than a traditional rocket
  const hw = wid * 1.8; // half-width (the ship is WIDE)
  const noseX = len * 1.0; // nose tip
  const rearX = -len * 0.55; // rear edge
  const wingX = -len * 0.3; // widest point of delta wings
  const wingW = hw * 1.5; // wing tip half-width

  // --- Main hull body (center wedge) ---
  ctx.beginPath();
  ctx.moveTo(noseX, 0); // nose tip (blunted later)
  ctx.lineTo(len * 0.4, -hw * 0.55); // upper shoulder
  ctx.lineTo(wingX, -wingW); // upper wing tip
  ctx.lineTo(rearX, -wingW * 0.65); // rear upper corner
  ctx.lineTo(rearX, wingW * 0.65); // rear lower corner
  ctx.lineTo(wingX, wingW); // lower wing tip
  ctx.lineTo(len * 0.4, hw * 0.55); // lower shoulder
  ctx.closePath();

  // Thermal tile gradient (top-lit like shuttle tiles)
  const tileGrad = ctx.createLinearGradient(0, -hw, 0, hw);
  tileGrad.addColorStop(0, isDark ? '#e8e4ee' : '#dcd8e4');
  tileGrad.addColorStop(0.3, isDark ? '#d8d2e2' : '#ccc6d6');
  tileGrad.addColorStop(0.7, isDark ? '#c8c0d4' : '#bab2c6');
  tileGrad.addColorStop(1, isDark ? '#b0a8c0' : '#a29ab4');
  ctx.fillStyle = tileGrad;
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(80,70,100,0.35)' : 'rgba(50,40,70,0.35)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // --- Dark leading edge (spine) along top ---
  ctx.beginPath();
  ctx.moveTo(noseX, 0);
  ctx.lineTo(len * 0.4, -hw * 0.55);
  ctx.lineTo(wingX, -wingW);
  ctx.lineTo(rearX, -wingW * 0.65);
  ctx.lineTo(rearX, -wingW * 0.5);
  ctx.lineTo(wingX, -wingW * 0.78);
  ctx.lineTo(len * 0.35, -hw * 0.35);
  ctx.lineTo(noseX * 0.85, 0);
  ctx.closePath();
  const edgeGrad = ctx.createLinearGradient(rearX, 0, noseX, 0);
  edgeGrad.addColorStop(0, isDark ? '#3a3248' : '#2a2238');
  edgeGrad.addColorStop(1, isDark ? '#4a4260' : '#3a3250');
  ctx.fillStyle = edgeGrad;
  ctx.fill();

  // --- Dark leading edge (bottom spine) ---
  ctx.beginPath();
  ctx.moveTo(noseX, 0);
  ctx.lineTo(len * 0.4, hw * 0.55);
  ctx.lineTo(wingX, wingW);
  ctx.lineTo(rearX, wingW * 0.65);
  ctx.lineTo(rearX, wingW * 0.5);
  ctx.lineTo(wingX, wingW * 0.78);
  ctx.lineTo(len * 0.35, hw * 0.35);
  ctx.lineTo(noseX * 0.85, 0);
  ctx.closePath();
  ctx.fillStyle = edgeGrad;
  ctx.fill();

  // --- Hull panel seam lines (thermal tile grid) ---
  ctx.strokeStyle = isDark ? 'rgba(90,80,120,0.18)' : 'rgba(60,50,90,0.18)';
  ctx.lineWidth = 0.35;
  // Longitudinal seams
  for (let si = -2; si <= 2; si++) {
    const sy = si * hw * 0.18;
    ctx.beginPath();
    ctx.moveTo(len * 0.6, sy * 0.6);
    ctx.lineTo(rearX * 0.8, sy);
    ctx.stroke();
  }
  // Transverse seams
  for (let si = 0; si < 4; si++) {
    const sx = len * 0.5 - si * len * 0.25;
    const sw = hw * (0.3 + (3 - si) * 0.12);
    ctx.beginPath();
    ctx.moveTo(sx, -sw);
    ctx.lineTo(sx, sw);
    ctx.stroke();
  }

  // --- Blunted nose cap ---
  ctx.beginPath();
  ctx.moveTo(noseX, 0);
  ctx.quadraticCurveTo(noseX * 0.92, -hw * 0.2, noseX * 0.78, -hw * 0.3);
  ctx.quadraticCurveTo(noseX * 0.92, 0, noseX * 0.78, hw * 0.3);
  ctx.quadraticCurveTo(noseX * 0.92, hw * 0.2, noseX, 0);
  ctx.closePath();
  ctx.fillStyle = isDark ? '#504868' : '#403858';
  ctx.fill();

  // --- Cockpit windows (cluster of small angular shapes) ---
  const winColor = isDark ? 'rgba(60,180,220,0.7)' : 'rgba(40,140,180,0.7)';
  const winFrame = isDark ? 'rgba(30,25,50,0.5)' : 'rgba(20,15,40,0.5)';
  // Main forward window
  ctx.beginPath();
  ctx.moveTo(len * 0.55, -hw * 0.08);
  ctx.lineTo(len * 0.42, -hw * 0.18);
  ctx.lineTo(len * 0.28, -hw * 0.15);
  ctx.lineTo(len * 0.28, hw * 0.15);
  ctx.lineTo(len * 0.42, hw * 0.18);
  ctx.lineTo(len * 0.55, hw * 0.08);
  ctx.closePath();
  ctx.fillStyle = winColor;
  ctx.fill();
  ctx.strokeStyle = winFrame;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Side windows (smaller)
  for (let wi = 0; wi < 2; wi++) {
    const wx = len * (0.15 - wi * 0.15);
    const wy = hw * 0.22;
    ctx.beginPath();
    ctx.moveTo(wx + len * 0.05, -wy);
    ctx.lineTo(wx - len * 0.03, -wy * 1.1);
    ctx.lineTo(wx - len * 0.06, -wy * 0.85);
    ctx.lineTo(wx - len * 0.02, -wy * 0.7);
    ctx.closePath();
    ctx.fillStyle = winColor;
    ctx.fill();
    ctx.strokeStyle = winFrame;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Mirror on bottom
    ctx.beginPath();
    ctx.moveTo(wx + len * 0.05, wy);
    ctx.lineTo(wx - len * 0.03, wy * 1.1);
    ctx.lineTo(wx - len * 0.06, wy * 0.85);
    ctx.lineTo(wx - len * 0.02, wy * 0.7);
    ctx.closePath();
    ctx.fillStyle = winColor;
    ctx.fill();
    ctx.strokeStyle = winFrame;
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }

  // --- Rear engine section (dark block with nozzle ports) ---
  ctx.beginPath();
  ctx.moveTo(rearX, -wingW * 0.5);
  ctx.lineTo(rearX - len * 0.08, -wingW * 0.45);
  ctx.lineTo(rearX - len * 0.08, wingW * 0.45);
  ctx.lineTo(rearX, wingW * 0.5);
  ctx.closePath();
  ctx.fillStyle = isDark ? '#4a4260' : '#3a3250';
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(60,50,80,0.4)' : 'rgba(40,30,60,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Engine nozzle ports (small circles)
  const nozzleX = rearX - len * 0.06;
  ctx.fillStyle = isDark ? '#2a2238' : '#1a1228';
  for (let ni = -1; ni <= 1; ni++) {
    ctx.beginPath();
    ctx.arc(nozzleX, ni * wingW * 0.22, wid * 0.18, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow
    ctx.beginPath();
    ctx.arc(nozzleX, ni * wingW * 0.22, wid * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(80,70,100,0.4)' : 'rgba(60,50,80,0.4)';
    ctx.fill();
    ctx.fillStyle = isDark ? '#2a2238' : '#1a1228';
  }

  // --- Idle engine flicker ---
  if (p.pushTime <= 3) {
    const flickLen = 3 + Math.random() * 4;
    for (let ni = -1; ni <= 1; ni++) {
      ctx.beginPath();
      ctx.moveTo(nozzleX, ni * wingW * 0.22 - wid * 0.1);
      ctx.lineTo(nozzleX - flickLen, ni * wingW * 0.22);
      ctx.lineTo(nozzleX, ni * wingW * 0.22 + wid * 0.1);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 160, 40, ${0.2 + Math.random() * 0.25})`;
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawNormalParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  spagGoal: GoalPost | null,
  stretchX: number, stretchY: number, stretchAngle: number,
  isDark: boolean
): void {
  // Normal particle (theme-aware) or galaxy-tinted star
  const gc = p.galaxyColor;
  const glowPrimary = gc
    ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${p.opacity})`
    : isDark
      ? `rgba(124, 92, 255, ${p.opacity})`
      : `rgba(80, 50, 200, ${p.opacity * 1.8})`;
  const glowSecondary = gc
    ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${p.opacity * 0.3})`
    : isDark
      ? `rgba(94, 234, 212, ${p.opacity * 0.4})`
      : `rgba(20, 160, 140, ${p.opacity * 0.8})`;
  const coreColor = gc
    ? `rgba(255, 255, 255, ${p.opacity * 0.8})`
    : isDark
      ? `rgba(255, 255, 255, ${p.opacity * 0.6})`
      : `rgba(60, 30, 180, ${p.opacity * 0.9})`;

  // Apply spaghettification stretch for normal particles
  if (spagGoal) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(stretchAngle);
    ctx.scale(stretchX, stretchY);
    ctx.rotate(-stretchAngle);
    ctx.translate(-p.x, -p.y);
  }

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
  gradient.addColorStop(0, glowPrimary);
  gradient.addColorStop(0.4, glowSecondary);
  gradient.addColorStop(1, gc
    ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`
    : isDark ? 'rgba(124, 92, 255, 0)' : 'rgba(80, 50, 200, 0)');

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.fill();

  if (spagGoal) {
    ctx.restore();
  }
}
