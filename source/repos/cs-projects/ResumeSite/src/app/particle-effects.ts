// Visual effects: contrail wake, celebration sparks, spaghetti streams, cursor spaghettification
import { Particle, ConfettiPiece, SpaghettiStream, GoalPost } from './particle-field-types';
import { SHIP_LEN_MUL } from './particle-renderer';

const MAX_WAKE = 16;
// If the craft teleports (screen wrap), this distance resets the ribbon.
const WAKE_BREAK_DIST = 220;

/** Record the craft's rear position into its wake ribbon (T3 contrail). */
export function recordWake(p: Particle): void {
  if (!p.golden) return;
  if (!p.wake) p.wake = [];

  const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  const active = p.pushTime > 3 && spd > 0.05;

  if (active) {
    const heading = Math.atan2(p.vy, p.vx);
    const rearDist = p.r * SHIP_LEN_MUL * 1.1; // matches tail finial (tailX ratio)
    const rx = p.x - Math.cos(heading) * rearDist;
    const ry = p.y - Math.sin(heading) * rearDist;
    const head = p.wake[0];
    if (head) {
      const jump = Math.hypot(rx - head.x, ry - head.y);
      if (jump > WAKE_BREAK_DIST) p.wake.length = 0; // screen wrap -> cut ribbon
    }
    p.wake.unshift({ x: rx, y: ry });
    if (p.wake.length > MAX_WAKE) p.wake.length = MAX_WAKE;
  } else if (p.wake.length > 0) {
    // Idle: retract the ribbon quickly so it dissolves behind the craft.
    p.wake.pop();
    if (p.wake.length > 0) p.wake.pop();
  }
}

/** Draw the tapered, additive white -> violet contrail behind the craft. */
export function drawContrail(ctx: CanvasRenderingContext2D, p: Particle, isDark: boolean): void {
  const wake = p.wake;
  if (!wake || wake.length < 3) return;

  const n = wake.length;
  const thrust = Math.min(p.pushTime / 120, 1);
  const baseW = p.r * 1.15 * (0.55 + thrust * 0.7);
  const gold = isDark ? '245, 197, 40' : '214, 163, 20';
  const goldLight = '255, 228, 140';

  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const w = baseW * (1 - t) * (1 - t); // quadratic taper -> sharp tail
    const a = wake[Math.max(0, i - 1)];
    const b = wake[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl; dy /= dl;
    const nx = -dy;
    const ny = dx;
    left.push({ x: wake[i].x + nx * w, y: wake[i].y + ny * w });
    right.push({ x: wake[i].x - nx * w, y: wake[i].y - ny * w });
  }

  const grad = ctx.createLinearGradient(wake[0].x, wake[0].y, wake[n - 1].x, wake[n - 1].y);
  grad.addColorStop(0, `rgba(255, 248, 220, ${0.5 * (0.4 + thrust * 0.6)})`);
  grad.addColorStop(0.4, `rgba(${goldLight}, ${0.28 * (0.4 + thrust)})`);
  grad.addColorStop(1, `rgba(${gold}, 0)`);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// White, lavender, violet, teal — straight from the token palette.
const SPARK_COLORS = ['255, 255, 255', '196, 181, 253', '124, 92, 255', '94, 234, 212'];

// Celebration sequence timing (frames @ ~60fps): pull in, then gather energy.
const IMPLODE_FRAMES = 40;
const CHARGE_FRAMES = 24;
const CHARGE_END = IMPLODE_FRAMES + CHARGE_FRAMES;

/** C4 celebration: sparks implode, gather into a charging core, then burst. */
export function createConfetti(x: number, y: number, count: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];

  // Central energy core that grows during the implosion/charge, then flashes.
  pieces.push({
    x, y, px: x, py: y,
    vx: 0, vy: 0,
    cx: x, cy: y,
    r: 13 + count * 0.12,
    color: '255, 255, 255',
    life: 1,
    decay: 0.06,
    phase: 'implode',
    age: 0,
    spin: 0,
    kind: 'core',
  });

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 80; // start wide so the pull-in reads
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius;
    const swirl = (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.4);
    pieces.push({
      x: sx, y: sy,
      px: sx, py: sy,
      vx: -Math.sin(angle) * swirl,
      vy: Math.cos(angle) * swirl,
      cx: x, cy: y,
      r: 1.3 + Math.random() * 2.3,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      life: 1,
      decay: 0.016 + Math.random() * 0.02,
      phase: 'implode',
      age: Math.floor(Math.random() * 5), // slight stagger
      spin: swirl,
      kind: 'spark',
    });
  }
  return pieces;
}

