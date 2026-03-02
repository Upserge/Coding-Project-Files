import { inject, Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { MapService } from './map.service';

/** Per-bot state tracked by the brain. */
interface BrainState {
  /** Current wander target in world coordinates. */
  wanderTarget: Vec3;
  /** Milliseconds until the bot picks a new wander target. */
  retargetCooldownMs: number;
}

/** Tuneable constants for CPU behaviour. */
const WANDER_SPEED = 0.6;
const ARRIVAL_THRESHOLD = 2.0;
const RETARGET_MIN_MS = 2_000;
const RETARGET_MAX_MS = 5_000;
/** Probability per retarget that a hunter CPU will sprint toward the next target. */
const SPRINT_CHANCE = 0.35;
/** Probability per retarget that a hider CPU will try to hide if near a spot. */
const HIDE_CHANCE = 0.30;

/**
 * CpuBrainService provides per-frame decision-making for CPU-controlled players.
 * Stateless per call — all mutable state lives in a Map keyed by uid.
 */
@Injectable({ providedIn: 'root' })
export class CpuBrainService {
  private readonly mapService = inject(MapService);
  private readonly brains = new Map<string, BrainState>();
  /** Tracks whether each CPU hunter wants to sprint this cycle. */
  private readonly sprintFlags = new Map<string, boolean>();
  /** Tracks whether each CPU hider wants to hide this cycle. */
  private readonly hideFlags = new Map<string, boolean>();

  // ── Lifecycle ──────────────────────────────────────────────

  /** Register a new CPU player. */
  register(uid: string): void {
    this.brains.set(uid, {
      wanderTarget: this.randomWorldPoint(),
      retargetCooldownMs: this.randomRetargetDelay(),
    });
    this.sprintFlags.set(uid, false);
    this.hideFlags.set(uid, false);
  }

  /** Remove brain state when a CPU player is despawned. */
  unregister(uid: string): void {
    this.brains.delete(uid);
    this.sprintFlags.delete(uid);
    this.hideFlags.delete(uid);
  }

  /** Remove all tracked brain states. */
  clear(): void {
    this.brains.clear();
    this.sprintFlags.clear();
    this.hideFlags.clear();
  }

  // ── Per-frame decision ─────────────────────────────────────

  /**
   * Compute the movement vector for one CPU player.
   * Returns a normalised direction vector (magnitude ≤ WANDER_SPEED)
   * and whether the CPU hunter wants to sprint.
   */
  decide(
    uid: string,
    currentPos: Vec3,
    deltaMs: number,
  ): { movement: Vec3; wantsSprint: boolean; wantsHide: boolean } {
    const brain = this.brains.get(uid);
    if (!brain) return { movement: { x: 0, y: 0, z: 0 }, wantsSprint: false, wantsHide: false };

    // ── Cooldown ticks ─────────────────────────────────────
    brain.retargetCooldownMs -= deltaMs;

    // ── Retarget check ─────────────────────────────────────
    const dx = brain.wanderTarget.x - currentPos.x;
    const dz = brain.wanderTarget.z - currentPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const needsRetarget = dist < ARRIVAL_THRESHOLD || brain.retargetCooldownMs <= 0;
    if (needsRetarget) {
      brain.wanderTarget = this.randomWorldPoint();
      brain.retargetCooldownMs = this.randomRetargetDelay();
      this.sprintFlags.set(uid, Math.random() < SPRINT_CHANCE);
      this.hideFlags.set(uid, Math.random() < HIDE_CHANCE);
    }

    // ── Movement toward wander target ──────────────────────
    const toDx = brain.wanderTarget.x - currentPos.x;
    const toDz = brain.wanderTarget.z - currentPos.z;
    const toDist = Math.sqrt(toDx * toDx + toDz * toDz);
    const movement: Vec3 = toDist > 0.01
      ? { x: (toDx / toDist) * WANDER_SPEED, y: 0, z: (toDz / toDist) * WANDER_SPEED }
      : { x: 0, y: 0, z: 0 };

    return { movement, wantsSprint: this.sprintFlags.get(uid) ?? false, wantsHide: this.hideFlags.get(uid) ?? false };
  }

  // ── Private helpers ────────────────────────────────────────

  private randomWorldPoint(): Vec3 {
    const map = this.mapService.getMap('jungle');
    const margin = 10;
    const halfW = map.width / 2 - margin;
    const halfD = map.depth / 2 - margin;
    return {
      x: (Math.random() * 2 - 1) * halfW,
      y: 0,
      z: (Math.random() * 2 - 1) * halfD,
    };
  }

  private randomRetargetDelay(): number {
    return RETARGET_MIN_MS + Math.random() * (RETARGET_MAX_MS - RETARGET_MIN_MS);
  }
}
