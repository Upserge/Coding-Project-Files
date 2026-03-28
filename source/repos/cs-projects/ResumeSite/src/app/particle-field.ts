// TRIGGER WARNING: MATH
// Full-page interactive particle field background with score game
// Particles drift slowly and are gently repulsed by the mouse cursor
// Rocket particles can be corralled into black holes for points
import { Particle, GoalPost, ConfettiPiece, TrailPiece, SpaghettiStream, TaurusLine } from './particle-field-types';
import { drawParticle } from './particle-renderer';
import { drawBlackHole } from './black-hole-renderer';
import { spawnGalaxies, spawnTaurus, drawTaurusLines } from './celestial-spawner';
import { createConfetti, updateConfetti, updateTrails, updateSpaghettiStreams, updateCursorSpaghetti, spawnThrusterTrails, findNearestGoal, trySpawnSpaghettiStream } from './particle-effects';
import { UpgradeState } from './upgrade-state';
import { UpgradeModal } from './upgrade-modal';
import { UpgradeInventory } from './upgrade-inventory';
import { MilestoneProgressBar } from './milestone-progress-bar';
import { RunManager, RunStats } from './run-manager';
import { RunSummary } from './run-summary';
import { applyTractorAim, applyGravityWell } from './upgrade-physics';
import { drawConnections } from './connection-renderer';
import { createDustParticles, createRocketParticle, placeAwayFromOccupied, createGoalPost } from './particle-spawner';

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
  private onScoreCallback: ((points: number) => void) | null = null;
  private pageHeight = 0;
  private readonly upgradeState = new UpgradeState();
  private readonly upgradeModal = new UpgradeModal();
  private readonly inventory = new UpgradeInventory();
  private readonly progressBar = new MilestoneProgressBar();
  private readonly runManager = new RunManager();
  private readonly runSummary = new RunSummary();
  private paused = false;
  private goalsScoredThisRun = 0;

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

  init(onScore?: (points: number) => void) {
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
    this.spawnWorld();

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseleave', this.onMouseLeave);

    this.inventory.init();
    this.progressBar.init();
    this.runManager.init((stats) => this.runSummary.show(stats, () => this.restartRun()));

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
    this.particles.push(...createDustParticles(this.PARTICLE_COUNT, w, h, this.DRIFT_SPEED, this.PARTICLE_MIN_R, this.PARTICLE_MAX_R));

    for (let i = 0; i < this.GOLDEN_COUNT; i++) {
      const gp = createRocketParticle(w, h, this.DRIFT_SPEED);
      placeAwayFromOccupied(gp, w, h, this.getOccupiedPositions(), 250);
      this.particles.push(gp);
    }
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
    for (let i = 0; i < this.GOAL_COUNT; i++) {
      this.goals.push(createGoalPost(w, h, 80, this.getOccupiedPositions()));
    }
  }

  private spawnWorld(): void {
    this.spawnParticles();
    this.spawnGoals();
    const w = window.innerWidth;
    const h = this.pageHeight || window.innerHeight;
    this.particles.push(...spawnGalaxies(w, h, this.DRIFT_SPEED, this.GALAXY_COUNT));
    const taurus = spawnTaurus(w, h, this.DRIFT_SPEED);
    this.particles.push(...taurus.particles);
    this.taurusLines = taurus.lines;
    this.confetti = [];
    this.trails = [];
    this.spaghettiStreams = [];
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
    if (this.paused) {
      this.animationFrame = requestAnimationFrame(this.render);
      return;
    }

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
    this.tickRunSystems();

    this.drawGoals(viewTop, viewBottom);
    this.updateParticles(w, h, mousePageX, mousePageY, viewTop, viewBottom);
    drawConnections(this.ctx, this.particles, viewTop, viewBottom, this.isDark);
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

    const mods = this.upgradeState.modifiers;
    const effectiveRepulse = this.REPULSE_RADIUS * mods.repulseRadiusMul;
    const effectiveForce = this.REPULSE_FORCE * mods.repulseForceMul;
    this.upgradeState.tickChainReaction();

    for (const p of this.particles) {
      // Mouse repulsion
      const dx = p.x - mousePageX;
      const dy = p.y - mousePageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < effectiveRepulse && dist > 0) {
        if (p.golden) p.pushTime = Math.min(p.pushTime + 1, 120);
        const pushBoost = p.golden ? 1 + p.pushTime * 0.04 : 1;
        const force = (1 - dist / effectiveRepulse) * effectiveForce * pushBoost;
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
      p.vx *= mods.dragRetention;
      p.vy *= mods.dragRetention;

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

      // Thruster trail for Ranger when being pushed
      this.trails.push(...spawnThrusterTrails(p));

      // Tractor aim: gently steer pushed rockets toward nearest black hole
      if (p.golden && p.pushTime > 5 && mods.tractorAimStrength > 0) {
        applyTractorAim(p, this.goals, mods.tractorAimStrength);
      }

      // Gravity well: black holes pull nearby rockets
      if (p.golden && mods.gravityWellStrength > 0) {
        applyGravityWell(p, this.goals, mods.gravityWellStrength, this.SPAGHETTI_RADIUS * 1.5);
      }

      // Goal collision for golden particles
      if (p.golden) {
        const goalRadiusMul = mods.goalRadiusMul;
        for (const goal of this.goals) {
          if (goal.scored) continue;
          const gx = p.x - goal.x;
          const gy = p.y - goal.y;
          const gd = Math.sqrt(gx * gx + gy * gy);
          if (gd < goal.radius * goalRadiusMul) {
            this.triggerGoal(p, goal, w, h);
          }
        }
      }

      // Spaghettification: find nearest active black hole
      const { goal: spaghettiGoal, dist: spaghettiDist } = findNearestGoal(p, this.goals, this.SPAGHETTI_RADIUS);

      // Spawn spaghetti stream particles for objects being pulled in
      if (spaghettiGoal) {
        const stream = trySpawnSpaghettiStream(p, spaghettiGoal, spaghettiDist, this.SPAGHETTI_RADIUS, this.isDark);
        if (stream) this.spaghettiStreams.push(stream);
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
          const newGoal = createGoalPost(w, h, 80, this.getOccupiedPositions());
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

  private triggerGoal(p: Particle, goal: GoalPost, w: number, h: number) {
    goal.scored = true;
    goal.scoreTimer = 120;

    // First goal starts the run — reveal all HUD
    if (!this.runManager.isActive) {
      this.runManager.startRun(this.inventory, this.progressBar, this.upgradeState.nextMilestoneProgress());
    }

    const mods = this.upgradeState.modifiers;
    const comboMul = this.runManager.onGoalScored(mods.ventFreezeChance);

    const basePoints = this.upgradeState.computeScorePoints();
    const points = basePoints * comboMul;
    this.upgradeState.addScore(points);
    this.upgradeState.triggerChainReaction();
    this.goalsScoredThisRun++;

    const newP = createRocketParticle(w, h, this.DRIFT_SPEED);
    placeAwayFromOccupied(newP, w, h, this.getOccupiedPositions(), 200);
    p.x = newP.x;
    p.y = newP.y;
    p.vx = newP.vx;
    p.vy = newP.vy;
    p.driftAngle = newP.driftAngle;

    this.shakeTimer = this.SHAKE_DURATION;
    this.confetti.push(...createConfetti(goal.x, goal.y, this.CONFETTI_COUNT));
    this.onScoreCallback?.(points);
    this.progressBar.update(this.upgradeState.nextMilestoneProgress());
    this.checkMilestoneAndUpgrade(w, h);
  }

  private checkMilestoneAndUpgrade(w: number, h: number): void {
    if (!this.upgradeState.checkMilestone(this.upgradeState.score)) return;

    this.paused = true;
    this.upgradeModal.show(this.upgradeState.stackMap, (upgrade) => {
      this.upgradeState.applyUpgrade(upgrade);
      this.applyStructuralUpgrades(w, h);
      this.inventory.refresh(this.upgradeState.stackMap);
      this.progressBar.update(this.upgradeState.nextMilestoneProgress());
      this.paused = false;
    });
  }

  private applyStructuralUpgrades(w: number, h: number): void {
    const mods = this.upgradeState.modifiers;
    const targetRockets = this.GOLDEN_COUNT + mods.extraRockets;
    const currentRockets = this.particles.filter(p => p.golden).length;
    for (let i = currentRockets; i < targetRockets; i++) {
      this.particles.push(createRocketParticle(w, h, this.DRIFT_SPEED));
    }

    const targetGoals = this.GOAL_COUNT + mods.extraGoals;
    for (let i = this.goals.length; i < targetGoals; i++) {
      this.goals.push(createGoalPost(w, h, 80, this.getOccupiedPositions()));
    }
  }

  private tickRunSystems(): void {
    if (!this.runManager.isActive) return;
    const runEnded = this.runManager.tick(this.upgradeState.modifiers.entropyRateMul);
    if (!runEnded) return;
    this.paused = true;
    const upgradeCount = [...this.upgradeState.stackMap.values()].reduce((s, v) => s + v, 0);
    this.runManager.finalizeRun(this.upgradeState.score, upgradeCount);
  }

  private restartRun(): void {
    this.upgradeState.reset();
    this.runManager.restart(this.inventory, this.progressBar);
    this.runSummary.destroy();
    this.goalsScoredThisRun = 0;
    this.shakeTimer = 0;
    this.spawnWorld();
    this.paused = false;
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
    this.upgradeModal.destroyAll();
    this.inventory.destroy();
    this.progressBar.destroy();
    this.runManager.destroy();
    this.runSummary.destroy();
  }
}
