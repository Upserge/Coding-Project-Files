import { Injectable } from '@angular/core';
import * as THREE from 'three';

const MIN_INTERVAL = 3;
const MAX_INTERVAL = 5;
const BLINK_DURATION = 0.12;

/** Maximum pupil offset (world units) when looking toward movement. */
const PUPIL_MAX_OFFSET = 0.025;
/** How quickly pupils track toward the target direction (higher = faster). */
const PUPIL_SMOOTHING = 8;

interface BlinkState {
  timer: number;
  interval: number;
  blinking: boolean;
  /** Current smoothed pupil offset (X, Z in head-local space). */
  lookX: number;
  lookZ: number;
}

/**
 * Drives periodic eye-blink animation by scaling pupil meshes to zero,
 * and subtle eye tracking by offsetting pupils toward movement direction.
 * Pupils must be named `pupil_L` / `pupil_R` inside the character group.
 */
@Injectable({ providedIn: 'root' })
export class BlinkService {

  private states = new Map<string, BlinkState>();

  /**
   * @param dirX World-space movement direction X (−1..1, 0 when idle)
   * @param dirZ World-space movement direction Z (−1..1, 0 when idle)
   */
  tick(uid: string, group: THREE.Group, delta: number, dirX = 0, dirZ = 0): void {
    const state = this.getState(uid);
    state.timer += delta;
    this.updateBlink(state, group);
    this.updateLookAt(state, group, delta, dirX, dirZ);
  }

  remove(uid: string): void {
    this.states.delete(uid);
  }

  dispose(): void {
    this.states.clear();
  }

  private getState(uid: string): BlinkState {
    let s = this.states.get(uid);
    if (!s) {
      s = { timer: 0, interval: randomInterval(), blinking: false, lookX: 0, lookZ: 0 };
      this.states.set(uid, s);
    }
    return s;
  }

  private updateBlink(state: BlinkState, group: THREE.Group): void {
    if (!state.blinking && state.timer >= state.interval) {
      state.blinking = true;
      state.timer = 0;
      setPupilScale(group, 0.01);
      return;
    }
    if (state.blinking && state.timer >= BLINK_DURATION) {
      state.blinking = false;
      state.timer = 0;
      state.interval = randomInterval();
      setPupilScale(group, 1);
    }
  }

  private updateLookAt(
    state: BlinkState, group: THREE.Group, delta: number, dirX: number, dirZ: number,
  ): void {
    // Smooth toward the target direction
    const targetX = dirX * PUPIL_MAX_OFFSET;
    const targetZ = dirZ * PUPIL_MAX_OFFSET;
    const t = 1 - Math.exp(-PUPIL_SMOOTHING * delta);
    state.lookX += (targetX - state.lookX) * t;
    state.lookZ += (targetZ - state.lookZ) * t;

    setPupilOffset(group, 'pupil_L', state.lookX, state.lookZ);
    setPupilOffset(group, 'pupil_R', state.lookX, state.lookZ);
  }
}

function randomInterval(): number {
  return MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
}

function setPupilScale(group: THREE.Group, s: number): void {
  const left = group.getObjectByName('pupil_L');
  const right = group.getObjectByName('pupil_R');
  if (left) left.scale.setScalar(s);
  if (right) right.scale.setScalar(s);
}

function setPupilOffset(group: THREE.Group, name: string, ox: number, oz: number): void {
  const pupil = group.getObjectByName(name);
  if (!pupil) return;
  // Store base position on first access
  if (pupil.userData['basePX'] === undefined) {
    pupil.userData['basePX'] = pupil.position.x;
    pupil.userData['basePZ'] = pupil.position.z;
  }
  pupil.position.x = (pupil.userData['basePX'] as number) + ox;
  pupil.position.z = (pupil.userData['basePZ'] as number) + oz;
}
