// Particle and player-craft rendering (luminous arrowhead of light)
import { Particle, GoalPost } from './particle-field-types';

/** Naboo N-1 draw scale — slightly oversized for canvas readability. */
export const SHIP_LEN_MUL = 3.65;
const SHIP_WID_MUL = 1.45;
/** Forward fraction of the hull that reads as polished chrome (movie-accurate). */
const CHROME_FRONT_FRACTION = 0.3;

function chromeBoundaryX(noseX: number, tailX: number): number {
  return noseX - CHROME_FRONT_FRACTION * (noseX - tailX);
}

/** Shimmering silver chrome overlay clipped to a region's forward 30%. */
function paintChromeShimmer(
  ctx: CanvasRenderingContext2D,
  outline: () => void,
  noseX: number,
  tailX: number,
  spanY: number,
  animate: boolean,
): void {
  const endX = chromeBoundaryX(noseX, tailX);
  const width = noseX - endX;
  if (width <= 0) return;

  ctx.save();
  outline();
  ctx.clip();
  ctx.beginPath();
  ctx.rect(endX, -spanY, width + 2, spanY * 2);
  ctx.clip();

  // Cool mirrored base (silver ↔ white bands)
  const base = ctx.createLinearGradient(endX, -spanY, noseX, spanY);
  base.addColorStop(0, 'rgba(196, 204, 218, 0.88)');
  base.addColorStop(0.22, 'rgba(255, 255, 255, 0.98)');
  base.addColorStop(0.48, 'rgba(184, 192, 210, 0.82)');
  base.addColorStop(0.72, 'rgba(255, 255, 255, 0.96)');
  base.addColorStop(1, 'rgba(245, 248, 255, 1)');
  ctx.fillStyle = base;
  ctx.fillRect(endX, -spanY, width + 2, spanY * 2);

  if (animate) {
    const t = performance.now() * 0.0028;
    const sweep = (Math.sin(t) + 1) * 0.5;
    const bandCenter = endX + width * sweep;
    const bandW = width * 0.28;
    ctx.globalCompositeOperation = 'lighter';
    const band = ctx.createLinearGradient(bandCenter - bandW, -spanY, bandCenter + bandW, spanY);
    band.addColorStop(0, 'rgba(255, 255, 255, 0)');
    band.addColorStop(0.5, 'rgba(255, 255, 255, 0.78)');
    band.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(endX, -spanY, width + 2, spanY * 2);

    const diag = (Math.sin(t * 1.6 + 1.2) + 1) * 0.5;
    const streakX = endX + width * diag;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.32 + Math.sin(t * 3) * 0.14})`;
    ctx.lineWidth = Math.max(0.4, spanY * 0.06);
    ctx.beginPath();
    ctx.moveTo(streakX, -spanY * 0.9);
    ctx.lineTo(streakX + width * 0.15, spanY * 0.9);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  } else {
    // Reduced motion: static specular band (still reads as chrome, no sweep).
    const band = ctx.createLinearGradient(endX + width * 0.52, -spanY, endX + width * 0.78, spanY);
    band.addColorStop(0, 'rgba(255, 255, 255, 0)');
    band.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)');
    band.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(endX, -spanY, width + 2, spanY * 2);
  }

  ctx.restore();
}

/** Full chrome cap on engine intakes (entire cap shimmers). */
function paintPodChromeCap(
  ctx: CanvasRenderingContext2D,
  traceCap: () => void,
  capAftX: number,
  capForwardX: number,
  spanY: number,
  animate: boolean,
): void {
  const x0 = Math.min(capAftX, capForwardX);
  const x1 = Math.max(capAftX, capForwardX);
  const w = x1 - x0 + 2;

  ctx.save();
  traceCap();
  ctx.clip();

  const base = ctx.createLinearGradient(x0, -spanY, x1, spanY);
  base.addColorStop(0, 'rgba(210, 218, 232, 0.9)');
  base.addColorStop(0.5, 'rgba(255, 255, 255, 0.98)');
  base.addColorStop(1, 'rgba(190, 198, 214, 0.85)');
  ctx.fillStyle = base;
  ctx.fillRect(x0, -spanY * 1.2, w, spanY * 2.4);

  if (animate) {
    const t = performance.now() * 0.0035;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + Math.sin(t * 2.2) * 0.2})`;
    ctx.fillRect(x0, -spanY * 1.2, w, spanY * 2.4);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

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
  const len = p.r * SHIP_LEN_MUL;
  const wid = p.r * SHIP_WID_MUL;
  const chromeAnimate = typeof window === 'undefined'
    || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // === Luminous Naboo N-1 Starfighter ===
  // Stingray central fuselage with a long chrome needle nose and a trailing
  // tail finial, flanked by twin J-type engine pods that each trail a finial.
  // Rendered as a craft of light in the Naboo palette: yellow hull + chrome.
  const gold = '245, 197, 40'; // Naboo yellow
  const goldLight = '255, 228, 140'; // sunlit highlight

  // Thrust drives intensity (0..1); a subtle idle breath keeps it alive.
  const thrust = Math.min(p.pushTime / 120, 1);
  const breath = 0.85 + Math.sin(performance.now() * 0.004) * 0.15;

  const noseX = len * 1.28; // long needle nose
  const tailX = -len * 1.1; // central finial tip
  const engineY = wid * 1.25; // lateral engine offset
  const podR = wid * 0.34; // engine pod half-thickness
  const podFrontX = len * 0.6;
  const podRearX = -len * 0.5;
  const podFinialX = -len * 0.95;

  // --- Twin engine exhaust (gold, additive) ---
  if (thrust > 0.02 || spd > 0.08) {
    const flameLen = len * (0.5 + thrust * 1.8 + Math.min(spd, 2));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let ni = -1; ni <= 1; ni += 2) {
      const ey = ni * engineY;
      const flame = ctx.createLinearGradient(podRearX, ey, podRearX - flameLen, ey);
      flame.addColorStop(0, `rgba(255, 244, 210, ${0.5 * (0.4 + thrust * 0.6)})`);
      flame.addColorStop(0.4, `rgba(${gold}, ${0.3 * (0.4 + thrust)})`);
      flame.addColorStop(1, `rgba(${gold}, 0)`);
      ctx.beginPath();
      ctx.moveTo(podRearX, ey - podR * 0.7);
      ctx.lineTo(podRearX - flameLen, ey);
      ctx.lineTo(podRearX, ey + podR * 0.7);
      ctx.closePath();
      ctx.fillStyle = flame;
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Glow halo (warm gold) ---
  const glowR = len * (1.9 + thrust * 0.8) * breath;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
  glow.addColorStop(0, `rgba(255, 230, 150, ${0.18 + thrust * 0.16})`);
  glow.addColorStop(0.45, `rgba(${gold}, 0.08)`);
  glow.addColorStop(1, `rgba(${gold}, 0)`);
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // --- Twin engine pods (yellow body + shimmering chrome intakes) ---
  const drawPod = (dir: number) => {
    const ey = dir * engineY;
    ctx.beginPath();
    ctx.moveTo(podFrontX, ey);
    ctx.quadraticCurveTo(podFrontX, ey - podR, len * 0.38, ey - podR);
    ctx.lineTo(podRearX, ey - podR * 0.8);
    ctx.lineTo(podFinialX, ey); // finial spike
    ctx.lineTo(podRearX, ey + podR * 0.8);
    ctx.lineTo(len * 0.38, ey + podR);
    ctx.quadraticCurveTo(podFrontX, ey + podR, podFrontX, ey);
    ctx.closePath();
    const podGrad = ctx.createLinearGradient(0, ey - podR, 0, ey + podR);
    podGrad.addColorStop(0, `rgba(${goldLight}, 0.95)`);
    podGrad.addColorStop(0.5, `rgba(${gold}, 0.92)`);
    podGrad.addColorStop(1, `rgba(${gold}, 0.7)`);
    ctx.fillStyle = podGrad;
    ctx.fill();

    paintPodChromeCap(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(podFrontX, ey);
        ctx.quadraticCurveTo(podFrontX, ey - podR, len * 0.42, ey - podR * 0.85);
        ctx.lineTo(len * 0.42, ey + podR * 0.85);
        ctx.quadraticCurveTo(podFrontX, ey + podR, podFrontX, ey);
        ctx.closePath();
      },
      len * 0.42,
      podFrontX,
      podR,
      chromeAnimate,
    );
  };
  drawPod(-1);
  drawPod(1);

  // --- Wing struts connecting fuselage to pods ---
  ctx.strokeStyle = `rgba(${gold}, 0.8)`;
  ctx.lineWidth = Math.max(0.8, wid * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(len * 0.26, -wid * 0.34);
  ctx.lineTo(len * 0.16, -(engineY - podR));
  ctx.moveTo(len * 0.26, wid * 0.34);
  ctx.lineTo(len * 0.16, engineY - podR);
  ctx.stroke();

  // --- Central fuselage (stingray body + tail finial) ---
  const traceHull = () => {
    ctx.beginPath();
    ctx.moveTo(noseX, 0);
    ctx.quadraticCurveTo(len * 1.0, -wid * 0.16, len * 0.5, -wid * 0.3);
    ctx.lineTo(len * 0.1, -wid * 0.5); // cockpit shoulder
    ctx.lineTo(-len * 0.4, -wid * 0.26);
    ctx.lineTo(-len * 0.78, -wid * 0.09);
    ctx.lineTo(tailX, 0); // tail finial tip
    ctx.lineTo(-len * 0.78, wid * 0.09);
    ctx.lineTo(-len * 0.4, wid * 0.26);
    ctx.lineTo(len * 0.1, wid * 0.5);
    ctx.lineTo(len * 0.5, wid * 0.3);
    ctx.quadraticCurveTo(len * 1.0, wid * 0.16, noseX, 0);
    ctx.closePath();
  };
  traceHull();
  const body = ctx.createLinearGradient(0, -wid * 0.5, 0, wid * 0.5);
  body.addColorStop(0, `rgba(${goldLight}, 0.97)`);
  body.addColorStop(0.5, `rgba(${gold}, 0.95)`);
  body.addColorStop(1, `rgba(${gold}, 0.78)`);
  ctx.fillStyle = body;
  ctx.shadowColor = 'rgba(255, 220, 130, 0.85)';
  ctx.shadowBlur = len * (0.6 + thrust * 0.5);
  ctx.fill();
  ctx.shadowBlur = 0;

  // --- Forward 30%: shimmering movie chrome (needle nose + leading edges) ---
  paintChromeShimmer(ctx, traceHull, noseX, tailX, wid * 0.55, chromeAnimate);

  // --- Crisp hull edge ---
  traceHull();
  ctx.strokeStyle = `rgba(${goldLight}, 0.9)`;
  ctx.lineWidth = Math.max(0.5, wid * 0.09);
  ctx.lineJoin = 'round';
  ctx.stroke();

  // --- Cockpit core (the "spark") ---
  const coreR = wid * 0.42 * breath;
  const core = ctx.createRadialGradient(len * 0.18, 0, 0, len * 0.18, 0, coreR);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.5, `rgba(${goldLight}, 0.75)`);
  core.addColorStop(1, `rgba(${gold}, 0)`);
  ctx.beginPath();
  ctx.arc(len * 0.18, 0, coreR, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();

  ctx.restore();
}

function drawNormalParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  spagGoal: GoalPost | null,
  stretchX: number, stretchY: number, stretchAngle: number,
  isDark: boolean
): void {
  const gc = p.galaxyColor;
  const haloColor = gc
    ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${p.opacity * 0.35})`
    : isDark
      ? `rgba(124, 92, 255, ${p.opacity * 0.45})`
      : `rgba(80, 50, 200, ${p.opacity * 0.55})`;
  const coreColor = gc
    ? `rgba(255, 255, 255, ${p.opacity * 0.85})`
    : isDark
      ? `rgba(255, 255, 255, ${p.opacity * 0.65})`
      : `rgba(60, 30, 180, ${p.opacity * 0.9})`;

  if (spagGoal) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(stretchAngle);
    ctx.scale(stretchX, stretchY);
    ctx.rotate(-stretchAngle);
    ctx.translate(-p.x, -p.y);
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = haloColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.fill();

  if (spagGoal) {
    ctx.restore();
  }
}
