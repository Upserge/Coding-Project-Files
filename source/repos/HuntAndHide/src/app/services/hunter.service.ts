import { Injectable } from '@angular/core';
import {
  HunterState,
  HiderState,
  HUNTER_EXHAUSTED_FEEDBACK_S,
  HUNTER_EXHAUSTION_COOLDOWN_S,
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

  private readonly baseSpeed = 11;
  private readonly catchRadius = 1.0;

  // ── Per-frame update ───────────────────────────────────────

  tick(
    hunter: HunterState,
    delta: number,
    movementInput: Vec3,
    wantsSprint: boolean,
  ): { state: HunterState; result: HunterTickResult } {
    const hungerRemainingMs = Math.max(0, hunter.hungerRemainingMs - delta * 1000);
    const starved = hungerRemainingMs <= 0;
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;
    const sprint = this.resolveSprintState(hunter, delta, wantsSprint, isMoving);
    const speed = this.getSpeed(sprint.isSprinting);
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
      stamina: sprint.stamina,
      isSprinting: sprint.isSprinting,
      exhaustionCooldownS: sprint.cooldownS,
      exhaustedFeedbackS: sprint.feedbackS,
      position: newPosition,
      rotation,
      isAlive: !starved && hunter.isAlive,
    };

    return {
      state: updatedState,
      result: { starved, newPosition },
    };
  }

  private resolveSprintState(
    hunter: HunterState,
    delta: number,
    wantsSprint: boolean,
    isMoving: boolean,
  ): HunterSprintState {
    const cooldownS = Math.max(0, hunter.exhaustionCooldownS - delta);
    const feedbackS = Math.max(0, hunter.exhaustedFeedbackS - delta);
    if (cooldownS > 0) return this.recoverSprintState(hunter.stamina, cooldownS, feedbackS, delta);
    if (!wantsSprint || !isMoving) return this.recoverSprintState(hunter.stamina, cooldownS, feedbackS, delta);
    return this.drainSprintState(hunter.stamina, delta, feedbackS);
  }

  private recoverSprintState(
    stamina: number,
    cooldownS: number,
    feedbackS: number,
    delta: number,
  ): HunterSprintState {
    return {
      stamina: Math.min(HUNTER_STAMINA_MAX, stamina + HUNTER_STAMINA_REGEN_PER_S * delta),
      isSprinting: false,
      cooldownS,
      feedbackS,
    };
  }

  private drainSprintState(stamina: number, delta: number, feedbackS: number): HunterSprintState {
    const nextStamina = Math.max(0, stamina - HUNTER_STAMINA_DRAIN_PER_S * delta);
    if (nextStamina > 0) return { stamina: nextStamina, isSprinting: true, cooldownS: 0, feedbackS };
    return {
      stamina: 0,
      isSprinting: false,
      cooldownS: HUNTER_EXHAUSTION_COOLDOWN_S,
      feedbackS: HUNTER_EXHAUSTED_FEEDBACK_S,
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

  isExhausted(hunter: HunterState): boolean {
    return hunter.exhaustionCooldownS > 0;
  }
}

interface HunterSprintState {
  stamina: number;
  isSprinting: boolean;
  cooldownS: number;
  feedbackS: number;
}
