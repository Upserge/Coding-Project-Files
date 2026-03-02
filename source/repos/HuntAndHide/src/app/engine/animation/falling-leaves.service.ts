import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * FallingLeavesService renders falling leaves across the jungle map.
 *
 * Uses a single THREE.InstancedMesh of small PlaneGeometry quads so
 * each leaf can tumble and rotate independently — one draw call, but
 * the leaves look like real 3D objects in the world rather than
 * screen-aligned dots.
 *
 * Spread covers the full map so leaves exist everywhere, not just
 * around the camera viewport.
 *
 * Call `init(scene)` once, then `tick(delta)` every frame.
 */

const LEAF_COUNT = 350;
const SPREAD = 160;
const SPAWN_HEIGHT_MIN = 3;
const SPAWN_HEIGHT_MAX = 18;
const LEAF_SIZE = 0.55;

/** Per-leaf simulation state. */
interface LeafState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** Tumble angles (radians). */
  rx: number; ry: number; rz: number;
  /** Tumble speeds (radians/s). */
  vrx: number; vry: number; vrz: number;
  /** Unique phase offset for wind sway. */
  phase: number;
}

@Injectable({ providedIn: 'root' })
export class FallingLeavesService {

  private mesh: THREE.InstancedMesh | null = null;
  private material: THREE.MeshBasicMaterial | null = null;
  private leaves: LeafState[] = [];
  private elapsed = 0;
  private dummy = new THREE.Object3D();

  init(scene: THREE.Scene): void {
    const geo = new THREE.PlaneGeometry(LEAF_SIZE, LEAF_SIZE * 0.6);
    this.material = new THREE.MeshBasicMaterial({
      map: this.createLeafTexture(),
      transparent: true,
      alphaTest: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    this.mesh = new THREE.InstancedMesh(geo, this.material, LEAF_COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.renderOrder = 8;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    scene.add(this.mesh);

    this.leaves = this.createLeafStates();
    this.assignInstanceColors();
    this.applyTransforms();
  }

  tick(delta: number): void {
    if (!this.mesh) return;
    this.elapsed += delta;
    this.advanceLeaves(delta);
    this.applyTransforms();
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.map?.dispose();
      this.material?.dispose();
    }
    this.mesh = null;
    this.material = null;
    this.leaves = [];
  }

  // ── Leaf state creation ───────────────────────────────────

  private createLeafStates(): LeafState[] {
    const states: LeafState[] = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      states.push(this.spawnLeaf(i));
    }
    return states;
  }

  /** Tint each instance with a slightly different colour for natural variety. */
  private assignInstanceColors(): void {
    const palette = [
      new THREE.Color(0xc1914a), // warm brown
      new THREE.Color(0xb87a3d), // dark gold
      new THREE.Color(0xd4a55a), // light gold
      new THREE.Color(0xa0692e), // deep brown
      new THREE.Color(0x8b9e52), // olive green (fresh leaf)
    ];
    const color = new THREE.Color();
    for (let i = 0; i < LEAF_COUNT; i++) {
      color.copy(palette[i % palette.length]);
      // Slight random brightness variation
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      this.mesh!.setColorAt(i, color);
    }
    this.mesh!.instanceColor!.needsUpdate = true;
  }

  private spawnLeaf(_index: number): LeafState {
    return {
      x: (Math.random() - 0.5) * SPREAD,
      y: SPAWN_HEIGHT_MIN + Math.random() * (SPAWN_HEIGHT_MAX - SPAWN_HEIGHT_MIN),
      z: (Math.random() - 0.5) * SPREAD,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.3 + Math.random() * 0.4),
      vz: (Math.random() - 0.5) * 0.3,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 1.5,
      vry: (Math.random() - 0.5) * 1.0,
      vrz: (Math.random() - 0.5) * 2.0,
      phase: Math.random() * Math.PI * 2,
    };
  }

  // ── Per-frame simulation ──────────────────────────────────

  private advanceLeaves(delta: number): void {
    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];

      // Wind sway
      const windX = Math.sin(this.elapsed * 0.7 + leaf.phase) * 0.3;
      const windZ = Math.cos(this.elapsed * 0.5 + leaf.phase * 1.3) * 0.2;

      leaf.x += (leaf.vx + windX) * delta;
      leaf.y += leaf.vy * delta;
      leaf.z += (leaf.vz + windZ) * delta;

      // Tumble
      leaf.rx += leaf.vrx * delta;
      leaf.ry += leaf.vry * delta;
      leaf.rz += leaf.vrz * delta;

      // Respawn when reaching the ground
      if (leaf.y < 0) {
        this.leaves[i] = this.spawnLeaf(i);
      }
    }
  }

  private applyTransforms(): void {
    const d = this.dummy;
    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];
      d.position.set(leaf.x, leaf.y, leaf.z);
      d.rotation.set(leaf.rx, leaf.ry, leaf.rz);
      d.updateMatrix();
      this.mesh!.setMatrixAt(i, d.matrix);
    }
    this.mesh!.instanceMatrix.needsUpdate = true;
  }

  // ── Leaf texture ──────────────────────────────────────────

  private createLeafTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Leaf body — pointed oval
    const cx = size / 2;
    const cy = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 8);

    // Gradient for natural colour variation
    const grad = ctx.createLinearGradient(-size / 3, 0, size / 3, 0);
    grad.addColorStop(0, '#b87a3d');
    grad.addColorStop(0.5, '#c1914a');
    grad.addColorStop(1, '#a0692e');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.38, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Centre vein
    ctx.strokeStyle = 'rgba(80, 50, 20, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, 0);
    ctx.lineTo(size * 0.3, 0);
    ctx.stroke();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }
}
