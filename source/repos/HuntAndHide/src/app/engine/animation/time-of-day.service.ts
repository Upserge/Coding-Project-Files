import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * TimeOfDayService slowly shifts lighting colour, intensity, and fog
 * over the duration of a match to create evolving atmosphere.
 *
 * A full cycle takes ~8 minutes (480 s):
 *   0 %  — warm midday (gold sun, bright ambient, light fog)
 *   50 % — cool dusk  (orange sun, dimmer ambient, denser fog)
 *   100% — loops back to midday
 *
 * Zero extra draw calls — only uniform/property updates.
 *
 * Call `init(scene, sun, ambient)` once, then `tick(delta)` per frame.
 */

const CYCLE_DURATION = 480; // seconds for a full cycle

/** Keyframe stops expressed as 0..1 position within the cycle. */
interface ColorKey { t: number; color: THREE.Color; intensity: number }

const SUN_KEYS: ColorKey[] = [
  { t: 0.0,  color: new THREE.Color(0xfff8e1), intensity: 0.9 },
  { t: 0.25, color: new THREE.Color(0xfff0c0), intensity: 0.85 },
  { t: 0.5,  color: new THREE.Color(0xffb347), intensity: 0.55 },
  { t: 0.75, color: new THREE.Color(0xfff0c0), intensity: 0.85 },
  { t: 1.0,  color: new THREE.Color(0xfff8e1), intensity: 0.9 },
];

const AMBIENT_KEYS: ColorKey[] = [
  { t: 0.0,  color: new THREE.Color(0xffe0b2), intensity: 0.5 },
  { t: 0.25, color: new THREE.Color(0xffd8a0), intensity: 0.45 },
  { t: 0.5,  color: new THREE.Color(0xb0a0d0), intensity: 0.35 },
  { t: 0.75, color: new THREE.Color(0xffd8a0), intensity: 0.45 },
  { t: 1.0,  color: new THREE.Color(0xffe0b2), intensity: 0.5 },
];

const FOG_KEYS: { t: number; color: THREE.Color; density: number }[] = [
  { t: 0.0,  color: new THREE.Color(0x87ceaa), density: 0.003 },
  { t: 0.5,  color: new THREE.Color(0x6a8e9a), density: 0.005 },
  { t: 1.0,  color: new THREE.Color(0x87ceaa), density: 0.003 },
];

/** Dedicated sky background gradient — richer palette than fog. */
const SKY_KEYS: ColorKey[] = [
  { t: 0.0,  color: new THREE.Color(0xa8d8b8), intensity: 1.0 },
  { t: 0.2,  color: new THREE.Color(0xc5e8c0), intensity: 1.0 },
  { t: 0.4,  color: new THREE.Color(0xe8c8a0), intensity: 1.0 },
  { t: 0.5,  color: new THREE.Color(0xd4926a), intensity: 1.0 },
  { t: 0.6,  color: new THREE.Color(0x8a7eaa), intensity: 1.0 },
  { t: 0.75, color: new THREE.Color(0x98b0c0), intensity: 1.0 },
  { t: 1.0,  color: new THREE.Color(0xa8d8b8), intensity: 1.0 },
];

@Injectable({ providedIn: 'root' })
export class TimeOfDayService {

  private scene: THREE.Scene | null = null;
  private sun: THREE.DirectionalLight | null = null;
  private ambient: THREE.AmbientLight | null = null;
  private elapsed = 0;

  init(scene: THREE.Scene, sun: THREE.DirectionalLight, ambient: THREE.AmbientLight): void {
    this.scene = scene;
    this.sun = sun;
    this.ambient = ambient;
    this.elapsed = 0;
  }

  tick(delta: number): void {
    if (!this.scene || !this.sun || !this.ambient) return;
    this.elapsed += delta;

    const t = (this.elapsed % CYCLE_DURATION) / CYCLE_DURATION;

    this.lerpLight(this.sun, SUN_KEYS, t);
    this.lerpLight(this.ambient, AMBIENT_KEYS, t);
    this.lerpFog(t);
    this.lerpBackground(t);
  }

  dispose(): void {
    this.scene = null;
    this.sun = null;
    this.ambient = null;
  }

  // ── Interpolation helpers ─────────────────────────────────

  private lerpLight(light: THREE.Light, keys: ColorKey[], t: number): void {
    const { a, b, f } = this.findSegment(keys, t);
    light.color.copy(a.color).lerp(b.color, f);
    light.intensity = a.intensity + (b.intensity - a.intensity) * f;
  }

  private lerpFog(t: number): void {
    const fog = this.scene!.fog as THREE.FogExp2 | null;
    if (!fog) return;
    const { a, b, f } = this.findSegment(FOG_KEYS, t);
    fog.color.copy(a.color).lerp(b.color, f);
    fog.density = a.density + (b.density - a.density) * f;
  }

  private lerpBackground(t: number): void {
    const { a, b, f } = this.findSegment(SKY_KEYS, t);
    const bg = this.scene!.background;
    if (bg instanceof THREE.Color) {
      bg.copy(a.color).lerp(b.color, f);
    }
  }

  private findSegment<T extends { t: number }>(keys: T[], t: number): { a: T; b: T; f: number } {
    for (let i = 0; i < keys.length - 1; i++) {
      if (t >= keys[i].t && t <= keys[i + 1].t) {
        const span = keys[i + 1].t - keys[i].t;
        const f = span > 0 ? (t - keys[i].t) / span : 0;
        return { a: keys[i], b: keys[i + 1], f };
      }
    }
    return { a: keys[0], b: keys[1], f: 0 };
  }
}
