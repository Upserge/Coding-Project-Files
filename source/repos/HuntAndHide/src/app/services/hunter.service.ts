import { Injectable } from '@angular/core';
import {
  HunterState,
  HiderState,
  HUNTER_HUNGER_MS,
  HUNTER_SPEED_MULTIPLIER,
  MAX_INVENTORY_SLOTS,
  Vec3,
} from '../models/player.model';
import { WeaponType } from '../models/item.model';

export interface HunterTickResult {
  /** True if the hunter starved this frame. */
  starved: boolean;
  newPosition: Vec3;
}

export interface ProjectileState {
  id: string;
  type: WeaponType;
  ownerId: string;
  position: Vec3;
  direction: Vec3;
  speed: number;
  /** Remaining lifetime in ms before it drops and becomes retrievable. */
  lifetimeMs: number;
  isLanded: boolean;
}

/**
 * HunterService — all hunter-specific game logic.
 * Stateless: receives state, returns updated state.
 */
@Injectable({ providedIn: 'root' })
export class HunterService {

  private readonly baseSpeed = 10;
  private readonly catchRadius = 1.5;
  private readonly spearSpeed = 15;
  private readonly boloSpeed = 10;
  private readonly projectileLifetimeMs = 2000;

  // ── Per-frame update ───────────────────────────────────────

  tick(
    hunter: HunterState,
    delta: number,
    movementInput: Vec3,
  ): { state: HunterState; result: HunterTickResult } {

    // ── Hunger ─────────────────────────────────────────────
    const hungerRemainingMs = Math.max(0, hunter.hungerRemainingMs - delta * 1000);
    const starved = hungerRemainingMs <= 0;

    // ── Movement ───────────────────────────────────────────
    const speed = this.getSpeed();
    const newPosition: Vec3 = {
      x: hunter.position.x + movementInput.x * speed * delta,
      y: hunter.position.y,
      z: hunter.position.z + movementInput.z * speed * delta,
    };

    const updatedState: HunterState = {
      ...hunter,
      hungerRemainingMs,
      position: newPosition,
      isAlive: !starved && hunter.isAlive,
    };

    return {
      state: updatedState,
      result: { starved, newPosition },
    };
  }

  // ── Speed ──────────────────────────────────────────────────

  getSpeed(): number {
    return this.baseSpeed * HUNTER_SPEED_MULTIPLIER;
  }

  // ── Catching ───────────────────────────────────────────────

  /** Check if a hunter is close enough to catch a hider. */
  canCatch(hunter: HunterState, hider: HiderState): boolean {
    const dx = hunter.position.x - hider.position.x;
    const dz = hunter.position.z - hider.position.z;
    return Math.sqrt(dx * dx + dz * dz) <= this.catchRadius;
  }

  /**
   * Process a catch — returns updated hunter (fed) and the
   * hider converted to a hunter shell.
   */
  performCatch(hunter: HunterState, _hider: HiderState): HunterState {
    // Eating a hider restores significant hunger
    const hungerRestored = HUNTER_HUNGER_MS * 0.4;
    return {
      ...hunter,
      hungerRemainingMs: Math.min(HUNTER_HUNGER_MS, hunter.hungerRemainingMs + hungerRestored),
      score: hunter.score + 100,
    };
  }

  // ── Weapons ────────────────────────────────────────────────

  /** Create a projectile from the hunter's current position and facing. */
  throwWeapon(hunter: HunterState, aimDirection: Vec3): ProjectileState {
    const type = hunter.equippedWeapon;
    return {
      id: `proj_${hunter.uid}_${Date.now()}`,
      type,
      ownerId: hunter.uid,
      position: { ...hunter.position },
      direction: this.normalizeVec3(aimDirection),
      speed: type === 'spear' ? this.spearSpeed : this.boloSpeed,
      lifetimeMs: this.projectileLifetimeMs,
      isLanded: false,
    };
  }

  /** Advance a projectile by delta. */
  tickProjectile(proj: ProjectileState, delta: number): ProjectileState {
    if (proj.isLanded) return proj;

    const lifetimeMs = proj.lifetimeMs - delta * 1000;
    const isLanded = lifetimeMs <= 0;

    return {
      ...proj,
      position: {
        x: proj.position.x + proj.direction.x * proj.speed * delta,
        y: proj.position.y,
        z: proj.position.z + proj.direction.z * proj.speed * delta,
      },
      lifetimeMs: Math.max(0, lifetimeMs),
      isLanded,
    };
  }

  /** Switch weapon (when picking up a different type). */
  equipWeapon(hunter: HunterState, weapon: WeaponType): HunterState {
    return { ...hunter, equippedWeapon: weapon };
  }

  // ── Inventory management ───────────────────────────────────

  /** Check whether the inventory has a free slot. */
  hasInventorySpace(hunter: HunterState): boolean {
    return hunter.inventory.some(slot => slot === null);
  }

  /** Add a weapon to the first empty inventory slot. Returns unchanged if full. */
  addToInventory(hunter: HunterState, weapon: WeaponType): HunterState {
    const inv: [WeaponType | null, WeaponType | null] = [...hunter.inventory];
    const freeIdx = inv.indexOf(null);
    if (freeIdx === -1) return hunter;
    inv[freeIdx] = weapon;
    return { ...hunter, inventory: inv };
  }

  /** Equip + throw the weapon from a specific inventory slot (0 or 1). */
  useSlot(hunter: HunterState, slotIndex: number, aimDir: Vec3): { state: HunterState; proj: ProjectileState } | null {
    if (slotIndex < 0 || slotIndex >= MAX_INVENTORY_SLOTS) return null;
    const weapon = hunter.inventory[slotIndex];
    if (!weapon) return null;

    const inv: [WeaponType | null, WeaponType | null] = [...hunter.inventory];
    inv[slotIndex] = null;
    const equipped: HunterState = { ...hunter, inventory: inv, equippedWeapon: weapon };
    const proj = this.throwWeapon(equipped, aimDir);
    return { state: equipped, proj };
  }

  // ── Feeding ────────────────────────────────────────────────

  /** Eat a random edible item — restores a small amount of hunger. */
  eatEdible(hunter: HunterState): HunterState {
    const hungerRestored = HUNTER_HUNGER_MS * 0.1;
    return {
      ...hunter,
      hungerRemainingMs: Math.min(HUNTER_HUNGER_MS, hunter.hungerRemainingMs + hungerRestored),
    };
  }

  // ── Queries ────────────────────────────────────────────────

  /** Hunger as percentage remaining (1 = full, 0 = starved). */
  getHungerPercent(hunter: HunterState): number {
    return hunter.hungerRemainingMs / HUNTER_HUNGER_MS;
  }

  // ── Helpers ────────────────────────────────────────────────

  private normalizeVec3(v: Vec3): Vec3 {
    const len = Math.sqrt(v.x * v.x + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 1 }; // default forward
    return { x: v.x / len, y: 0, z: v.z / len };
  }
}