/** Returns true on the frame a core ignites (so callers can punch a screen shake). */
export function updateConfetti(ctx: CanvasRenderingContext2D, confetti: ConfettiPiece[]): boolean {
  if (confetti.length === 0) return false;

  let ignited = false;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.px = c.x;
    c.py = c.y;
    c.age++;

    if (c.kind === 'core') {
      if (c.phase !== 'burst' && c.age >= CHARGE_END) {
        c.phase = 'burst';
        ignited = true;
      }
      if (c.phase === 'burst') c.life -= c.decay;
      if (c.life <= 0) { confetti.splice(i, 1); continue; }

      const charge = Math.min(c.age / CHARGE_END, 1);
      if (c.phase !== 'burst') {
        // Tight, pulsing point of light that swells as energy gathers.
        const pulse = 0.7 + Math.sin(c.age * 0.6) * 0.3;
        const rad = c.r * (0.12 + charge * charge * 0.7) * pulse;
        ctx.beginPath();
        ctx.arc(c.x, c.y, rad * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${0.06 + charge * 0.22})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + charge * 0.6})`;
        ctx.fill();
      } else {
        // Detonation flash: expands fast and fades.
        const t = 1 - c.life;
        const rad = c.r * (1 + t * 4);
        ctx.beginPath();
        ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${c.life * 0.5})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c.x, c.y, rad * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${c.life * 0.5})`;
        ctx.fill();
      }
      continue;
    }

    // --- Spark ---
    if (c.phase !== 'burst') {
      const dx = c.cx - c.x;
      const dy = c.cy - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const tx = -dy / d;
      const ty = dx / d;

      if (c.age >= CHARGE_END) {
        // Ignite: violent radial fling outward from the core.
        const a = d < 4 ? Math.random() * Math.PI * 2 : Math.atan2(c.y - c.cy, c.x - c.cx);
        const burst = 5 + Math.random() * 7;
        c.vx = Math.cos(a) * burst + (Math.random() - 0.5) * 2.4;
        c.vy = Math.sin(a) * burst + (Math.random() - 0.5) * 2.4;
        c.phase = 'burst';
      } else if (c.age >= IMPLODE_FRAMES) {
        // Charge: orbit tightly and vibrate as energy collects.
        c.phase = 'charge';
        c.vx += (dx / d) * 0.55 + tx * c.spin * 4;
        c.vy += (dy / d) * 0.55 + ty * c.spin * 4;
        c.vx = c.vx * 0.8 + (Math.random() - 0.5) * 0.8;
        c.vy = c.vy * 0.8 + (Math.random() - 0.5) * 0.8;
      } else {
        // Implode: accelerate inward (ramping) with a gentle spiral.
        const inward = 0.16 + (c.age / IMPLODE_FRAMES) * 0.55;
        c.vx += (dx / d) * inward + tx * c.spin;
        c.vy += (dy / d) * inward + ty * c.spin;
        c.vx *= 0.93;
        c.vy *= 0.93;
      }
    } else {
      c.vx *= 0.95;
      c.vy *= 0.95;
      c.life -= c.decay;
    }

    c.x += c.vx;
    c.y += c.vy;

    if (c.life <= 0) { confetti.splice(i, 1); continue; }

    // Motion streak (longer while bursting)
    ctx.beginPath();
    ctx.moveTo(c.px, c.py);
    ctx.lineTo(c.x, c.y);
    ctx.strokeStyle = `rgba(${c.color}, ${c.life * 0.45})`;
    ctx.lineWidth = c.r * 0.6;
    ctx.stroke();

    // Soft glow + bright core
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c.color}, ${c.life * 0.16})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c.color}, ${c.life * 0.5})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${c.life * 0.95})`;
    ctx.fill();
  }

  ctx.restore();
  return ignited;
}

export function updateSpaghettiStreams(ctx: CanvasRenderingContext2D, streams: SpaghettiStream[]): void {
  if (streams.length === 0) return;

  for (let i = streams.length - 1; i >= 0; i--) {
    const s = streams[i];

    // Accelerate toward black hole
    const toX = s.goalX - s.x;
    const toY = s.goalY - s.y;
    const toDist = Math.sqrt(toX * toX + toY * toY);
    if (toDist > 2) {
      s.vx += (toX / toDist) * 0.4;
      s.vy += (toY / toDist) * 0.4;
    }

    s.x += s.vx;
    s.y += s.vy;
    s.life -= s.decay;

    // Kill if reached core or expired
    if (s.life <= 0 || toDist < 16) {
      streams.splice(i, 1);
      continue;
    }

    // Draw elongated streak toward hole
    const heading = Math.atan2(s.vy, s.vx);
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    const tailX = s.x - Math.cos(heading) * s.length * (0.5 + speed * 0.3);
    const tailY = s.y - Math.sin(heading) * s.length * (0.5 + speed * 0.3);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = s.color + (s.life * 0.6) + ')';
    ctx.lineWidth = s.width * s.life;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Limit max streams for performance
  if (streams.length > 200) {
    streams.splice(0, streams.length - 200);
  }
}

export function updateCursorSpaghetti(
  mouse: { x: number; y: number },
  mousePageX: number, mousePageY: number,
  goals: GoalPost[],
  spaghettiRadius: number
): void {
  const spotlight = document.getElementById('cursor-spotlight');
  if (!spotlight) return;

  let nearestGoal: GoalPost | null = null;
  let nearestDist = Infinity;
  for (const goal of goals) {
    if (goal.scored) continue;
    const dx = mousePageX - goal.x;
    const dy = mousePageY - goal.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < spaghettiRadius * 1.5 && d < nearestDist) {
      nearestDist = d;
      nearestGoal = goal;
    }
  }

  if (nearestGoal && nearestDist < spaghettiRadius * 1.5) {
    const t = 1 - nearestDist / (spaghettiRadius * 1.5);
    const intensity = t * t;
    const angle = Math.atan2(nearestGoal.y - mousePageY, nearestGoal.x - mousePageX);
    const angleDeg = angle * 180 / Math.PI;
    const scaleX = 1 + intensity * 2.0;
    const scaleY = 1 - intensity * 0.4;
    // Pull spotlight toward hole
    const pullX = Math.cos(angle) * intensity * 30;
    const pullY = Math.sin(angle) * intensity * 30;
    const cx = mouse.x + pullX;
    const cy = mouse.y + pullY;
    spotlight.style.left = cx + 'px';
    spotlight.style.top = cy + 'px';
    spotlight.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) scale(${scaleX}, ${scaleY}) rotate(${-angleDeg}deg)`;
    spotlight.style.transition = 'none';
  } else {
    spotlight.style.transform = 'translate(-50%, -50%)';
    spotlight.style.transition = 'opacity 0.3s ease';
  }
}

