import { Injectable } from '@angular/core';
import {
  HiderState,
  HIDER_IDLE_LIMIT_MS,
  HIDER_SPEED_MULTIPLIER,
  ITEM_EFFECT_DURATION_MS,
  MAX_INVENTORY_SLOTS,
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
    const deltaMs = delta * 1000;

    // ── Idle timer ─────────────────────────────────────────
    let idleTimerMs = isMoving ? 0 : hider.idleTimerMs + deltaMs;
    const convertToHunter = idleTimerMs >= HIDER_IDLE_LIMIT_MS;
    if (convertToHunter) {
      idleTimerMs = HIDER_IDLE_LIMIT_MS;
    }

    // ── Active-item duration ─────────────────────────────
    let activeItem = hider.activeItem;
    let activeItemRemainingMs = hider.activeItemRemainingMs;
    if (activeItem && activeItemRemainingMs > 0) {
      activeItemRemainingMs = Math.max(0, activeItemRemainingMs - deltaMs);
      if (activeItemRemainingMs <= 0) {
        activeItem = null;
      }
    }

    // ── Bolo slow debuff ─────────────────────────────────
    const slowRemainingMs = Math.max(0, hider.slowRemainingMs - deltaMs);

    // ── Movement ───────────────────────────────────────────
    const speed = this.getSpeed({ ...hider, activeItem, slowRemainingMs });
    const newPosition: Vec3 = {
      x: hider.position.x + movementInput.x * speed * delta,
      y: hider.position.y,
      z: hider.position.z + movementInput.z * speed * delta,
    };

    const updatedState: HiderState = {
      ...hider,
      idleTimerMs,
      activeItem,
      activeItemRemainingMs,
      slowRemainingMs,
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

    // Bolo slow halves speed
    if (hider.slowRemainingMs > 0) {
      speed *= 0.5;
    }

    return speed;
  }

  // ── Inventory management ────────────────────────────────────

  /** Check whether the inventory has a free slot. */
  hasInventorySpace(hider: HiderState): boolean {
    return hider.inventory.some(slot => slot === null);
  }

  /** Add an item to the first empty inventory slot. Returns updated state (unchanged if full). */
  addToInventory(hider: HiderState, item: HiderItemType): HiderState {
    const inv: [HiderItemType | null, HiderItemType | null] = [...hider.inventory];
    const freeIdx = inv.indexOf(null);
    if (freeIdx === -1) return hider; // full
    inv[freeIdx] = item;
    return { ...hider, inventory: inv };
  }

  /** Activate the item in a specific inventory slot (0 or 1). */
  useSlot(hider: HiderState, slotIndex: number): HiderState {
    if (slotIndex < 0 || slotIndex >= MAX_INVENTORY_SLOTS) return hider;
    const item = hider.inventory[slotIndex];
    if (!item) return hider; // empty slot
    if (hider.activeItem) return hider; // already using an item

    const inv: [HiderItemType | null, HiderItemType | null] = [...hider.inventory];
    inv[slotIndex] = null;
    return { ...hider, inventory: inv, activeItem: item, activeItemRemainingMs: ITEM_EFFECT_DURATION_MS };
  }

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
