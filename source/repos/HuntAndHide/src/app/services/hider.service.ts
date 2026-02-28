import { Injectable } from '@angular/core';
import {
  HiderState,
  HIDER_IDLE_LIMIT_MS,
  HIDER_SPEED_MULTIPLIER,
  Vec3,
} from '../models/player.model';
import { HiderItemType } from '../models/item.model';

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

  /**
   * Process one tick for a hider.
   * @param hider  Current hider state
   * @param delta  Seconds since last frame
   * @param movementInput  Normalized movement vector from InputService
   * @returns Updated idle timer, position, and whether to convert
   */
  tick(hider: HiderState, delta: number, movementInput: Vec3): { state: HiderState; result: HiderTickResult } {
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;

    // ── Idle timer ─────────────────────────────────────────
    let idleTimerMs = isMoving ? 0 : hider.idleTimerMs + delta * 1000;
    const convertToHunter = idleTimerMs >= HIDER_IDLE_LIMIT_MS;

    // If converting, cap the timer (don't let it keep climbing)
    if (convertToHunter) {
      idleTimerMs = HIDER_IDLE_LIMIT_MS;
    }

    // ── Movement ───────────────────────────────────────────
    const speed = this.getSpeed(hider);
    const newPosition: Vec3 = {
      x: hider.position.x + movementInput.x * speed * delta,
      y: hider.position.y,
      z: hider.position.z + movementInput.z * speed * delta,
    };

    const updatedState: HiderState = {
      ...hider,
      idleTimerMs,
      position: newPosition,
    };

    return {
      state: updatedState,
      result: { convertToHunter, newPosition },
    };
  }

  // ── Speed ──────────────────────────────────────────────────

  getSpeed(hider: HiderState): number {
    let speed = this.baseSpeed * HIDER_SPEED_MULTIPLIER;

    // Speed burst item doubles speed
    if (hider.activeItem === 'speed_burst') {
      speed *= 2;
    }

    return speed;
  }

  // ── Item usage ─────────────────────────────────────────────

  /** Activate an item — returns the updated hider state. */
  useItem(hider: HiderState, item: HiderItemType): HiderState {
    return {
      ...hider,
      activeItem: item,
    };
  }

  /** Clear active item (called when effect duration expires). */
  clearItem(hider: HiderState): HiderState {
    return {
      ...hider,
      activeItem: null,
    };
  }

  // ── Queries ────────────────────────────────────────────────

  /** Percentage of idle timer elapsed (0–1) for HUD display. */
  getIdlePercent(hider: HiderState): number {
    return Math.min(hider.idleTimerMs / HIDER_IDLE_LIMIT_MS, 1);
  }
}