export function isNearAnyGoal(
  p: Particle,
  goals: readonly GoalPost[],
  maxRange: number,
): boolean {
  const maxRangeSq = maxRange * maxRange;
  for (const g of goals) {
    if (g.scored) continue;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    if (dx * dx + dy * dy < maxRangeSq) return true;
  }
  return false;
}

export function findNearestGoal(
  p: Particle,
  goals: readonly GoalPost[],
  maxRange: number,
): { goal: GoalPost | null; dist: number } {
  let nearest: GoalPost | null = null;
  let nearestDistSq = maxRange * maxRange;
  for (const g of goals) {
    if (g.scored) continue;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const distSq = dx * dx + dy * dy;
    if (distSq >= nearestDistSq) continue;
    nearestDistSq = distSq;
    nearest = g;
  }
  return {
    goal: nearest,
    dist: nearest ? Math.sqrt(nearestDistSq) : Infinity,
  };
}

export function trySpawnSpaghettiStream(
  p: Particle,
  goal: GoalPost,
  dist: number,
  spaghettiRadius: number,
  isDark: boolean,
): SpaghettiStream | null {
  const threshold = spaghettiRadius * 0.8;
  if (dist >= threshold) return null;

  const t = 1 - dist / threshold;
  if (Math.random() >= t * (p.golden ? 0.6 : 0.15)) return null;

  const angle = Math.atan2(goal.y - p.y, goal.x - p.x);
  const spd = 1.5 + t * 4;

  return {
    x: p.x,
    y: p.y,
    vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 0.5,
    vy: Math.sin(angle) * spd + (Math.random() - 0.5) * 0.5,
    life: 1,
    decay: 0.025 + Math.random() * 0.025,
    width: p.golden ? 2 + t * 3 : 0.5 + t * 1.5,
    length: p.golden ? 8 + t * 16 : 3 + t * 8,
    color: p.golden ? 'rgba(255, 200, 80,' : (isDark ? 'rgba(124, 92, 255,' : 'rgba(80, 50, 200,'),
    goalX: goal.x,
    goalY: goal.y,
  };
}
