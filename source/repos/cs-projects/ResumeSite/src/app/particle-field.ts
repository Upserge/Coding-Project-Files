// TRIGGER WARNING: MATH
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
  private confetti: ConfettiPiece[] = [];
  private trails: TrailPiece[] = [];
  private spaghettiStreams: SpaghettiStream[] = [];
  private readonly GALAXY_COUNT = 4;

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
    this.spawnGalaxies();

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

  // This is all of the Galaxies code
  private spawnGalaxies() {
    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;

    // Galaxy color palettes — warm whites, soft blues, pale golds
    const palettes: { r: number; g: number; b: number }[][] = [
      // Warm white / gold nebula
      [
        { r: 255, g: 245, b: 220 },
        { r: 255, g: 225, b: 180 },
        { r: 255, g: 210, b: 160 },
        { r: 240, g: 200, b: 170 },
      ],
      // Cool blue / cyan nebula
      [
        { r: 180, g: 210, b: 255 },
        { r: 160, g: 200, b: 255 },
        { r: 140, g: 180, b: 240 },
        { r: 200, g: 220, b: 255 },
      ],
      // Rose / magenta nebula
      [
        { r: 255, g: 190, b: 220 },
        { r: 240, g: 170, b: 210 },
        { r: 220, g: 160, b: 200 },
        { r: 255, g: 200, b: 230 },
      ],
      // Emerald / teal nebula
      [
        { r: 160, g: 240, b: 220 },
        { r: 140, g: 220, b: 200 },
        { r: 180, g: 255, b: 230 },
        { r: 170, g: 230, b: 210 },
      ],
    ];

    const types: ('spiral' | 'elliptical' | 'band')[] = ['spiral', 'elliptical', 'band', 'spiral'];

    for (let gi = 0; gi < this.GALAXY_COUNT; gi++) {
      const type = types[gi % types.length];
      const palette = palettes[gi % palettes.length];
      const cx = w * 0.15 + Math.random() * w * 0.7;
      const cy = h * 0.1 + Math.random() * h * 0.8;
      const rotation = Math.random() * Math.PI * 2;
      const size = 120 + Math.random() * 180;
      const armCount = type === 'spiral' ? 2 + Math.floor(Math.random() * 5) : 0;
      const starCount = type === 'band' ? 100 + Math.floor(Math.random() * 60) : 60 + Math.floor(Math.random() * 50);

      for (let si = 0; si < starCount; si++) {
        let sx: number, sy: number;

        if (type === 'spiral') {
          // Logarithmic spiral arms with scatter
          const arm = si % armCount;
          const armAngle = (arm / armCount) * Math.PI * 2;
          const t = (si / starCount) * 4; // distance along spiral
          const spiralAngle = armAngle + t * 1.8 + rotation;
          const spiralR = t * size * 0.35;
          const scatter = (Math.random() - 0.5) * size * 0.18 * (0.5 + t * 0.3);
          const scatterPerp = (Math.random() - 0.5) * size * 0.12;
          sx = cx + Math.cos(spiralAngle) * (spiralR + scatter) + Math.cos(spiralAngle + Math.PI / 2) * scatterPerp;
          sy = cy + Math.sin(spiralAngle) * (spiralR + scatter) * 0.55 + Math.sin(spiralAngle + Math.PI / 2) * scatterPerp * 0.55;
        } else if (type === 'elliptical') {
          // Dense oval cluster with Gaussian-like falloff
          const angle = Math.random() * Math.PI * 2;
          const rr = Math.pow(Math.random(), 0.6) * size * 0.5;
          sx = cx + Math.cos(angle + rotation) * rr;
          sy = cy + Math.sin(angle + rotation) * rr * 0.6;
        } else {
          // Milky way band — long thin stripe with density variation
          const along = (Math.random() - 0.5) * size * 2.5;
          const perp = (Math.random() - 0.5) * size * 0.25;
          // Denser in the center
          const densityBias = Math.pow(Math.random(), 0.7);
          const adjustedPerp = perp * densityBias;
          sx = cx + Math.cos(rotation) * along - Math.sin(rotation) * adjustedPerp;
          sy = cy + Math.sin(rotation) * along + Math.cos(rotation) * adjustedPerp;
        }

        const color = palette[Math.floor(Math.random() * palette.length)];
        // Galaxy stars are slightly brighter and smaller than normal particles
        const distFromCenter = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
        const centerFade = Math.max(0.15, 1 - distFromCenter / (size * 1.5));
        const angle = Math.random() * Math.PI * 2;
        const driftSpeed = this.DRIFT_SPEED * 0.15; // very slow drift to hold formation

        this.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * driftSpeed,
          vy: Math.sin(angle) * driftSpeed,
          r: 0.4 + Math.random() * 1.6,
          opacity: (0.15 + Math.random() * 0.35) * centerFade,
          driftAngle: angle,
          driftRate: (Math.random() - 0.5) * 0.002,
          golden: false,
          pushTime: 0,
          galaxyColor: color,
          anchorX: sx,
          anchorY: sy,
        });
      }
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
        // When momentum fully decays, scatter drift angle so ship doesn't resume old heading
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
      // Golden particles occasionally jitter their drift direction
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

      // Thruster trail for Ranger when being pushed (3 nozzle ports)
      if (p.golden && p.pushTime > 3) {
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.05) {
          const heading = Math.atan2(p.vy, p.vx);
          const perpX = -Math.sin(heading);
          const perpY = Math.cos(heading);
          const rearDist = p.r * 4.0;
          const nozzleSpread = p.r * 1.3 * 1.8 * 1.5 * 0.22; // matches wingW * 0.22
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
      tileGrad.addColorStop(0, this.isDark ? '#e8e4ee' : '#dcd8e4');
      tileGrad.addColorStop(0.3, this.isDark ? '#d8d2e2' : '#ccc6d6');
      tileGrad.addColorStop(0.7, this.isDark ? '#c8c0d4' : '#bab2c6');
      tileGrad.addColorStop(1, this.isDark ? '#b0a8c0' : '#a29ab4');
      ctx.fillStyle = tileGrad;
      ctx.fill();
      ctx.strokeStyle = this.isDark ? 'rgba(80,70,100,0.35)' : 'rgba(50,40,70,0.35)';
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
      edgeGrad.addColorStop(0, this.isDark ? '#3a3248' : '#2a2238');
      edgeGrad.addColorStop(1, this.isDark ? '#4a4260' : '#3a3250');
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
      ctx.strokeStyle = this.isDark ? 'rgba(90,80,120,0.18)' : 'rgba(60,50,90,0.18)';
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
      ctx.fillStyle = this.isDark ? '#504868' : '#403858';
      ctx.fill();

      // --- Cockpit windows (cluster of small angular shapes) ---
      const winColor = this.isDark ? 'rgba(60,180,220,0.7)' : 'rgba(40,140,180,0.7)';
      const winFrame = this.isDark ? 'rgba(30,25,50,0.5)' : 'rgba(20,15,40,0.5)';
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
      ctx.fillStyle = this.isDark ? '#4a4260' : '#3a3250';
      ctx.fill();
      ctx.strokeStyle = this.isDark ? 'rgba(60,50,80,0.4)' : 'rgba(40,30,60,0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Engine nozzle ports (small circles)
      const nozzleX = rearX - len * 0.06;
      ctx.fillStyle = this.isDark ? '#2a2238' : '#1a1228';
      for (let ni = -1; ni <= 1; ni++) {
        ctx.beginPath();
        ctx.arc(nozzleX, ni * wingW * 0.22, wid * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // Inner glow
        ctx.beginPath();
        ctx.arc(nozzleX, ni * wingW * 0.22, wid * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = this.isDark ? 'rgba(80,70,100,0.4)' : 'rgba(60,50,80,0.4)';
        ctx.fill();
        ctx.fillStyle = this.isDark ? '#2a2238' : '#1a1228';
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
    } else {
      // Normal particle (theme-aware) or galaxy-tinted star
      const gc = p.galaxyColor;
      const glowPrimary = gc
        ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${p.opacity})`
        : this.isDark
          ? `rgba(124, 92, 255, ${p.opacity})`
          : `rgba(80, 50, 200, ${p.opacity * 1.8})`;
      const glowSecondary = gc
        ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${p.opacity * 0.3})`
        : this.isDark
          ? `rgba(94, 234, 212, ${p.opacity * 0.4})`
          : `rgba(20, 160, 140, ${p.opacity * 0.8})`;
      const coreColor = gc
        ? `rgba(255, 255, 255, ${p.opacity * 0.8})`
        : this.isDark
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
      gradient.addColorStop(1, gc
        ? `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`
        : this.isDark ? 'rgba(124, 92, 255, 0)' : 'rgba(80, 50, 200, 0)');

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
          goal.radius = newGoal.radius;
          goal.diskTilt = newGoal.diskTilt;
          goal.diskAxis = newGoal.diskAxis;
          goal.spinSpeed = newGoal.spinSpeed;
        }
        continue;
      }

      goal.pulsePhase += 0.015;

      // Skip drawing if off-screen
      if (goal.y < viewTop || goal.y > viewBottom) continue;

      const r = goal.radius;
      const ctx = this.ctx;
      const x = goal.x;
      const y = goal.y;
      const phase = goal.pulsePhase;

      // === NASA-style black hole rendering ===
      const darkMul = this.isDark ? 1 : 1.4;
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
      this.drawAccretionDisk(ctx, x, y, r, phase, diskTilt, diskRotation, darkMul, 'back');

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
      coreGrad.addColorStop(0, this.isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(10, 2, 20, 0.9)');
      coreGrad.addColorStop(0.65, this.isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(10, 2, 20, 0.85)');
      coreGrad.addColorStop(0.85, this.isDark ? 'rgba(5, 0, 15, 0.5)' : 'rgba(15, 5, 30, 0.4)');
      coreGrad.addColorStop(1, 'rgba(20, 5, 40, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // --- Front half of accretion disk (in front of the black hole) ---
      this.drawAccretionDisk(ctx, x, y, r, phase, diskTilt, diskRotation, darkMul, 'front');

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
  }

  private drawAccretionDisk(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, r: number,
    phase: number, tilt: number, rotation: number,
    darkMul: number, half: 'front' | 'back'
  ) {
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

    // Respawn the golden particle far from all goals and other rockets
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
      if (s.life <= 0 || toDist < 16) {
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
  galaxyColor?: { r: number; g: number; b: number };
  anchorX?: number;
  anchorY?: number;
}

interface GoalPost {
  x: number;
  y: number;
  pulsePhase: number;
  scored: boolean;
  scoreTimer: number;
  radius: number;
  diskTilt: number;
  diskAxis: number;
  spinSpeed: number;
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
