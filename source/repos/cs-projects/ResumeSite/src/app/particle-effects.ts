// Visual effects: confetti, thruster trails, spaghetti streams, cursor spaghettification
import { ConfettiPiece, TrailPiece, SpaghettiStream, GoalPost } from './particle-field-types';

export function createConfetti(x: number, y: number, count: number): ConfettiPiece[] {
  const colors = ['#ffd700', '#ff6b35', '#ff1493', '#00e5ff', '#76ff03', '#fff', '#ffab00'];
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    pieces.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      r: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }
  return pieces;
}

export function updateConfetti(ctx: CanvasRenderingContext2D, confetti: ConfettiPiece[]): void {
  if (confetti.length === 0) return;

  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.vy += 0.12;
    c.vx *= 0.98;
    c.x += c.vx;
    c.y += c.vy;
    c.rotation += c.rotationSpeed;
    c.life -= c.decay;

    if (c.life <= 0) {
      confetti.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((c.rotation * Math.PI) / 180);
    ctx.globalAlpha = c.life;

    if (c.shape === 'rect') {
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.r / 2, -c.r / 4, c.r, c.r / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, c.r / 2, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
    }

    ctx.restore();
  }
}

export function updateTrails(ctx: CanvasRenderingContext2D, trails: TrailPiece[]): void {
  if (trails.length === 0) return;

  for (let i = trails.length - 1; i >= 0; i--) {
    const t = trails[i];
    t.x += t.vx;
    t.y += t.vy;
    t.vx *= 0.94;
    t.vy *= 0.94;
    t.life -= t.decay;

    if (t.life <= 0) {
      trails.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
    if (t.hot) {
      // Hot core: white → yellow
      const r = 255;
      const g = Math.floor(200 + t.life * 55);
      const b = Math.floor(100 * t.life);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t.life * 0.8})`;
    } else {
      // Cooler: orange → red smoke
      const r = 255;
      const g = Math.floor(120 * t.life);
      const b = Math.floor(30 * t.life);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t.life * 0.6})`;
    }
    ctx.fill();
  }
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
