import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Vec3 } from '../../models/player.model';
import { getTerrainHeight } from '../mesh/terrain-heightmap.builder';

/** A single floating score text rising and fading. */
interface FloatingText {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  elapsed: number;
  lifetime: number;
  startY: number;
  riseSpeed: number;
}

const FLOATER_LIFETIME = 1.2;
const FLOATER_RISE_SPEED = 2.5;
const FLOATER_SCALE = 1.4;

/**
 * ScoreFloaterService renders world-space "+100" / "+40% Hunger"
 * floating text sprites that rise and fade after a catch event.
 *
 * Uses a small pool of CanvasTexture sprites on layer 1 (UI overlay).
 * Call `init(scene)` once, `spawn(position, text)` on events, `tick(delta)` every frame.
 */
@Injectable({ providedIn: 'root' })
export class ScoreFloaterService {

  private scene!: THREE.Scene;
  private floaters: FloatingText[] = [];
  private textureCache = new Map<string, THREE.CanvasTexture>();

  init(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /** Spawn a floating text at the given world position. */
  spawn(position: Vec3, text: string, color = '#e9c46a'): void {
    if (!this.scene) return;

    const texture = this.getOrCreateTexture(text, color);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    const terrainY = getTerrainHeight(position.x, position.z);
    const startY = position.y + terrainY + 2.5;

    sprite.position.set(position.x, startY, position.z);
    sprite.scale.set(FLOATER_SCALE, FLOATER_SCALE * 0.45, 1);
    sprite.renderOrder = 101;
    sprite.layers.set(1);
    this.scene.add(sprite);

    this.floaters.push({
      sprite,
      material,
      elapsed: 0,
      lifetime: FLOATER_LIFETIME,
      startY,
      riseSpeed: FLOATER_RISE_SPEED,
    });
  }

  /** Advance all active floaters. Call once per frame. */
  tick(delta: number): void {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.elapsed += delta;

      if (f.elapsed >= f.lifetime) {
        this.scene.remove(f.sprite);
        f.material.dispose();
        this.floaters.splice(i, 1);
        continue;
      }

      const t = f.elapsed / f.lifetime;
      f.sprite.position.y = f.startY + f.riseSpeed * f.elapsed;
      f.material.opacity = 1 - t * t; // quadratic fade-out

      // Slight scale-up at start for pop-in feel
      const popScale = t < 0.15 ? 0.8 + (t / 0.15) * 0.2 : 1;
      f.sprite.scale.set(FLOATER_SCALE * popScale, FLOATER_SCALE * 0.45 * popScale, 1);
    }
  }

  dispose(): void {
    for (const f of this.floaters) {
      this.scene?.remove(f.sprite);
      f.material.dispose();
    }
    this.floaters = [];
    for (const tex of this.textureCache.values()) {
      tex.dispose();
    }
    this.textureCache.clear();
  }

  // ── Canvas texture creation ──────────────────────────────

  private getOrCreateTexture(text: string, color: string): THREE.CanvasTexture {
    const key = `${text}__${color}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;

    const texture = this.createTextTexture(text, color);
    this.textureCache.set(key, texture);
    return texture;
  }

  private createTextTexture(text: string, color: string): THREE.CanvasTexture {
    const width = 256;
    const height = 96;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, width, height);

    // Shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Text
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
