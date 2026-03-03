import { Injectable } from '@angular/core';

/** Offset vector returned by the shake service each frame. */
export interface ShakeOffset {
  x: number;
  y: number;
  z: number;
}

/**
 * ScreenShakeService produces a decaying sinusoidal camera offset.
 *
 * Call `trigger(intensity, duration)` to start a shake.
 * Call `tick(delta)` every frame, then read the offset via `getOffset()`.
 * The offset decays to zero over the given duration.
 */
@Injectable({ providedIn: 'root' })
export class ScreenShakeService {

  private intensity = 0;
  private duration = 0;
  private elapsed = 0;
  private active = false;

  private readonly offset: ShakeOffset = { x: 0, y: 0, z: 0 };

  /** Start a new shake (stronger shakes override weaker ones). */
  trigger(intensity: number, duration = 0.35): void {
    if (intensity > this.intensity || !this.active) {
      this.intensity = intensity;
      this.duration = duration;
      this.elapsed = 0;
      this.active = true;
    }
  }

  /** Advance the shake timer. Call once per frame before reading getOffset(). */
  tick(delta: number): void {
    if (!this.active) return;

    this.elapsed += delta;
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.offset.x = 0;
      this.offset.y = 0;
      this.offset.z = 0;
      return;
    }

    // Exponential decay envelope
    const t = this.elapsed / this.duration;
    const decay = 1 - t * t; // quadratic falloff — punchy start, smooth end
    const amp = this.intensity * decay;

    // High-frequency sinusoidal jitter (different freq per axis to avoid patterns)
    const phase = this.elapsed * 40;
    this.offset.x = Math.sin(phase * 1.0) * amp;
    this.offset.y = Math.sin(phase * 1.3) * amp * 0.6; // less vertical shake
    this.offset.z = Math.cos(phase * 0.9) * amp;
  }

  /** Current frame's camera offset. Zero when no shake is active. */
  getOffset(): Readonly<ShakeOffset> {
    return this.offset;
  }
}
