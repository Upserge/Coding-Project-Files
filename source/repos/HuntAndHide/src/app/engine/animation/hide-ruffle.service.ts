import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import { ObstacleType } from '../../models/map.model';
import { ParticleVfxService } from './particle-vfx.service';
import { EngineService } from '../engine.service';

/**
 * HideRuffleService plays a short "ruffle" animation on an obstacle
 * mesh when a hider enters it, plus type-specific particle VFX.
 *
 * Each obstacle type has a distinct feel:
 *   sedan     — rock back-and-forth + metallic sun-sparkle
 *   hole      — upward dirt puffs
 *   bush      — leaf / debris shake cloud
 *   leaf_pile — leaves splatter outward
 *   tent      — side-to-side shake + dirt puff around edges
 *
 * Call `trigger(obstacleId, type)` once per hide event.
 * Call `tick(delta)` every frame to advance active animations.
 */

/** How long the mesh animation lasts (seconds). */
const RUFFLE_DURATION = 0.5;

interface ActiveRuffle {
  group: THREE.Group;
  type: ObstacleType;
  elapsed: number;
  baseQuaternion: THREE.Quaternion;
  baseY: number;
}

@Injectable({ providedIn: 'root' })
export class HideRuffleService {
  private readonly engine = inject(EngineService);
  private readonly particles = inject(ParticleVfxService);

  private active = new Map<string, ActiveRuffle>();

  // ── Public API ──────────────────────────────────────────────

  /** Kick off a ruffle for the given obstacle. Idempotent per obstacle. */
  trigger(obstacleId: string, type: ObstacleType): void {
    if (this.active.has(obstacleId)) return;
    const group = this.engine.getObstacleMesh(obstacleId);
    if (!group) return;

    this.active.set(obstacleId, {
      group,
      type,
      elapsed: 0,
      baseQuaternion: group.quaternion.clone(),
      baseY: group.position.y,
    });

    this.spawnParticles(type, group.position);
  }

  /** Advance all active ruffle animations. Call once per frame. */
  tick(delta: number): void {
    for (const [id, ruffle] of this.active) {
      ruffle.elapsed += delta;
      if (ruffle.elapsed >= RUFFLE_DURATION) {
        this.restore(ruffle);
        this.active.delete(id);
        continue;
      }
      this.animate(ruffle);
    }
  }

  dispose(): void {
    for (const [, ruffle] of this.active) this.restore(ruffle);
    this.active.clear();
  }

  // ── Per-type mesh animation ────────────────────────────────

  private animate(ruffle: ActiveRuffle): void {
    const t = ruffle.elapsed / RUFFLE_DURATION;
    const decay = 1 - t;

    switch (ruffle.type) {
      case 'sedan':      return this.animateSedan(ruffle, t, decay);
      case 'hole':       return this.animateHole(ruffle, t, decay);
      case 'bush':       return this.animateBush(ruffle, t, decay);
      case 'leaf_pile':  return this.animateLeafPile(ruffle, t, decay);
      case 'tent':       return this.animateTent(ruffle, t, decay);
    }
  }

  /** Car: rock along Z axis with decaying amplitude. */
  private animateSedan(r: ActiveRuffle, t: number, decay: number): void {
    const angle = Math.sin(t * Math.PI * 6) * 0.04 * decay;
    r.group.quaternion.copy(r.baseQuaternion);
    r.group.rotateZ(angle);
  }

  /** Hole: quick vertical dip then bounce back. */
  private animateHole(r: ActiveRuffle, t: number, decay: number): void {
    const dip = Math.sin(t * Math.PI) * 0.15 * decay;
    r.group.position.y = r.baseY - dip;
  }

  /** Bush: rapid XZ scale puff — visually distinct from sedan's rotation. */
  private animateBush(r: ActiveRuffle, t: number, decay: number): void {
    const pulse = 1 + Math.sin(t * Math.PI * 8) * 0.15 * decay;
    r.group.scale.x = pulse;
    r.group.scale.z = pulse;
  }

  /** Leaf pile: slight vertical scale pulse (puffs up then settles). */
  private animateLeafPile(r: ActiveRuffle, t: number, decay: number): void {
    const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.12 * decay;
    r.group.scale.y = pulse;
  }

