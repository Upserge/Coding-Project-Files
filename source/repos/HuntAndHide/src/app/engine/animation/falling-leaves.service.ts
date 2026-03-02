import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * FallingLeavesService drives a lightweight leaf particle system.
 *
 * Implementation: a single `THREE.Points` mesh (~80 particles, 1 draw call).
 * Leaves drift downward with subtle wind sway and respawn at height
 * when they reach the ground.
 *
 * Call `init(scene)` once, then `tick(delta)` every frame.
 */

const LEAF_COUNT = 80;
const SPREAD = 160;
const SPAWN_HEIGHT_MIN = 10;
const SPAWN_HEIGHT_MAX = 20;

@Injectable({ providedIn: 'root' })
export class FallingLeavesService {

  private points: THREE.Points | null = null;
  private velocities: Float32Array | null = null;
  private elapsed = 0;

  init(scene: THREE.Scene): void {
    const { positions, velocities } = this.createParticleData();
    this.velocities = velocities;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xc1914a,
      size: 5,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: false,
      map: this.createLeafTexture(),
    });

    this.points = new THREE.Points(geo, mat);
    this.points.renderOrder = 8;
    scene.add(this.points);
  }

  tick(delta: number): void {
    if (!this.points || !this.velocities) return;
    this.elapsed += delta;
    this.advanceParticles(delta);
  }

  dispose(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.PointsMaterial).dispose();
    }
    this.points = null;
    this.velocities = null;
  }

  // ── Particle data ─────────────────────────────────────────

  private createParticleData(): { positions: Float32Array; velocities: Float32Array } {
    const positions = new Float32Array(LEAF_COUNT * 3);
    const velocities = new Float32Array(LEAF_COUNT * 3);

    for (let i = 0; i < LEAF_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * SPREAD;
      positions[i3 + 1] = SPAWN_HEIGHT_MIN + Math.random() * (SPAWN_HEIGHT_MAX - SPAWN_HEIGHT_MIN);
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD;

      velocities[i3]     = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = -(0.3 + Math.random() * 0.4);
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    return { positions, velocities };
  }

  // ── Per-frame update ──────────────────────────────────────

  private advanceParticles(delta: number): void {
    const posAttr = this.points!.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const vel = this.velocities!;
    const count = LEAF_COUNT;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3]     += vel[i3] * delta + Math.sin(this.elapsed + i) * 0.015;
      arr[i3 + 1] += vel[i3 + 1] * delta;
      arr[i3 + 2] += vel[i3 + 2] * delta + Math.cos(this.elapsed * 0.8 + i) * 0.015;

      if (arr[i3 + 1] < 0) {
        this.respawnLeaf(arr, vel, i3);
      }
    }

    posAttr.needsUpdate = true;
  }

  private respawnLeaf(arr: Float32Array, vel: Float32Array, i3: number): void {
    arr[i3]     = (Math.random() - 0.5) * SPREAD;
    arr[i3 + 1] = SPAWN_HEIGHT_MIN + Math.random() * (SPAWN_HEIGHT_MAX - SPAWN_HEIGHT_MIN);
    arr[i3 + 2] = (Math.random() - 0.5) * SPREAD;

    vel[i3]     = (Math.random() - 0.5) * 0.5;
    vel[i3 + 1] = -(0.3 + Math.random() * 0.4);
    vel[i3 + 2] = (Math.random() - 0.5) * 0.5;
  }

  // ── Leaf texture ──────────────────────────────────────────

  private createLeafTexture(): THREE.CanvasTexture {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#c1914a';
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size / 3, size / 4, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }
}
