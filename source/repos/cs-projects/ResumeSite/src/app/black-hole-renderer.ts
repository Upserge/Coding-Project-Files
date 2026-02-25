// NASA-style black hole rendering with accretion disk, photon ring, and lensed light arcs
import { GoalPost } from './particle-field-types';

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  goal: GoalPost,
  isDark: boolean
): void {
  const r = goal.radius;
  const x = goal.x;
  const y = goal.y;
  const phase = goal.pulsePhase;

  const darkMul = isDark ? 1 : 1.4;
  const diskTilt = goal.diskTilt;
  const diskRotation = phase * goal.spinSpeed;

  // Rotate entire black hole to its unique axis
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(goal.diskAxis);
  ctx.translate(-x, -y);

  // --- Gravitational lensing glow (outermost halo) ---
  const outerGlow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3);
  outerGlow.addColorStop(0, `rgba(100, 60, 200, ${0.08 * darkMul})`);
  outerGlow.addColorStop(0.4, `rgba(255, 140, 40, ${0.03 * darkMul})`);
  outerGlow.addColorStop(1, 'rgba(255, 100, 20, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // --- Back half of accretion disk (behind the black hole) ---
  drawAccretionDisk(ctx, x, y, r, phase, diskTilt, diskRotation, darkMul, 'back');

  // --- Lensed light arc (back of disk bent over the top) ---
  // In NASA renders, light from the far side bends over the top
  ctx.save();
  ctx.translate(x, y);
  const lensArcR = r * 1.05;
  for (let seg = 0; seg < 80; seg++) {
    const theta = Math.PI + (seg / 80) * Math.PI; // top half arc
    const angOffset = diskRotation + theta;
    // Doppler: approaching side brighter
    const doppler = 0.5 + 0.5 * Math.sin(angOffset);
    const brightness = doppler * (0.12 * darkMul);
    // Temperature: inner = white-blue, outer = orange
    const temp = seg / 80;
    const rr = Math.floor(200 + 55 * temp);
    const gg = Math.floor(160 + 60 * (1 - temp));
    const bb = Math.floor(80 * (1 - temp) + 200 * Math.max(0, 0.5 - temp));
    const lx = Math.cos(theta) * lensArcR;
    const ly = Math.sin(theta) * lensArcR * 0.95; // slightly compressed
    ctx.beginPath();
    ctx.arc(lx, ly, 1.5 + doppler * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${brightness})`;
    ctx.fill();
  }
  ctx.restore();

  // --- Photon ring (bright thin ring at the shadow boundary) ---
  for (let ring = 0; ring < 2; ring++) {
    const ringR = r * (1.0 + ring * 0.08);
    const ringW = ring === 0 ? 1.2 : 0.6;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    const ringAlpha = (ring === 0 ? 0.15 : 0.08) * darkMul;
    ctx.strokeStyle = `rgba(255, 200, 140, ${ringAlpha})`;
    ctx.lineWidth = ringW;
    ctx.stroke();
  }

  // --- Event horizon (dark core with soft edge) ---
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.05);
  coreGrad.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(10, 2, 20, 0.9)');
  coreGrad.addColorStop(0.65, isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(10, 2, 20, 0.85)');
  coreGrad.addColorStop(0.85, isDark ? 'rgba(5, 0, 15, 0.5)' : 'rgba(15, 5, 30, 0.4)');
  coreGrad.addColorStop(1, 'rgba(20, 5, 40, 0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // --- Front half of accretion disk (in front of the black hole) ---
  drawAccretionDisk(ctx, x, y, r, phase, diskTilt, diskRotation, darkMul, 'front');

  // --- Lensed light arc (back of disk bent under the bottom) ---
  ctx.save();
  ctx.translate(x, y);
  for (let seg = 0; seg < 80; seg++) {
    const theta = (seg / 80) * Math.PI; // bottom half arc
    const angOffset = diskRotation + theta;
    const doppler = 0.5 + 0.5 * Math.sin(angOffset);
    const brightness = doppler * (0.06 * darkMul); // dimmer secondary
    const temp = seg / 80;
    const rr = Math.floor(200 + 55 * temp);
    const gg = Math.floor(140 + 40 * (1 - temp));
    const bb = Math.floor(60 * (1 - temp) + 160 * Math.max(0, 0.5 - temp));
    const lx = Math.cos(theta) * lensArcR;
    const ly = Math.sin(theta) * lensArcR * 0.95;
    ctx.beginPath();
    ctx.arc(lx, ly, 1.0 + doppler, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${brightness})`;
    ctx.fill();
  }
  ctx.restore();

  // --- Singularity flicker ---
  const singPulse = 0.5 + Math.sin(phase * 6) * 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${singPulse * 0.2})`;
  ctx.fill();

  ctx.restore(); // close per-goal axis rotation
}

function drawAccretionDisk(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  phase: number, tilt: number, rotation: number,
  darkMul: number, half: 'front' | 'back'
): void {
  // NASA-style: draw the disk as many individual elliptical ring segments
  // with temperature gradient (hot inner = white-blue, cool outer = orange-red)
  // and Doppler beaming (approaching side brighter)
  const rings = 12;
  const segments = 120;

  ctx.save();
  ctx.translate(x, y);

  for (let ring = 0; ring < rings; ring++) {
    const t = ring / rings; // 0 = inner, 1 = outer
    const ringR = r * (1.15 + t * 1.2); // inner edge just outside event horizon

    // Temperature colors: inner = white/blue-white, outer = deep orange/red
    const rr = Math.floor(255);
    const gg = Math.floor(255 - t * 155); // 255 → 100
    const bb = Math.floor(255 - t * 225); // 255 → 30

    // Ring width: inner rings are thinner and brighter
    const width = (1 - t * 0.5) * 2.5;
    const baseAlpha = (1 - t * 0.6) * 0.18 * darkMul;

    for (let seg = 0; seg < segments; seg++) {
      const theta = (seg / segments) * Math.PI * 2;
      const totalAngle = rotation + theta;

      // Determine if this segment is in the front or back half
      const yOnEllipse = Math.sin(theta) * tilt;
      if (half === 'back' && yOnEllipse > -0.02) continue; // back = top of tilt (behind hole)
      if (half === 'front' && yOnEllipse < 0.02) continue; // front = bottom of tilt (in front)

      // Doppler beaming: approaching side (left when rotating clockwise) is brighter
      const doppler = 0.4 + 0.6 * (0.5 + 0.5 * Math.cos(totalAngle));

      // Hotspot shimmer
      const shimmer = 1 + 0.15 * Math.sin(phase * 8 + theta * 3 + ring);

      const alpha = baseAlpha * doppler * shimmer;

      const ex = Math.cos(theta) * ringR;
      const ey = Math.sin(theta) * ringR * tilt;

      ctx.beginPath();
      ctx.arc(ex, ey, width * (0.6 + doppler * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${Math.min(alpha, 0.5)})`;
      ctx.fill();
    }
  }

  ctx.restore();
}
