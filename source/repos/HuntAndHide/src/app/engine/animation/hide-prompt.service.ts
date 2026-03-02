import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Vec3 } from '../../models/player.model';
import { getTerrainHeight } from '../mesh/terrain-heightmap.builder';

/**
 * HidePromptService renders a world-space "[F] Hide" sprite
 * above the nearest unoccupied hiding spot when the local hider
 * is within interaction range.
 *
 * A single THREE.Sprite with a CanvasTexture — one draw call,
 * always faces the camera (billboard). Hidden when no spot is nearby.
 *
 * Call `init(scene)` once, `update(spotPosition)` every frame, `dispose()` on teardown.
 */

const PROMPT_Y_OFFSET = 3.2;
const SPRITE_SCALE = 1.6;
const PULSE_SPEED = 3.0;
const PULSE_MIN = 0.6;

@Injectable({ providedIn: 'root' })
export class HidePromptService {

  private sprite: THREE.Sprite | null = null;
  private material: THREE.SpriteMaterial | null = null;
  private elapsed = 0;

  init(scene: THREE.Scene): void {
    const texture = this.createPromptTexture();
    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(SPRITE_SCALE, SPRITE_SCALE * 0.5, 1);
    this.sprite.renderOrder = 100;
    this.sprite.visible = false;
    scene.add(this.sprite);
  }

  /** Show/hide the prompt and position it above the hiding spot. */
  update(spotPosition: Vec3 | null, delta: number): void {
    if (!this.sprite || !this.material) return;

    if (!spotPosition) {
      this.sprite.visible = false;
      return;
    }

    this.sprite.visible = true;
    const terrainY = getTerrainHeight(spotPosition.x, spotPosition.z);
    this.sprite.position.set(
      spotPosition.x,
      spotPosition.y + terrainY + PROMPT_Y_OFFSET,
      spotPosition.z,
    );

    // Gentle pulse
    this.elapsed += delta;
    const pulse = PULSE_MIN + (1 - PULSE_MIN) * (0.5 + 0.5 * Math.sin(this.elapsed * PULSE_SPEED));
    this.material.opacity = pulse;
  }

  dispose(): void {
    if (this.sprite) {
      this.material?.map?.dispose();
      this.material?.dispose();
    }
    this.sprite = null;
    this.material = null;
  }

  // ── Canvas texture ────────────────────────────────────────

  private createPromptTexture(): THREE.CanvasTexture {
    const width = 256;
    const height = 128;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, width, height);

    // Rounded background
    const pad = 8;
    const radius = 16;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, radius);

    // "[F]" key badge
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('[F]', width * 0.32, height * 0.5);

    // "Hide" label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('Hide', width * 0.68, height * 0.5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }
}
