import { Injectable } from '@angular/core';
import {
  HiderState,
  HIDER_IDLE_LIMIT_MS,
  HIDER_SPEED_MULTIPLIER,
  HIDER_DASH_DURATION_S,
  HIDER_DASH_COOLDOWN_S,
  HIDER_DASH_SPEED_MULTIPLIER,
  Vec3,
} from '../models/player.model';

export interface HiderTickResult {
  /** True if the hider should be converted to a hunter this frame. */
  convertToHunter: boolean;
  /** Updated position after applying movement. */
  newPosition: Vec3;
  /** True on the frame a dash begins. */
  dashTriggered: boolean;
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

  tick(hider: HiderState, delta: number, movementInput: Vec3, wantsDash = false): { state: HiderState; result: HiderTickResult } {
    const isMoving = movementInput.x !== 0 || movementInput.z !== 0;
    const deltaMs = delta * 1000;

    const idleTimerMs = this.advanceIdleTimer(hider.idleTimerMs, isMoving, deltaMs);
    const convertToHunter = idleTimerMs >= HIDER_IDLE_LIMIT_MS;

    const dash = this.advanceDash(hider, delta, wantsDash, isMoving);
    const speed = dash.isDashing ? this.getDashSpeed() : this.getSpeed();
    const newPosition = this.applyMovement(hider.position, movementInput, speed, delta);
    const rotation = this.resolveRotation(hider.rotation, movementInput, isMoving);

    const updatedState: HiderState = {
      ...hider,
      idleTimerMs: convertToHunter ? HIDER_IDLE_LIMIT_MS : idleTimerMs,
      position: newPosition,
      rotation,
      isDashing: dash.isDashing,
      dashTimeS: dash.dashTimeS,
      dashCooldownS: dash.dashCooldownS,
    };

    return {
      state: updatedState,
      result: { convertToHunter, newPosition, dashTriggered: dash.justTriggered },
    };
  }

  // ── Dash ────────────────────────────────────────────────────

  private advanceDash(
    hider: HiderState, delta: number, wantsDash: boolean, isMoving: boolean,
  ): DashState {
    if (hider.isDashing) return this.continueDash(hider.dashTimeS, delta);
    const cooldownS = Math.max(0, hider.dashCooldownS - delta);
    if (wantsDash && cooldownS <= 0 && isMoving) return this.startDash();
    return { isDashing: false, dashTimeS: 0, dashCooldownS: cooldownS, justTriggered: false };
  }

  private startDash(): DashState {
    return {
      isDashing: true,
      dashTimeS: HIDER_DASH_DURATION_S,
      dashCooldownS: HIDER_DASH_COOLDOWN_S,
      justTriggered: true,
    };
  }

  private continueDash(dashTimeS: number, delta: number): DashState {
    const remaining = dashTimeS - delta;
    return {
      isDashing: remaining > 0,
      dashTimeS: Math.max(0, remaining),
      dashCooldownS: HIDER_DASH_COOLDOWN_S,
      justTriggered: false,
    };
  }

  /** True when the hider is mid-dash and immune to catches. */
  isDashInvulnerable(hider: HiderState): boolean {
    return hider.isDashing;
  }

  getDashCooldownPercent(hider: HiderState): number {
    return Math.min(hider.dashCooldownS / HIDER_DASH_COOLDOWN_S, 1);
  }

  // ── Speed ──────────────────────────────────────────────────

  getSpeed(): number {
    return this.baseSpeed * HIDER_SPEED_MULTIPLIER;
  }

  getDashSpeed(): number {
    return this.baseSpeed * HIDER_DASH_SPEED_MULTIPLIER;
  }

  // ── Queries ────────────────────────────────────────────────

  /** Percentage of idle timer elapsed (0–1) for HUD display. */
  getIdlePercent(hider: HiderState): number {
    return Math.min(hider.idleTimerMs / HIDER_IDLE_LIMIT_MS, 1);
  }

  // ── Private helpers ────────────────────────────────────────

  private advanceIdleTimer(currentMs: number, isMoving: boolean, deltaMs: number): number {
    return isMoving ? 0 : currentMs + deltaMs;
  }

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

interface DashState {
  isDashing: boolean;
  dashTimeS: number;
  dashCooldownS: number;
  justTriggered: boolean;
}
