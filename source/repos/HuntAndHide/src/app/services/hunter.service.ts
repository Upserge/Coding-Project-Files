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
  HUNTER_POUNCE_DURATION_S,
  HUNTER_POUNCE_COOLDOWN_S,
  HUNTER_POUNCE_SPEED_MULTIPLIER,
  HUNTER_POUNCE_CATCH_RADIUS,
  HUNTER_POUNCE_STAMINA_COST,
  Vec3,
} from '../models/player.model';

export interface HunterTickResult {
  /** True if the hunter starved this frame. */
  starved: boolean;
  newPosition: Vec3;
  /** True on the frame a pounce begins. */
  pounceTriggered: boolean;
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
    wantsPounce = false,
  ): { state: HunterState; result: HunterTickResult } {
    const hungerRemainingMs = Math.max(0, hunter.hungerRemainingMs - delta * 1000);
    const starved = hungerRemainingMs <= 0;
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;

    const pounce = this.advancePounce(hunter, delta, wantsPounce, isMoving);
    const sprint = pounce.isPouncing
      ? this.idleSprintState(hunter)
      : this.resolveSprintState(hunter, delta, wantsSprint, isMoving);

    const speed = pounce.isPouncing
      ? this.getPounceSpeed()
      : this.getSpeed(sprint.isSprinting);

    const newPosition = this.applyMovement(hunter.position, movementInput, speed, delta);
    const rotation = this.resolveRotation(hunter.rotation, movementInput, isMoving);

    const updatedState: HunterState = {
      ...hunter,
      hungerRemainingMs,
      stamina: pounce.staminaCost > 0
        ? Math.max(0, sprint.stamina - pounce.staminaCost)
        : sprint.stamina,
      isSprinting: sprint.isSprinting,
      exhaustionCooldownS: sprint.cooldownS,
      exhaustedFeedbackS: sprint.feedbackS,
      position: newPosition,
      rotation,
      isAlive: !starved && hunter.isAlive,
      isPouncing: pounce.isPouncing,
      pounceTimeS: pounce.pounceTimeS,
      pounceCooldownS: pounce.pounceCooldownS,
    };

    return {
      state: updatedState,
      result: { starved, newPosition, pounceTriggered: pounce.justTriggered },
    };
  }

  // ── Pounce ───────────────────────────────────────────────────

  private advancePounce(
    hunter: HunterState, delta: number, wantsPounce: boolean, isMoving: boolean,
  ): PounceState {
    if (hunter.isPouncing) return this.continuePounce(hunter.pounceTimeS, delta);
    const cooldownS = Math.max(0, hunter.pounceCooldownS - delta);
    if (wantsPounce && cooldownS <= 0 && isMoving && hunter.stamina >= HUNTER_POUNCE_STAMINA_COST) {
      return this.startPounce();
    }
    return { isPouncing: false, pounceTimeS: 0, pounceCooldownS: cooldownS, justTriggered: false, staminaCost: 0 };
  }

  private startPounce(): PounceState {
    return {
      isPouncing: true,
      pounceTimeS: HUNTER_POUNCE_DURATION_S,
      pounceCooldownS: HUNTER_POUNCE_COOLDOWN_S,
      justTriggered: true,
      staminaCost: HUNTER_POUNCE_STAMINA_COST,
    };
  }

  private continuePounce(pounceTimeS: number, delta: number): PounceState {
    const remaining = pounceTimeS - delta;
    return {
      isPouncing: remaining > 0,
      pounceTimeS: Math.max(0, remaining),
      pounceCooldownS: HUNTER_POUNCE_COOLDOWN_S,
      justTriggered: false,
      staminaCost: 0,
    };
  }

  private idleSprintState(hunter: HunterState): HunterSprintState {
    return { stamina: hunter.stamina, isSprinting: false, cooldownS: hunter.exhaustionCooldownS, feedbackS: hunter.exhaustedFeedbackS };
  }

  getPounceSpeed(): number {
    return this.baseSpeed * HUNTER_POUNCE_SPEED_MULTIPLIER;
  }

  getPounceCooldownPercent(hunter: HunterState): number {
    return Math.min(hunter.pounceCooldownS / HUNTER_POUNCE_COOLDOWN_S, 1);
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
    if (hider.isHiding) return false;
    if (hider.isDashing) return false;
    const radius = hunter.isPouncing ? HUNTER_POUNCE_CATCH_RADIUS : this.catchRadius;
    const dx = hunter.position.x - hider.position.x;
    const dz = hunter.position.z - hider.position.z;
    return Math.sqrt(dx * dx + dz * dz) <= radius;
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

  // ── Private helpers ────────────────────────────────────────

  private applyMovement(position: Vec3, input: Vec3, speed: number, delta: number): Vec3 {
    return {
      x: position.x + input.x * speed * delta,
      y: position.y,
      z: position.z + input.z * speed * delta,
    };
  }

  private resolveRotation(rotation: Vec3, input: Vec3, isMoving: boolean): Vec3 {
    if (!isMoving) return rotation;
    return { ...rotation, y: Math.atan2(input.x, input.z) };
  }
}

interface HunterSprintState {
  stamina: number;
  isSprinting: boolean;
  cooldownS: number;
  feedbackS: number;
}

interface PounceState {
  isPouncing: boolean;
  pounceTimeS: number;
  pounceCooldownS: number;
  justTriggered: boolean;
  staminaCost: number;
}
