// Full-page interactive particle field background with score game
// Particles drift slowly and are gently repulsed by the mouse cursor
// Rocket particles can be corralled into black holes for points
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

  private readonly PARTICLE_COUNT = 1000;
  private readonly GOLDEN_COUNT = 3;
  private readonly GOAL_COUNT = 6;
  private readonly REPULSE_RADIUS = 120;
  private readonly REPULSE_FORCE = 0.8;
  private readonly DRIFT_SPEED = 0.15;
  private readonly PARTICLE_MIN_R = 0.6;
  private readonly PARTICLE_MAX_R = 2.8;
  private readonly GOAL_RADIUS = 32;
  private readonly SHAKE_DURATION = 35;
  private readonly CONFETTI_COUNT = 40;
  private readonly SPAGHETTI_RADIUS = 120;
  private confetti: ConfettiPiece[] = [];
  private trails: TrailPiece[] = [];
  private spaghettiStreams: SpaghettiStream[] = [];

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
      this.particles.push(this.createGoldenParticle());
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
      r: 3.2 + Math.random() * 1.2,
      opacity: 0.6 + Math.random() * 0.3,
      driftAngle: angle,
      driftRate: (Math.random() - 0.5) * 0.005,
      golden: true,
      pushTime: 0,
    };
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
    do {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * (h - margin * 2);
      attempts++;
    } while (attempts < 20 && this.goals.some(g => {
      const dx = g.x - x;
      const dy = g.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 200;
    }));

    return { x, y, pulsePhase: Math.random() * Math.PI * 2, scored: false, scoreTimer: 0 };
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

    // Re-check page height periodically (cheap read)
    this.updatePageHeight();

    // Mouse position in page-space (mouse is in viewport coords)
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
    // Translate so page-space coords map to the viewport
    this.ctx.translate(shakeX, shakeY - scrollY);

    this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // Draw goal posts (only visible ones)
    this.drawGoals(viewTop, viewBottom);

    // Update and draw particles
    for (const p of this.particles) {
      // Mouse repulsion (convert mouse to page-space)
      const dx = p.x - mousePageX;
      const dy = p.y - mousePageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.REPULSE_RADIUS && dist > 0) {
        // Golden particles build momentum the longer they're pushed
        if (p.golden) p.pushTime = Math.min(p.pushTime + 1, 120);
        const pushBoost = p.golden ? 1 + p.pushTime * 0.04 : 1;
        const force = (1 - dist / this.REPULSE_RADIUS) * this.REPULSE_FORCE * pushBoost;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      } else if (p.golden && p.pushTime > 0) {
        // Decay momentum when not being pushed
        p.pushTime = Math.max(p.pushTime - 2, 0);
      }

      // Velocity with damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Aimless wandering
      p.driftAngle += p.driftRate;
      const driftTarget = this.DRIFT_SPEED * 0.8;
      p.vx += Math.cos(p.driftAngle) * driftTarget * 0.02;
      p.vy += Math.sin(p.driftAngle) * driftTarget * 0.02;

      // Cap speed (golden particles are a bit slower so they're easier to herd)
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = p.golden ? this.DRIFT_SPEED * (3.5 + p.pushTime * 0.08) : this.DRIFT_SPEED * 2.5;
      if (speed > maxSpeed) {
        p.vx *= maxSpeed / speed;
        p.vy *= maxSpeed / speed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges (full page height)
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Thruster trail for golden rockets when being pushed
      if (p.golden && p.pushTime > 3) {
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.05) {
          const heading = Math.atan2(p.vy, p.vx);
          const tailX = p.x - Math.cos(heading) * p.r * 3.5;
          const tailY = p.y - Math.sin(heading) * p.r * 3.5;
          const count = Math.min(Math.floor(p.pushTime / 15) + 1, 4);
          for (let t = 0; t < count; t++) {
            this.trails.push({
              x: tailX + (Math.random() - 0.5) * 4,
              y: tailY + (Math.random() - 0.5) * 4,
              vx: -Math.cos(heading) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.8,
              vy: -Math.sin(heading) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.8,
              life: 1,
              decay: 0.03 + Math.random() * 0.03,
              size: 1.5 + Math.random() * 2.5,
              hot: Math.random() > 0.4,
            });
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
          if (gd < this.GOAL_RADIUS) {
            this.triggerGoal(p, goal, w, h);
          }
        }
      }

      // Spaghettification: find nearest active black hole and compute stretch
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
        this.drawParticle(p, spaghettiGoal, spaghettiDist);
      }
    }

    // Draw connection lines between nearby visible particles
    this.drawConnections(viewTop, viewBottom);

    // Update and draw confetti
    this.updateConfetti();

    // Update and draw thruster trails
    this.updateTrails();

    // Update and draw spaghetti streams
    this.updateSpaghettiStreams();

    // Cursor spaghettification
    this.updateCursorSpaghetti(mousePageX, mousePageY);

    this.ctx.restore();
    this.animationFrame = requestAnimationFrame(this.render);
  };

  private drawParticle(p: Particle, spagGoal: GoalPost | null, spagDist: number) {
    if (!this.ctx) return;

    // Compute spaghettification stretch
    let stretchX = 1;
    let stretchY = 1;
    let stretchAngle = 0;
    if (spagGoal && spagDist < this.SPAGHETTI_RADIUS) {
      const t = 1 - spagDist / this.SPAGHETTI_RADIUS;
      const intensity = t * t; // quadratic ramp
      stretchAngle = Math.atan2(spagGoal.y - p.y, spagGoal.x - p.x);
      stretchX = 1 + intensity * 2.5; // stretch toward hole
      stretchY = 1 - intensity * 0.5; // compress perpendicular
    }

    if (p.golden) {
      const ctx = this.ctx;
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

      // Glow behind rocket
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 2);
      glow.addColorStop(0, 'rgba(255, 200, 80, 0.12)');
      glow.addColorStop(1, 'rgba(255, 200, 80, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, len * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Body (rounded rect shape)
      ctx.beginPath();
      ctx.moveTo(len, 0);
      ctx.quadraticCurveTo(len * 0.6, -wid, -len * 0.2, -wid * 0.8);
      ctx.lineTo(-len * 0.5, -wid * 0.6);
      ctx.lineTo(-len * 0.5, wid * 0.6);
      ctx.lineTo(-len * 0.2, wid * 0.8);
      ctx.quadraticCurveTo(len * 0.6, wid, len, 0);
      ctx.closePath();
      ctx.fillStyle = this.isDark ? '#e8e0f0' : '#d0c8e0';
      ctx.fill();
      ctx.strokeStyle = this.isDark ? 'rgba(180,160,220,0.5)' : 'rgba(100,80,140,0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Nose cone
      ctx.beginPath();
      ctx.moveTo(len, 0);
      ctx.quadraticCurveTo(len * 0.8, -wid * 0.5, len * 0.5, -wid * 0.7);
      ctx.quadraticCurveTo(len * 0.8, 0, len * 0.5, wid * 0.7);
      ctx.quadraticCurveTo(len * 0.8, wid * 0.5, len, 0);
      ctx.closePath();
      ctx.fillStyle = '#ff4444';
      ctx.fill();

      // Top fin
      ctx.beginPath();
      ctx.moveTo(-len * 0.25, -wid * 0.7);
      ctx.lineTo(-len * 0.6, -wid * 1.8);
      ctx.lineTo(-len * 0.55, -wid * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#ff4444';
      ctx.fill();

      // Bottom fin
      ctx.beginPath();
      ctx.moveTo(-len * 0.25, wid * 0.7);
      ctx.lineTo(-len * 0.6, wid * 1.8);
      ctx.lineTo(-len * 0.55, wid * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#ff4444';
      ctx.fill();

      // Window
      ctx.beginPath();
      ctx.arc(len * 0.2, 0, wid * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = '#5bcefa';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(len * 0.17, -wid * 0.08, wid * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();

      // Idle engine flicker (always visible, small)
      if (p.pushTime <= 3) {
        const flickLen = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(-len * 0.5, -wid * 0.3);
        ctx.lineTo(-len * 0.5 - flickLen, 0);
        ctx.lineTo(-len * 0.5, wid * 0.3);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 160, 40, ${0.3 + Math.random() * 0.3})`;
        ctx.fill();
      }

      ctx.restore();
    } else {
      // Normal particle (theme-aware)
      const glowPrimary = this.isDark
        ? `rgba(124, 92, 255, ${p.opacity})`
        : `rgba(80, 50, 200, ${p.opacity * 1.8})`;
      const glowSecondary = this.isDark
        ? `rgba(94, 234, 212, ${p.opacity * 0.4})`
        : `rgba(20, 160, 140, ${p.opacity * 0.8})`;
      const coreColor = this.isDark
        ? `rgba(255, 255, 255, ${p.opacity * 0.6})`
        : `rgba(60, 30, 180, ${p.opacity * 0.9})`;

      // Apply spaghettification stretch for normal particles
      if (spagGoal) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(stretchAngle);
        this.ctx.scale(stretchX, stretchY);
        this.ctx.rotate(-stretchAngle);
        this.ctx.translate(-p.x, -p.y);
      }

      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      gradient.addColorStop(0, glowPrimary);
      gradient.addColorStop(0.4, glowSecondary);
      gradient.addColorStop(1, this.isDark ? 'rgba(124, 92, 255, 0)' : 'rgba(80, 50, 200, 0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = coreColor;
      this.ctx.fill();

      if (spagGoal) {
        this.ctx.restore();
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
        }
        continue;
      }

      goal.pulsePhase += 0.015;

      // Skip drawing if off-screen
      if (goal.y < viewTop || goal.y > viewBottom) continue;

      const r = this.GOAL_RADIUS;
      const ctx = this.ctx;
      const x = goal.x;
      const y = goal.y;
      const phase = goal.pulsePhase;

      // Distortion rings — concentric warping halos
      for (let i = 4; i >= 1; i--) {
        const ringR = r + i * 12;
        const ringAlpha = (0.04 / i) * (this.isDark ? 1 : 1.5);
        ctx.beginPath();
        ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160, 120, 255, ${ringAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Outer gravitational glow
      const outerGlow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.5);
      outerGlow.addColorStop(0, 'rgba(100, 60, 200, 0.12)');
      outerGlow.addColorStop(0.5, 'rgba(180, 100, 255, 0.04)');
      outerGlow.addColorStop(1, 'rgba(180, 100, 255, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Rotating spiral arms (accretion streams)
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(phase);
      for (let arm = 0; arm < 3; arm++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.beginPath();
        for (let t = 0; t < 60; t++) {
          const angle = t * 0.12;
          const spiralR = r * 0.4 + t * 0.8;
          const sx = Math.cos(angle) * spiralR;
          const sy = Math.sin(angle) * spiralR;
          if (t === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        const armAlpha = this.isDark ? 0.08 : 0.12;
        ctx.strokeStyle = `rgba(255, 180, 60, ${armAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Accretion disk — bright elliptical ring
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(phase * 0.7);
      ctx.scale(1, 0.35);
      const diskPulse = 0.9 + Math.sin(phase * 3) * 0.1;
      const diskR = r * 1.4 * diskPulse;
      const diskGrad = ctx.createRadialGradient(0, 0, diskR * 0.7, 0, 0, diskR);
      diskGrad.addColorStop(0, 'rgba(255, 200, 80, 0)');
      diskGrad.addColorStop(0.6, `rgba(255, 160, 40, ${this.isDark ? 0.15 : 0.2})`);
      diskGrad.addColorStop(0.8, `rgba(255, 120, 20, ${this.isDark ? 0.1 : 0.15})`);
      diskGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, diskR, 0, Math.PI * 2);
      ctx.fillStyle = diskGrad;
      ctx.fill();
      ctx.restore();

      // Photon ring — bright lensing edge
      const lensGrad = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 1.15);
      lensGrad.addColorStop(0, 'rgba(200, 170, 255, 0)');
      lensGrad.addColorStop(0.4, `rgba(220, 190, 255, ${this.isDark ? 0.12 : 0.18})`);
      lensGrad.addColorStop(0.6, `rgba(255, 220, 150, ${this.isDark ? 0.1 : 0.15})`);
      lensGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = lensGrad;
      ctx.fill();

      // Event horizon — dark core
      const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      coreGrad.addColorStop(0, this.isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(15, 5, 30, 0.85)');
      coreGrad.addColorStop(0.7, this.isDark ? 'rgba(10, 0, 30, 0.7)' : 'rgba(20, 10, 40, 0.6)');
      coreGrad.addColorStop(1, 'rgba(40, 10, 80, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Singularity — tiny bright point at center
      const singPulse = 0.6 + Math.sin(phase * 5) * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${singPulse * 0.3})`;
      ctx.fill();
    }
  }

  private drawConnections(viewTop: number, viewBottom: number) {
    if (!this.ctx) return;

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      if (a.golden || a.y < viewTop || a.y > viewBottom) continue;
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        if (b.golden || b.y < viewTop || b.y > viewBottom) continue;
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

    // Respawn the golden particle far from the scored goal
    const newP = this.createGoldenParticle();
    let attempts = 0;
    do {
      newP.x = Math.random() * w;
      newP.y = Math.random() * h;
      attempts++;
    } while (attempts < 15 && Math.sqrt((newP.x - goal.x) ** 2 + (newP.y - goal.y) ** 2) < 200);
    p.x = newP.x;
    p.y = newP.y;
    p.vx = newP.vx;
    p.vy = newP.vy;
    p.driftAngle = newP.driftAngle;

    // Screen shake
    this.shakeTimer = this.SHAKE_DURATION;

    // Confetti burst at goal position
    this.spawnConfetti(goal.x, goal.y);

    // Notify
    this.onScoreCallback?.();
  }

  private spawnConfetti(x: number, y: number) {
    const colors = ['#ffd700', '#ff6b35', '#ff1493', '#00e5ff', '#76ff03', '#fff', '#ffab00'];
    for (let i = 0; i < this.CONFETTI_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.confetti.push({
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
  }

  private updateConfetti() {
    if (!this.ctx || this.confetti.length === 0) return;

    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.vy += 0.12;
      c.vx *= 0.98;
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;
      c.life -= c.decay;

      if (c.life <= 0) {
        this.confetti.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate((c.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = c.life;

      if (c.shape === 'rect') {
        this.ctx.fillStyle = c.color;
        this.ctx.fillRect(-c.r / 2, -c.r / 4, c.r, c.r / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, c.r / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = c.color;
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  private updateTrails() {
    if (!this.ctx || this.trails.length === 0) return;

    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.x += t.vx;
      t.y += t.vy;
      t.vx *= 0.94;
      t.vy *= 0.94;
      t.life -= t.decay;

      if (t.life <= 0) {
        this.trails.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
      if (t.hot) {
        // Hot core: white → yellow
        const r = 255;
        const g = Math.floor(200 + t.life * 55);
        const b = Math.floor(100 * t.life);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t.life * 0.8})`;
      } else {
        // Cooler: orange → red smoke
        const r = 255;
        const g = Math.floor(120 * t.life);
        const b = Math.floor(30 * t.life);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t.life * 0.6})`;
      }
      this.ctx.fill();
    }
  }

  private updateSpaghettiStreams() {
    if (!this.ctx || this.spaghettiStreams.length === 0) return;

    for (let i = this.spaghettiStreams.length - 1; i >= 0; i--) {
      const s = this.spaghettiStreams[i];

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
      if (s.life <= 0 || toDist < this.GOAL_RADIUS * 0.5) {
        this.spaghettiStreams.splice(i, 1);
        continue;
      }

      // Draw elongated streak toward hole
      const heading = Math.atan2(s.vy, s.vx);
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const tailX = s.x - Math.cos(heading) * s.length * (0.5 + speed * 0.3);
      const tailY = s.y - Math.sin(heading) * s.length * (0.5 + speed * 0.3);

      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(s.x, s.y);
      this.ctx.strokeStyle = s.color + (s.life * 0.6) + ')';
      this.ctx.lineWidth = s.width * s.life;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    // Limit max streams for performance
    if (this.spaghettiStreams.length > 200) {
      this.spaghettiStreams.splice(0, this.spaghettiStreams.length - 200);
    }
  }

  private updateCursorSpaghetti(mousePageX: number, mousePageY: number) {
    const spotlight = document.getElementById('cursor-spotlight');
    if (!spotlight) return;

    let nearestGoal: GoalPost | null = null;
    let nearestDist = Infinity;
    for (const goal of this.goals) {
      if (goal.scored) continue;
      const dx = mousePageX - goal.x;
      const dy = mousePageY - goal.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < this.SPAGHETTI_RADIUS * 1.5 && d < nearestDist) {
        nearestDist = d;
        nearestGoal = goal;
      }
    }

    if (nearestGoal && nearestDist < this.SPAGHETTI_RADIUS * 1.5) {
      const scrollY = window.scrollY;
      const t = 1 - nearestDist / (this.SPAGHETTI_RADIUS * 1.5);
      const intensity = t * t;
      const angle = Math.atan2(nearestGoal.y - mousePageY, nearestGoal.x - mousePageX);
      const angleDeg = angle * 180 / Math.PI;
      const scaleX = 1 + intensity * 2.0;
      const scaleY = 1 - intensity * 0.4;
      // Pull spotlight toward hole
      const pullX = Math.cos(angle) * intensity * 30;
      const pullY = Math.sin(angle) * intensity * 30;
      const cx = this.mouse.x + pullX;
      const cy = this.mouse.y + pullY;
      spotlight.style.left = cx + 'px';
      spotlight.style.top = cy + 'px';
      spotlight.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) scale(${scaleX}, ${scaleY}) rotate(${-angleDeg}deg)`;
      spotlight.style.transition = 'none';
    } else {
      spotlight.style.transform = 'translate(-50%, -50%)';
      spotlight.style.transition = 'opacity 0.3s ease';
    }
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  driftAngle: number;
  driftRate: number;
  golden: boolean;
  pushTime: number;
}

interface GoalPost {
  x: number;
  y: number;
  pulsePhase: number;
  scored: boolean;
  scoreTimer: number;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
  decay: number;
  shape: 'rect' | 'circle';
}

interface TrailPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  hot: boolean;
}

interface SpaghettiStream {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  width: number;
  length: number;
  color: string;
  goalX: number;
  goalY: number;
}
