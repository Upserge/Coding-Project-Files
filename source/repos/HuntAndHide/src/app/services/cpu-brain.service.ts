import { inject, Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { Item, HiderItemType } from '../models/item.model';
import { MapService } from './map.service';

/** Actions the CPU brain can decide on each tick. */
export type CpuAction = 'none' | 'use_item' | 'throw_weapon' | 'interact';

/** Per-bot state tracked by the brain. */
interface BrainState {
  /** Current wander target in world coordinates. */
  wanderTarget: Vec3;
  /** Milliseconds until the bot picks a new wander target. */
  retargetCooldownMs: number;
  /** Milliseconds until the bot may use an item again. */
  itemCooldownMs: number;
}

/** Tuneable constants for CPU behaviour. */
const WANDER_SPEED = 0.6;
const ARRIVAL_THRESHOLD = 2.0;
const RETARGET_MIN_MS = 2_000;
const RETARGET_MAX_MS = 5_000;
const ITEM_COOLDOWN_MS = 6_000;
const ITEM_USE_CHANCE = 0.35;
const ITEM_PICKUP_RADIUS = 3.0;

/**
 * CpuBrainService provides per-frame decision-making for CPU-controlled players.
 * Stateless per call — all mutable state lives in a Map keyed by uid.
 */
@Injectable({ providedIn: 'root' })
export class CpuBrainService {
  private readonly mapService = inject(MapService);
  private readonly brains = new Map<string, BrainState>();

  // ── Lifecycle ──────────────────────────────────────────────

  /** Register a new CPU player. */
  register(uid: string): void {
    this.brains.set(uid, {
      wanderTarget: this.randomWorldPoint(),
      retargetCooldownMs: this.randomRetargetDelay(),
      itemCooldownMs: ITEM_COOLDOWN_MS,
    });
  }

  /** Remove brain state when a CPU player is despawned. */
  unregister(uid: string): void {
    this.brains.delete(uid);
  }

  /** Remove all tracked brain states. */
  clear(): void {
    this.brains.clear();
  }

  // ── Per-frame decision ─────────────────────────────────────

  /**
   * Compute the movement vector and action for one CPU player.
   * Returns a normalised direction vector (magnitude ≤ WANDER_SPEED)
   * and an optional action (item use / weapon throw).
   */
  decide(
    uid: string,
    currentPos: Vec3,
    deltaMs: number,
    nearbyItems: Item[],
    hasActiveItem: boolean,
  ): { movement: Vec3; action: CpuAction } {
    const brain = this.brains.get(uid);
    if (!brain) return { movement: { x: 0, y: 0, z: 0 }, action: 'none' };

    // ── Cooldown ticks ─────────────────────────────────────
    brain.retargetCooldownMs -= deltaMs;
    brain.itemCooldownMs -= deltaMs;

    // ── Retarget check ─────────────────────────────────────
    const dx = brain.wanderTarget.x - currentPos.x;
    const dz = brain.wanderTarget.z - currentPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const needsRetarget = dist < ARRIVAL_THRESHOLD || brain.retargetCooldownMs <= 0;
    if (needsRetarget) {
      brain.wanderTarget = this.randomWorldPoint();
      brain.retargetCooldownMs = this.randomRetargetDelay();
    }

    // ── Movement toward wander target ──────────────────────
    const toDx = brain.wanderTarget.x - currentPos.x;
    const toDz = brain.wanderTarget.z - currentPos.z;
    const toDist = Math.sqrt(toDx * toDx + toDz * toDz);
    const movement: Vec3 = toDist > 0.01
      ? { x: (toDx / toDist) * WANDER_SPEED, y: 0, z: (toDz / toDist) * WANDER_SPEED }
      : { x: 0, y: 0, z: 0 };

    // ── Item / action decision ─────────────────────────────
    const action = this.decideAction(brain, nearbyItems, hasActiveItem);

    return { movement, action };
  }

  // ── Private helpers ────────────────────────────────────────

  private decideAction(
    brain: BrainState,
    nearbyItems: Item[],
    hasActiveItem: boolean,
  ): CpuAction {
    if (brain.itemCooldownMs > 0) return 'none';

    const pickupCandidates = nearbyItems.filter(
      i => !i.isPickedUp && this.isHiderItem(i.type),
    );

    // Use an already-held item
    if (hasActiveItem && Math.random() < ITEM_USE_CHANCE) {
      brain.itemCooldownMs = ITEM_COOLDOWN_MS;
      return 'use_item';
    }

    // Pick up a nearby item
    if (pickupCandidates.length > 0) {
      brain.itemCooldownMs = ITEM_COOLDOWN_MS;
      return 'use_item';
    }

    // Try eating nearby edibles (for hunters)
    const edibleNearby = nearbyItems.some(
      i => !i.isPickedUp && this.isEdible(i.type),
    );
    if (edibleNearby) {
      brain.itemCooldownMs = ITEM_COOLDOWN_MS;
      return 'interact';
    }

    return 'none';
  }

  private isHiderItem(type: string): boolean {
    const hiderItems: ReadonlySet<string> = new Set(['smoke_bomb', 'decoy', 'speed_burst']);
    return hiderItems.has(type);
  }

  private isEdible(type: string): boolean {
    const edibles: ReadonlySet<string> = new Set(['berry', 'mushroom', 'grub']);
    return edibles.has(type);
  }

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
