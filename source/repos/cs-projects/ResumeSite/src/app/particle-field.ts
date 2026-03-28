// TRIGGER WARNING: MATH
// Full-page interactive particle field background with score game
// Particles drift slowly and are gently repulsed by the mouse cursor
// Rocket particles can be corralled into black holes for points
import { Particle, GoalPost, ConfettiPiece, TrailPiece, SpaghettiStream, TaurusLine } from './particle-field-types';
import { drawParticle } from './particle-renderer';
import { drawBlackHole } from './black-hole-renderer';
import { spawnGalaxies, spawnTaurus, drawTaurusLines } from './celestial-spawner';
import { createConfetti, updateConfetti, updateTrails, updateSpaghettiStreams, updateCursorSpaghetti } from './particle-effects';

export class ParticleField {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private particles: Particle[] = [];
  private goals: GoalPost[] = [];
  private mouse = { x: -9999, y: -9999 };
  private dpr = 1;
  private isDark = true;
  private shakeTimer = 0;
  private onScoreCallback: (() => void) | null = null;
  private pageHeight = 0;

  private readonly PARTICLE_COUNT = 2000;
  private readonly GOLDEN_COUNT = 3;
  private readonly GOAL_COUNT = 6;
  private readonly REPULSE_RADIUS = 120;
  private readonly REPULSE_FORCE = 0.8;
  private readonly DRIFT_SPEED = 0.15;
  private readonly PARTICLE_MIN_R = 0.6;
  private readonly PARTICLE_MAX_R = 2.8;
  private readonly SHAKE_DURATION = 35;
  private readonly CONFETTI_COUNT = 60;
  private readonly SPAGHETTI_RADIUS = 120;
  private readonly GOAL_HINT_PUSH_THRESHOLD = 4;
  private confetti: ConfettiPiece[] = [];
  private trails: TrailPiece[] = [];
  private spaghettiStreams: SpaghettiStream[] = [];
  private readonly GALAXY_COUNT = 4;
  private taurusLines: TaurusLine[] = [];
  private goalHintStrength = 0;

  init(onScore?: () => void) {
    this.onScoreCallback = onScore ?? null;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particle-field';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    `;
    document.body.prepend(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.spawnParticles();
    this.spawnGoals();

    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;
    this.particles.push(...spawnGalaxies(w, h, this.DRIFT_SPEED, this.GALAXY_COUNT));
    const taurus = spawnTaurus(w, h, this.DRIFT_SPEED);
    this.particles.push(...taurus.particles);
    this.taurusLines = taurus.lines;

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseleave', this.onMouseLeave);

    this.render();
  }

  private resize() {
    if (!this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.updatePageHeight();
  }

  private updatePageHeight() {
    this.pageHeight = Math.max(document.body.scrollHeight, window.innerHeight);
  }

  private spawnParticles() {
    this.particles = [];
    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.DRIFT_SPEED * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: this.PARTICLE_MIN_R + Math.random() * (this.PARTICLE_MAX_R - this.PARTICLE_MIN_R),
        opacity: 0.1 + Math.random() * 0.3,
        driftAngle: angle,
        driftRate: (Math.random() - 0.5) * 0.008,
        golden: false,
        pushTime: 0,
      });
    }

