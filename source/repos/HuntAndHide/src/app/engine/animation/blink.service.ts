import { Injectable } from '@angular/core';
import * as THREE from 'three';

const MIN_INTERVAL = 3;
const MAX_INTERVAL = 5;
const BLINK_DURATION = 0.12;

interface BlinkState {
  timer: number;
  interval: number;
  blinking: boolean;
}

/**
 * Drives periodic eye-blink animation by scaling pupil meshes to zero.
 * Pupils must be named `pupil_L` / `pupil_R` inside the character group.
 */
@Injectable({ providedIn: 'root' })
export class BlinkService {

  private states = new Map<string, BlinkState>();

  tick(uid: string, group: THREE.Group, delta: number): void {
    const state = this.getState(uid);
    state.timer += delta;
    this.updateBlink(state, group);
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
      s = { timer: 0, interval: randomInterval(), blinking: false };
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
