// Full-page interactive particle field background
// Particles drift slowly and are gently repulsed by the mouse cursor
export class ParticleField {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private particles: Particle[] = [];
  private mouse = { x: -9999, y: -9999 };
  private dpr = 1;
  private isDark = true;

  private readonly PARTICLE_COUNT = 160;
  private readonly REPULSE_RADIUS = 120;
  private readonly REPULSE_FORCE = 0.8;
  private readonly DRIFT_SPEED = 0.15;
  private readonly PARTICLE_MIN_R = 0.6;
  private readonly PARTICLE_MAX_R = 2.8;

  init() {
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
  }

  private spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.DRIFT_SPEED * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: this.PARTICLE_MIN_R + Math.random() * (this.PARTICLE_MAX_R - this.PARTICLE_MIN_R),
        opacity: 0.1 + Math.random() * 0.3,
        driftAngle: angle,
        driftRate: (Math.random() - 0.5) * 0.008,
      });
    }
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
    const h = window.innerHeight;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    // Read theme once per frame
    this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    for (const p of this.particles) {
      // Mouse repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.REPULSE_RADIUS && dist > 0) {
        const force = (1 - dist / this.REPULSE_RADIUS) * this.REPULSE_FORCE;
        const nx = dx / dist;
        const ny = dy / dist;
        p.vx += nx * force;
        p.vy += ny * force;
      }

      // Apply velocity with damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Aimless wandering — slowly rotate drift direction
      p.driftAngle += p.driftRate;
      const driftTarget = this.DRIFT_SPEED * 0.8;
      p.vx += Math.cos(p.driftAngle) * driftTarget * 0.02;
      p.vy += Math.sin(p.driftAngle) * driftTarget * 0.02;

      // Cap speed so particles stay gentle
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > this.DRIFT_SPEED * 2.5) {
        p.vx *= (this.DRIFT_SPEED * 2.5) / speed;
        p.vy *= (this.DRIFT_SPEED * 2.5) / speed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges with padding
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Theme-aware colors
      const glowPrimary = this.isDark
        ? `rgba(124, 92, 255, ${p.opacity})`
        : `rgba(80, 50, 200, ${p.opacity * 1.8})`;
      const glowSecondary = this.isDark
        ? `rgba(94, 234, 212, ${p.opacity * 0.4})`
        : `rgba(20, 160, 140, ${p.opacity * 0.8})`;
      const coreColor = this.isDark
        ? `rgba(255, 255, 255, ${p.opacity * 0.6})`
        : `rgba(60, 30, 180, ${p.opacity * 0.9})`;

      // Draw particle with glow
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      gradient.addColorStop(0, glowPrimary);
      gradient.addColorStop(0.4, glowSecondary);
      gradient.addColorStop(1, this.isDark ? 'rgba(124, 92, 255, 0)' : 'rgba(80, 50, 200, 0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Bright core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = coreColor;
      this.ctx.fill();
    }

    // Draw subtle connection lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
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

    this.ctx.restore();
    this.animationFrame = requestAnimationFrame(this.render);
  };

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
}
