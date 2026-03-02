import { Injectable } from '@angular/core';
import {
  HunterState,
  HiderState,
  HUNTER_HUNGER_MS,
  HUNTER_SPEED_MULTIPLIER,
  HUNTER_STAMINA_MAX,
  HUNTER_STAMINA_DRAIN_PER_S,
  HUNTER_STAMINA_REGEN_PER_S,
  HUNTER_SPRINT_MULTIPLIER,
  Vec3,
} from '../models/player.model';

export interface HunterTickResult {
  /** True if the hunter starved this frame. */
  starved: boolean;
  newPosition: Vec3;
}

/**
 * HunterService — all hunter-specific game logic.
 * Stateless: receives state, returns updated state.
 */
@Injectable({ providedIn: 'root' })
export class HunterService {

  private readonly baseSpeed = 10;
  private readonly catchRadius = 1.5;

  // ── Per-frame update ───────────────────────────────────────

  tick(
    hunter: HunterState,
    delta: number,
    movementInput: Vec3,
    wantsSprint: boolean,
  ): { state: HunterState; result: HunterTickResult } {

    // ── Hunger ─────────────────────────────────────────────
    const hungerRemainingMs = Math.max(0, hunter.hungerRemainingMs - delta * 1000);
    const starved = hungerRemainingMs <= 0;

    // ── Stamina ────────────────────────────────────────────
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;
    let stamina = hunter.stamina;
    const isSprinting = wantsSprint && isMoving && stamina > 0;

    if (isSprinting) {
      stamina = Math.max(0, stamina - HUNTER_STAMINA_DRAIN_PER_S * delta);
    } else {
      stamina = Math.min(HUNTER_STAMINA_MAX, stamina + HUNTER_STAMINA_REGEN_PER_S * delta);
    }

    // ── Movement ───────────────────────────────────────────
    const speed = this.getSpeed(isSprinting);
    const newPosition: Vec3 = {
      x: hunter.position.x + movementInput.x * speed * delta,
      y: hunter.position.y,
      z: hunter.position.z + movementInput.z * speed * delta,
    };

    // Track facing direction
    const rotation = isMoving
      ? { ...hunter.rotation, y: Math.atan2(movementInput.x, movementInput.z) }
      : hunter.rotation;

    const updatedState: HunterState = {
      ...hunter,
      hungerRemainingMs,
      stamina,
      isSprinting,
      position: newPosition,
      rotation,
      isAlive: !starved && hunter.isAlive,
    };

    return {
      state: updatedState,
      result: { starved, newPosition },
    };
  }

  // ── Speed ──────────────────────────────────────────────────

  getSpeed(isSprinting = false): number {
    const base = this.baseSpeed * HUNTER_SPEED_MULTIPLIER;
    return isSprinting ? base * HUNTER_SPRINT_MULTIPLIER : base;
  }

  // ── Catching ───────────────────────────────────────────────

  /** Check if a hunter is close enough to catch a hider. */
  canCatch(hunter: HunterState, hider: HiderState): boolean {
    if (hider.isHiding) return false; // hidden hiders are immune
    const dx = hunter.position.x - hider.position.x;
    const dz = hunter.position.z - hider.position.z;
    return Math.sqrt(dx * dx + dz * dz) <= this.catchRadius;
  }

  /**
   * Process a catch — returns updated hunter (fed) and the
   * hider converted to a hunter shell.
   */
  performCatch(hunter: HunterState, _hider: HiderState): HunterState {
    const hungerRestored = HUNTER_HUNGER_MS * 0.4;
    return {
      ...hunter,
      hungerRemainingMs: Math.min(HUNTER_HUNGER_MS, hunter.hungerRemainingMs + hungerRestored),
      score: hunter.score + 100,
    };
  }

  // ── Queries ────────────────────────────────────────────────

  /** Hunger as percentage remaining (1 = full, 0 = starved). */
  getHungerPercent(hunter: HunterState): number {
    return hunter.hungerRemainingMs / HUNTER_HUNGER_MS;
  }

  /** Stamina as percentage remaining (1 = full, 0 = empty). */
  getStaminaPercent(hunter: HunterState): number {
    return hunter.stamina / HUNTER_STAMINA_MAX;
  }
}
