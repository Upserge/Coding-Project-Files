import { Injectable } from '@angular/core';
import {
  HiderState,
  HIDER_IDLE_LIMIT_MS,
  HIDER_SPEED_MULTIPLIER,
  Vec3,
} from '../models/player.model';

export interface HiderTickResult {
  /** True if the hider should be converted to a hunter this frame. */
  convertToHunter: boolean;
  /** Updated position after applying movement. */
  newPosition: Vec3;
}

/**
 * HiderService — all hider-specific game logic.
 * Stateless: receives state, returns updated state. GameLoopService owns the tick.
 */
@Injectable({ providedIn: 'root' })
export class HiderService {

  /** Base movement speed (world-units per second). */
  private readonly baseSpeed = 12;

  // ── Per-frame update ───────────────────────────────────────

  tick(hider: HiderState, delta: number, movementInput: Vec3): { state: HiderState; result: HiderTickResult } {
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;
    const deltaMs = delta * 1000;

    // ── Idle timer ─────────────────────────────────────────
    let idleTimerMs = isMoving ? 0 : hider.idleTimerMs + deltaMs;
    const convertToHunter = idleTimerMs >= HIDER_IDLE_LIMIT_MS;
    if (convertToHunter) {
      idleTimerMs = HIDER_IDLE_LIMIT_MS;
    }

    // ── Movement ───────────────────────────────────────────
    const speed = this.getSpeed();
    const newPosition: Vec3 = {
      x: hider.position.x + movementInput.x * speed * delta,
      y: hider.position.y,
      z: hider.position.z + movementInput.z * speed * delta,
    };

    // Track facing direction
    const rotation = isMoving
      ? { ...hider.rotation, y: Math.atan2(movementInput.x, movementInput.z) }
      : hider.rotation;

    const updatedState: HiderState = {
      ...hider,
      idleTimerMs,
      position: newPosition,
      rotation,
    };

    return {
      state: updatedState,
      result: { convertToHunter, newPosition },
    };
  }

  // ── Speed ──────────────────────────────────────────────────

  getSpeed(): number {
    return this.baseSpeed * HIDER_SPEED_MULTIPLIER;
  }

  // ── Queries ────────────────────────────────────────────────

  /** Percentage of idle timer elapsed (0–1) for HUD display. */
  getIdlePercent(hider: HiderState): number {
    return Math.min(hider.idleTimerMs / HIDER_IDLE_LIMIT_MS, 1);
  }
}
