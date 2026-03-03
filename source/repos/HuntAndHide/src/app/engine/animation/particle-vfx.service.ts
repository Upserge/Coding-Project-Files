import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Vec3 } from '../../models/player.model';

/** A single particle burst effect being played. */
interface ParticleEffect {
  id: string;
  mesh: THREE.Points;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetime: number;
  elapsed: number;
  gravity: number;
}

/**
 * Lightweight particle VFX service — spawns short-lived point-cloud bursts
 * for movement dust, item pickups, smoke bombs, and speed trails.
 *
 * Uses a single THREE.Points per effect (instanced particles via BufferGeometry).
 * Each effect auto-cleans after its lifetime expires.
 */
@Injectable({ providedIn: 'root' })
export class ParticleVfxService {

  private scene!: THREE.Scene;
  private effects = new Map<string, ParticleEffect>();
  private nextId = 0;

  init(scene: THREE.Scene): void {
    this.scene = scene;
  }

  dispose(): void {
    for (const [, effect] of this.effects) {
      this.scene?.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      (effect.mesh.material as THREE.PointsMaterial).dispose();
    }
    this.effects.clear();
  }

  /** Call every frame to advance particle lifetimes and clean up expired effects. */
  tick(delta: number): void {
    for (const [id, effect] of this.effects) {
      effect.elapsed += delta;
      if (effect.elapsed >= effect.maxLifetime) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        (effect.mesh.material as THREE.PointsMaterial).dispose();
        this.effects.delete(id);
        continue;
      }
      this.advanceParticles(effect, delta);
    }
  }

  // ── Effect spawners ──────────────────────────────────────

  /** Small puff of dust at the player's feet when moving. */
  spawnDustPuff(position: Vec3): void {
    this.spawnBurst({
      position,
      count: 6,
      color: 0xc8b090,
      size: 6,
      speed: 0.8,
      lifetime: 0.4,
      gravity: -0.5,
      spread: 0.3,
      yOffset: 0.05,
    });
  }

  /** Tiny puff at each foot strike during walk/run. */
  spawnFootstep(position: Vec3, isRunning: boolean): void {
    this.spawnBurst({
      position,
      count: isRunning ? 5 : 3,
      color: 0xb8a080,
      size: isRunning ? 5 : 3,
      speed: isRunning ? 0.6 : 0.35,
      lifetime: isRunning ? 0.3 : 0.25,
      gravity: -0.4,
      spread: 0.15,
      yOffset: 0.02,
    });
  }

  /** Dramatic burst when a hider is caught by a hunter. */
  spawnCatchBurst(position: Vec3): void {
    // Red-orange main burst
    this.spawnBurst({
      position,
      count: 18,
      color: 0xff4444,
      size: 10,
      speed: 2.5,
      lifetime: 0.7,
      gravity: -1.5,
      spread: 0.8,
      yOffset: 0.6,
    });
    // White spark accents
    this.spawnBurst({
      position,
      count: 10,
      color: 0xffffff,
      size: 5,
      speed: 3.0,
      lifetime: 0.5,
      gravity: -0.8,
      spread: 0.4,
      yOffset: 0.8,
    });
  }

  /** Celebratory confetti shower — multi-coloured particles fountain upward then fall. */
  spawnConfetti(position: Vec3): void {
    const confettiColors = [0xff4444, 0xffd700, 0x42a5f5, 0x66bb6a, 0xff69b4, 0xffa726];
    for (const color of confettiColors) {
      this.spawnBurst({
        position,
        count: 12,
        color,
        size: 7,
        speed: 3.5,
        lifetime: 1.2,
        gravity: -2.0,
        spread: 0.6,
        yOffset: 1.0,
      });
    }
  }

  // ── Internal ─────────────────────────────────────────────

  private spawnBurst(opts: {
    position: Vec3;
    count: number;
    color: number;
    size: number;
    speed: number;
    lifetime: number;
    gravity: number;
    spread: number;
    yOffset: number;
  }): void {
    const { count, color, size, speed, lifetime, gravity, spread, yOffset } = opts;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = opts.position.x + (Math.random() - 0.5) * spread;
      positions[i3 + 1] = opts.position.y + yOffset + Math.random() * 0.1;
      positions[i3 + 2] = opts.position.z + (Math.random() - 0.5) * spread;

      velocities[i3]     = (Math.random() - 0.5) * speed;
      velocities[i3 + 1] = Math.random() * speed * 0.8;
      velocities[i3 + 2] = (Math.random() - 0.5) * speed;

      lifetimes[i] = lifetime * (0.5 + Math.random() * 0.5);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: false,
    });

    const mesh = new THREE.Points(geo, mat);
    const id = `vfx_${this.nextId++}`;

    this.effects.set(id, {
      id,
      mesh,
      velocities,
      lifetimes,
      maxLifetime: lifetime,
      elapsed: 0,
      gravity,
    });

    this.scene.add(mesh);
  }

  private advanceParticles(effect: ParticleEffect, delta: number): void {
    const posAttr = effect.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Apply velocity
      positions[i3]     += effect.velocities[i3]     * delta;
      positions[i3 + 1] += effect.velocities[i3 + 1] * delta;
      positions[i3 + 2] += effect.velocities[i3 + 2] * delta;
      // Apply gravity to Y velocity
      effect.velocities[i3 + 1] += effect.gravity * delta;
    }

    posAttr.needsUpdate = true;

    // Fade out over lifetime
    const t = effect.elapsed / effect.maxLifetime;
    (effect.mesh.material as THREE.PointsMaterial).opacity = 0.8 * (1 - t);
  }
}
