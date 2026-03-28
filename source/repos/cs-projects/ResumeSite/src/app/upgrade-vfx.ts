// Canvas-based particle VFX for upgrade ceremony moments

import { UpgradeRarity, RARITY_COLORS } from './upgrade-registry';

interface VFXParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'star' | 'diamond';
}

const SHAPE_POOL: VFXParticle['shape'][] = ['circle', 'star', 'diamond'];

const RARITY_BURST_COUNT: Record<UpgradeRarity, number> = {
  'common': 25,
  'uncommon': 40,
  'rare': 60,
  'ultra-rare': 90,
};

const RARITY_PALETTES: Record<UpgradeRarity, string[]> = {
  'common': ['#4ade80', '#22c55e', '#86efac', '#bbf7d0'],
  'uncommon': ['#60a5fa', '#3b82f6', '#93c5fd', '#38bdf8'],
  'rare': ['#c084fc', '#a855f7', '#d8b4fe', '#e879f9'],
  'ultra-rare': ['#fbbf24', '#f59e0b', '#fde68a', '#fef3c7', '#fff'],
};

export class UpgradeVFX {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: VFXParticle[] = [];
  private animFrame: number | null = null;

  /** Full-screen burst when upgrade modal opens */
  burstOpen(): void {
    this.ensureCanvas();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.spawnBurst(cx, cy, 50, ['#ffd700', '#fbbf24', '#fde68a', '#c084fc', '#60a5fa']);
    this.startLoop();
  }

  /** Rarity-themed burst when a card is selected */
  burstSelect(cardX: number, cardY: number, rarity: UpgradeRarity): void {
    this.ensureCanvas();
    const count = RARITY_BURST_COUNT[rarity];
    const palette = RARITY_PALETTES[rarity];
    this.spawnBurst(cardX, cardY, count, palette);

    if (rarity === 'ultra-rare') {
      this.spawnRing(cardX, cardY, palette);
    }

    this.startLoop();
  }

  destroy(): void {
    this.stopLoop();
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }

  private ensureCanvas(): void {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'upgrade-vfx-canvas';
    this.canvas.style.cssText = `
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10001;
    `;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx?.scale(dpr, dpr);
    document.body.appendChild(this.canvas);
  }

  private spawnBurst(cx: number, cy: number, count: number, palette: string[]): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1,
        decay: 0.012 + Math.random() * 0.012,
        size: 2 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        shape: SHAPE_POOL[Math.floor(Math.random() * SHAPE_POOL.length)],
      });
    }
  }

  private spawnRing(cx: number, cy: number, palette: string[]): void {
    const ringCount = 36;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 3.5;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008,
        size: 3,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: angle,
        rotationSpeed: 0,
        shape: 'star',
      });
    }
  }

  private startLoop(): void {
    if (this.animFrame !== null) return;
    this.tick();
  }

  private stopLoop(): void {
    if (this.animFrame === null) return;
    cancelAnimationFrame(this.animFrame);
    this.animFrame = null;
  }

  private tick = (): void => {
    if (!this.ctx || !this.canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.vx *= 0.985;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;

      this.drawShape(p);

      this.ctx.restore();
    }

    if (this.particles.length === 0) {
      this.stopLoop();
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
      return;
    }

    this.animFrame = requestAnimationFrame(this.tick);
  };

  private drawShape(p: VFXParticle): void {
    if (!this.ctx) return;

    switch (p.shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        return;
      case 'diamond':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.lineTo(p.size * 0.6, 0);
        this.ctx.lineTo(0, p.size);
        this.ctx.lineTo(-p.size * 0.6, 0);
        this.ctx.closePath();
        this.ctx.fill();
        return;
      case 'star':
        this.drawStar(p.size);
        return;
    }
  }

  private drawStar(size: number): void {
    if (!this.ctx) return;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      this.ctx[method](Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
      this.ctx.lineTo(Math.cos(innerAngle) * size * 0.4, Math.sin(innerAngle) * size * 0.4);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }
}