    for (let i = 0; i < this.GOLDEN_COUNT; i++) {
      const gp = this.createGoldenParticle();
      const occupied = this.getOccupiedPositions();
      let attempts = 0;
      do {
        gp.x = Math.random() * w;
        gp.y = Math.random() * h;
        attempts++;
      } while (attempts < 40 && occupied.some(o => {
        const dx = o.x - gp.x;
        const dy = o.y - gp.y;
        return Math.sqrt(dx * dx + dy * dy) < 250;
      }));
      this.particles.push(gp);
    }
  }

  private createGoldenParticle(): Particle {
    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;
    const angle = Math.random() * Math.PI * 2;
    const speed = this.DRIFT_SPEED * (0.2 + Math.random() * 0.4);
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

  private getOccupiedPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (const g of this.goals) {
      if (!g.scored) positions.push({ x: g.x, y: g.y });
    }
    for (const p of this.particles) {
      if (p.golden) positions.push({ x: p.x, y: p.y });
    }
    return positions;
  }

  private spawnGoals() {
    this.goals = [];
    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;
    const margin = 80;

    for (let i = 0; i < this.GOAL_COUNT; i++) {
      this.goals.push(this.createGoal(w, h, margin));
    }
  }

  private createGoal(w: number, h: number, margin: number): GoalPost {
    let x: number, y: number;
    let attempts = 0;
    const occupied = this.getOccupiedPositions();
    do {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * (h - margin * 2);
      attempts++;
    } while (attempts < 40 && occupied.concat(this.goals.filter(g => !g.scored)).some(o => {
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

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  private onMouseLeave = () => {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  };

  private render = () => {
    if (!this.ctx || !this.canvas) return;

    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;
    const scrollY = window.scrollY;
    const viewH = window.innerHeight;
    const viewTop = scrollY - 100;
    const viewBottom = scrollY + viewH + 100;

    this.updatePageHeight();

    const mousePageX = this.mouse.x;
    const mousePageY = this.mouse.y + scrollY;

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      const intensity = (this.shakeTimer / this.SHAKE_DURATION) * 14;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
      this.shakeTimer--;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.translate(shakeX, shakeY - scrollY);

    this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    this.updateGoalHintStrength();

    this.drawGoals(viewTop, viewBottom);
    this.updateParticles(w, h, mousePageX, mousePageY, viewTop, viewBottom);
    this.drawConnections(viewTop, viewBottom);
    drawTaurusLines(this.ctx, this.taurusLines, viewTop, viewBottom, this.isDark);
    updateConfetti(this.ctx, this.confetti);
    updateTrails(this.ctx, this.trails);
    updateSpaghettiStreams(this.ctx, this.spaghettiStreams);
    updateCursorSpaghetti(this.mouse, mousePageX, mousePageY, this.goals, this.SPAGHETTI_RADIUS);

    this.ctx.restore();
    this.animationFrame = requestAnimationFrame(this.render);
  };

  private updateParticles(w: number, h: number, mousePageX: number, mousePageY: number, viewTop: number, viewBottom: number) {
    if (!this.ctx) return;

    for (const p of this.particles) {
      // Mouse repulsion
      const dx = p.x - mousePageX;
      const dy = p.y - mousePageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.REPULSE_RADIUS && dist > 0) {
        if (p.golden) p.pushTime = Math.min(p.pushTime + 1, 120);
        const pushBoost = p.golden ? 1 + p.pushTime * 0.04 : 1;
        const force = (1 - dist / this.REPULSE_RADIUS) * this.REPULSE_FORCE * pushBoost;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      } else if (p.golden && p.pushTime > 0) {
        p.pushTime = Math.max(p.pushTime - 2, 0);
        if (p.pushTime === 0) {
          p.driftAngle = Math.random() * Math.PI * 2;
          p.driftRate = (Math.random() - 0.5) * 0.025;
        }
      }

      // Velocity with damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Aimless wandering
      p.driftAngle += p.driftRate;
      if (p.golden && Math.random() < 0.005) {
        p.driftRate = (Math.random() - 0.5) * 0.025;
      }

      // Galaxy stars gently return toward their anchor to hold formation
      if (p.anchorX !== undefined && p.anchorY !== undefined) {
        const ax = p.anchorX - p.x;
        const ay = p.anchorY - p.y;
        const ad = Math.sqrt(ax * ax + ay * ay);
        if (ad > 5) {
          p.vx += (ax / ad) * 0.008;
          p.vy += (ay / ad) * 0.008;
        }
      }

      const driftTarget = this.DRIFT_SPEED * 0.8;
      p.vx += Math.cos(p.driftAngle) * driftTarget * 0.02;
      p.vy += Math.sin(p.driftAngle) * driftTarget * 0.02;

      // Cap speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = p.golden ? this.DRIFT_SPEED * (3.5 + p.pushTime * 0.08) : this.DRIFT_SPEED * 2.5;
      if (speed > maxSpeed) {
        p.vx *= maxSpeed / speed;
        p.vy *= maxSpeed / speed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Thruster trail for Ranger when being pushed (3 nozzle ports)
      if (p.golden && p.pushTime > 3) {
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.05) {
          const heading = Math.atan2(p.vy, p.vx);
          const perpX = -Math.sin(heading);
          const perpY = Math.cos(heading);
          const rearDist = p.r * 4.0;
          const nozzleSpread = p.r * 1.3 * 1.8 * 1.5 * 0.22;
          const count = Math.min(Math.floor(p.pushTime / 15) + 1, 5);
          for (let ni = -1; ni <= 1; ni++) {
            const nx = p.x - Math.cos(heading) * rearDist + perpX * ni * nozzleSpread;
            const ny = p.y - Math.sin(heading) * rearDist + perpY * ni * nozzleSpread;
            for (let t = 0; t < count; t++) {
              this.trails.push({
                x: nx + (Math.random() - 0.5) * 3,
                y: ny + (Math.random() - 0.5) * 3,
                vx: -Math.cos(heading) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.6,
                vy: -Math.sin(heading) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.6,
                life: 1,
                decay: 0.03 + Math.random() * 0.03,
                size: 1.2 + Math.random() * 2,
                hot: Math.random() > 0.35,
              });
            }
          }
        }
      }

      // Goal collision for golden particles
      if (p.golden) {
        for (const goal of this.goals) {
          if (goal.scored) continue;
          const gx = p.x - goal.x;
          const gy = p.y - goal.y;
          const gd = Math.sqrt(gx * gx + gy * gy);
          if (gd < goal.radius) {
            this.triggerGoal(p, goal, w, h);
          }
        }
      }

      // Spaghettification: find nearest active black hole
      let spaghettiGoal: GoalPost | null = null;
      let spaghettiDist = Infinity;
      for (const goal of this.goals) {
        if (goal.scored) continue;
        const gx = p.x - goal.x;
        const gy = p.y - goal.y;
        const gd = Math.sqrt(gx * gx + gy * gy);
        if (gd < this.SPAGHETTI_RADIUS && gd < spaghettiDist) {
          spaghettiDist = gd;
          spaghettiGoal = goal;
        }
      }

      // Spawn spaghetti stream particles for objects being pulled in
      if (spaghettiGoal && spaghettiDist < this.SPAGHETTI_RADIUS * 0.8) {
        const t = 1 - spaghettiDist / (this.SPAGHETTI_RADIUS * 0.8);
        if (Math.random() < t * (p.golden ? 0.6 : 0.15)) {
          const angle = Math.atan2(spaghettiGoal.y - p.y, spaghettiGoal.x - p.x);
          const spd = 1.5 + t * 4;
          this.spaghettiStreams.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 0.5,
            vy: Math.sin(angle) * spd + (Math.random() - 0.5) * 0.5,
            life: 1,
            decay: 0.025 + Math.random() * 0.025,
            width: p.golden ? 2 + t * 3 : 0.5 + t * 1.5,
            length: p.golden ? 8 + t * 16 : 3 + t * 8,
            color: p.golden ? 'rgba(255, 200, 80,' : (this.isDark ? 'rgba(124, 92, 255,' : 'rgba(80, 50, 200,'),
            goalX: spaghettiGoal.x,
            goalY: spaghettiGoal.y,
          });
        }
      }

      // Only draw particles near the viewport
      if (p.y > viewTop && p.y < viewBottom) {
        drawParticle(this.ctx!, p, spaghettiGoal, spaghettiDist, this.isDark, this.SPAGHETTI_RADIUS);
      }
    }
  }

  private drawGoals(viewTop: number, viewBottom: number) {
    if (!this.ctx) return;

    for (const goal of this.goals) {
      if (goal.scored) {
        goal.scoreTimer--;
        if (goal.scoreTimer <= 0) {
          goal.scored = false;
          const w = window.innerWidth;
          const h = this.pageHeight || window.innerHeight;
          const newGoal = this.createGoal(w, h, 80);
          goal.x = newGoal.x;
          goal.y = newGoal.y;
          goal.radius = newGoal.radius;
          goal.diskTilt = newGoal.diskTilt;
          goal.diskAxis = newGoal.diskAxis;
          goal.spinSpeed = newGoal.spinSpeed;
        }
        continue;
      }

      goal.pulsePhase += 0.015;

      if (goal.y < viewTop || goal.y > viewBottom) continue;

      drawBlackHole(this.ctx, goal, this.isDark, this.goalHintStrength);
    }
  }

  private updateGoalHintStrength() {
    const isRocketMoving = this.particles.some(p => p.golden && p.pushTime >= this.GOAL_HINT_PUSH_THRESHOLD);
    const targetStrength = isRocketMoving ? 1 : 0;
    this.goalHintStrength += (targetStrength - this.goalHintStrength) * 0.12;
  }

  private drawConnections(viewTop: number, viewBottom: number) {
    if (!this.ctx) return;

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      if (a.golden || a.galaxyColor || a.y < viewTop || a.y > viewBottom) continue;
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        if (b.golden || b.galaxyColor || b.y < viewTop || b.y > viewBottom) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const alpha = (1 - dist / 100) * (this.isDark ? 0.06 : 0.12);
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = this.isDark
            ? `rgba(124, 92, 255, ${alpha})`
            : `rgba(80, 50, 200, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  private triggerGoal(p: Particle, goal: GoalPost, w: number, h: number) {
    goal.scored = true;
    goal.scoreTimer = 120;

    const newP = this.createGoldenParticle();
    const occupied = this.getOccupiedPositions();
    let attempts = 0;
    do {
      newP.x = Math.random() * w;
      newP.y = Math.random() * h;
      attempts++;
    } while (attempts < 40 && occupied.some(o => {
      const dx = o.x - newP.x;
      const dy = o.y - newP.y;
      return Math.sqrt(dx * dx + dy * dy) < 200;
    }));
    p.x = newP.x;
    p.y = newP.y;
    p.vx = newP.vx;
    p.vy = newP.vy;
    p.driftAngle = newP.driftAngle;

    this.shakeTimer = this.SHAKE_DURATION;
    this.confetti.push(...createConfetti(goal.x, goal.y, this.CONFETTI_COUNT));
    this.onScoreCallback?.();
  }

  destroy() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
  }
}
