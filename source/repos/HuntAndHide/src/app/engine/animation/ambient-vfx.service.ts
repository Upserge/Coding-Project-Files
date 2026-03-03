import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { getTerrainHeight } from '../mesh/terrain-heightmap.builder';

/** Configuration for a firefly swarm. */
interface FireflySwarm {
  mesh: THREE.Points;
  basePositions: Float32Array;
  phases: Float32Array;
}

/** Pool size for dynamic firefly point-lights. */
const FIREFLY_LIGHT_COUNT = 5;

/**
 * AmbientVfxService drives subtle environmental animations:
 *   - Fireflies: glowing point-cloud that bobs gently
 *   - Firefly lights: a small pool of PointLights that follow select fireflies
 *
 * Call init() once, then tick() every frame from the render loop.
 */
@Injectable({ providedIn: 'root' })
export class AmbientVfxService {

  private scene!: THREE.Scene;
  private fireflies: FireflySwarm | null = null;
  private fireflyLights: THREE.PointLight[] = [];
  private elapsed = 0;

  init(scene: THREE.Scene): void {
    this.scene = scene;
    this.spawnFireflies();
    this.spawnFireflyLights();
  }

  dispose(): void {
    this.removeFireflies();
    this.removeFireflyLights();
  }

  /** Advance ambient animations. */
  tick(delta: number): void {
    this.elapsed += delta;
    this.tickFireflies();
    this.tickFireflyLights();
  }

  // ── Fireflies ─────────────────────────────────────────────

  private spawnFireflies(): void {
    const count = 500;
    const spread = 160;

    const positions = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    this.initFireflyPositions(positions, basePositions, phases, count, spread);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffee58,
      size: 8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: false,
      map: this.createGlowTexture(),
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.renderOrder = 6;
    this.scene.add(mesh);
    this.fireflies = { mesh, basePositions, phases };
  }

  private initFireflyPositions(
    positions: Float32Array,
    base: Float32Array,
    phases: Float32Array,
    count: number,
    spread: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      const terrainY = getTerrainHeight(x, z);
      base[i3] = x;
      base[i3 + 1] = terrainY + 1.5 + Math.random() * 3.0;
      base[i3 + 2] = z;
      positions[i3] = base[i3];
      positions[i3 + 1] = base[i3 + 1];
      positions[i3 + 2] = base[i3 + 2];
      phases[i] = Math.random() * Math.PI * 2;
    }
  }

  private tickFireflies(): void {
    if (!this.fireflies) return;
    const { mesh, basePositions, phases } = this.fireflies;
    const posAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < phases.length; i++) {
      const i3 = i * 3;
      arr[i3] = basePositions[i3] + Math.sin(this.elapsed * 0.5 + phases[i]) * 0.4;
      arr[i3 + 1] = basePositions[i3 + 1] + Math.sin(this.elapsed * 0.8 + phases[i] * 1.3) * 0.3;
      arr[i3 + 2] = basePositions[i3 + 2] + Math.cos(this.elapsed * 0.6 + phases[i]) * 0.4;
    }
    posAttr.needsUpdate = true;

    const mat = mesh.material as THREE.PointsMaterial;
    mat.opacity = 0.5 + Math.sin(this.elapsed * 1.5) * 0.3;
  }

  private removeFireflies(): void {
    if (!this.fireflies) return;
    this.scene?.remove(this.fireflies.mesh);
    this.fireflies.mesh.geometry.dispose();
    (this.fireflies.mesh.material as THREE.PointsMaterial).dispose();
    this.fireflies = null;
  }

  // ── Firefly lights ────────────────────────────────────────

  private spawnFireflyLights(): void {
    for (let i = 0; i < FIREFLY_LIGHT_COUNT; i++) {
      const light = new THREE.PointLight(0xffee58, 0.3, 8, 2);
      light.castShadow = false;
      this.scene.add(light);
      this.fireflyLights.push(light);
    }
  }

  private tickFireflyLights(): void {
    if (!this.fireflies || this.fireflyLights.length === 0) return;
    const posAttr = this.fireflies.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const stride = Math.floor(this.fireflies.phases.length / this.fireflyLights.length);

    for (let i = 0; i < this.fireflyLights.length; i++) {
      const fi = (i * stride) % this.fireflies.phases.length;
      const i3 = fi * 3;
      this.fireflyLights[i].position.set(arr[i3], arr[i3 + 1], arr[i3 + 2]);
      this.fireflyLights[i].intensity = 0.2 + Math.sin(this.elapsed * 2 + i * 1.5) * 0.15;
    }
  }

  private removeFireflyLights(): void {
    for (const light of this.fireflyLights) {
      this.scene?.remove(light);
      light.dispose();
    }
    this.fireflyLights = [];
  }

  // ── Glow texture ──────────────────────────────────────────

  private createGlowTexture(): THREE.CanvasTexture {
    const size = 128; //64
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.15, 'rgba(255,238,88,0.8)');
    grad.addColorStop(0.5, 'rgba(255,238,88,0.2)');
    grad.addColorStop(1, 'rgba(255,238,88,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }
}