  /** Tent: rapid side-to-side shake on Z axis. */
  private animateTent(r: ActiveRuffle, t: number, decay: number): void {
    const angle = Math.sin(t * Math.PI * 8) * 0.05 * decay;
    r.group.quaternion.copy(r.baseQuaternion);
    r.group.rotateZ(angle);
  }

  // ── Per-type particle VFX ──────────────────────────────────

  private spawnParticles(type: ObstacleType, pos: THREE.Vector3): void {
    const p = { x: pos.x, y: pos.y, z: pos.z };

    switch (type) {
      case 'sedan':      return this.spawnSedanSparkle(p);
      case 'hole':       return this.spawnHoleDirt(p);
      case 'bush':       return this.spawnBushLeaves(p);
      case 'leaf_pile':  return this.spawnLeafSplatter(p);
      case 'tent':       return this.spawnTentDirt(p);
    }
  }

  /** Bright white/gold sparks — sun catching metal. */
  private spawnSedanSparkle(pos: { x: number; y: number; z: number }): void {
    this.particles.spawnBurst({
      position: pos, count: 16, color: 0xffffff,
      size: 10, speed: 2.8, lifetime: 0.5,
      gravity: -0.6, spread: 2.0, yOffset: 2.0,
    });
    this.particles.spawnBurst({
      position: pos, count: 12, color: 0xffd700,
      size: 8, speed: 2.2, lifetime: 0.45,
      gravity: -0.5, spread: 1.6, yOffset: 2.2,
    });
  }

  /** Small dirt puffs shooting upward from the hole. */
  private spawnHoleDirt(pos: { x: number; y: number; z: number }): void {
    this.particles.spawnBurst({
      position: pos, count: 14, color: 0x8b6b4a,
      size: 6, speed: 2.0, lifetime: 0.5,
      gravity: -3.0, spread: 0.5, yOffset: 0.1,
    });
    this.particles.spawnBurst({
      position: pos, count: 8, color: 0xa08060,
      size: 4, speed: 1.4, lifetime: 0.4,
      gravity: -2.5, spread: 0.3, yOffset: 0.05,
    });
  }

  /** Bright leaf bits + tan dust cloud around the bush. */
  private spawnBushLeaves(pos: { x: number; y: number; z: number }): void {
    this.particles.spawnBurst({
      position: pos, count: 16, color: 0xc6ff00,
      size: 9, speed: 2.4, lifetime: 0.55,
      gravity: -2.0, spread: 1.8, yOffset: 1.2,
    });
    this.particles.spawnBurst({
      position: pos, count: 10, color: 0xd2b48c,
      size: 8, speed: 1.4, lifetime: 0.45,
      gravity: -1.0, spread: 1.4, yOffset: 0.4,
    });
  }

  /** Leaves burst outward and flutter down. */
  private spawnLeafSplatter(pos: { x: number; y: number; z: number }): void {
    for (const color of [0x8bc34a, 0xcddc39, 0x795548]) {
      this.particles.spawnBurst({
        position: pos, count: 10, color,
        size: 6, speed: 2.4, lifetime: 0.55,
        gravity: -2.2, spread: 1.4, yOffset: 0.4,
      });
    }
  }

  /** Dirt puff around tent edges — dust kicked up on entry. */
  private spawnTentDirt(pos: { x: number; y: number; z: number }): void {
    this.particles.spawnBurst({
      position: pos, count: 18, color: 0xa08060,
      size: 8, speed: 2.0, lifetime: 0.5,
      gravity: -2.5, spread: 2.2, yOffset: 0.15,
    });
    this.particles.spawnBurst({
      position: pos, count: 10, color: 0xc8b090,
      size: 6, speed: 1.2, lifetime: 0.4,
      gravity: -1.5, spread: 1.8, yOffset: 0.1,
    });
  }

  // ── Cleanup helpers ────────────────────────────────────────

  private restore(r: ActiveRuffle): void {
    r.group.quaternion.copy(r.baseQuaternion);
    r.group.position.y = r.baseY;
    if (r.type === 'leaf_pile') r.group.scale.y = 1;
    if (r.type === 'bush') { r.group.scale.x = 1; r.group.scale.z = 1; }
  }
}
