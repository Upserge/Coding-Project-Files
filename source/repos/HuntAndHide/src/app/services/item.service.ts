import { Injectable } from '@angular/core';
import {
  Item,
  ItemType,
  HiderItemType,
  EdibleType,
  WeaponType,
  ITEM_CONFIGS,
} from '../models/item.model';
import { Vec3, PlayerState } from '../models/player.model';

/**
 * ItemService manages the lifecycle of items on the map:
 * spawning, pickup detection, and effect-duration tracking.
 */
@Injectable({ providedIn: 'root' })
export class ItemService {

  private readonly pickupRadius = 1.5;
  private nextItemId = 0;

  // ── Spawning ───────────────────────────────────────────────

  /** Create a new item at a given position. */
  spawnItem(type: ItemType, position: Vec3): Item {
    return {
      id: `item_${this.nextItemId++}`,
      type,
      position: { ...position },
      isPickedUp: false,
      ownerId: null,
    };
  }

  /** Generate the initial set of items for a round. */
  spawnRoundItems(itemSpawnPoints: Vec3[]): Item[] {
    const hiderItems: HiderItemType[] = ['smoke_bomb', 'decoy', 'speed_burst'];
    const edibles: EdibleType[] = ['berry', 'mushroom', 'grub'];
    const weapons: WeaponType[] = ['spear', 'bolo'];
    const allTypes: ItemType[] = [...hiderItems, ...edibles, ...weapons];

    return itemSpawnPoints.map((pos, i) => {
      const type = allTypes[i % allTypes.length];
      return this.spawnItem(type, pos);
    });
  }

  // ── Pickup ─────────────────────────────────────────────────

  /** Check if a player is close enough to pick up an item. */
  canPickUp(player: PlayerState, item: Item): boolean {
    if (item.isPickedUp) return false;
    return this.distance(player.position, item.position) <= this.pickupRadius;
  }

  /** Mark item as picked up by a player. */
  pickUp(item: Item, playerId: string): Item {
    return { ...item, isPickedUp: true, ownerId: playerId };
  }

  /** Drop an item back onto the map (e.g. landed weapon becomes retrievable). */
  drop(item: Item, position: Vec3): Item {
    return { ...item, isPickedUp: false, ownerId: null, position: { ...position } };
  }

  // ── Effect duration ────────────────────────────────────────

  /** Get the effect duration for a hider item type. */
  getEffectDuration(type: HiderItemType): number {
    return ITEM_CONFIGS[type].effectDurationMs;
  }

  // ── Queries ────────────────────────────────────────────────

  /** Filter items that are still on the ground (not picked up). */
  getAvailableItems(items: Item[]): Item[] {
    return items.filter(i => !i.isPickedUp);
  }

  /** Find items near a player that can be picked up. */
  findNearbyItems(player: PlayerState, items: Item[]): Item[] {
    return this.getAvailableItems(items)
      .filter(item => this.distance(player.position, item.position) <= this.pickupRadius);
  }

  // ── Helpers ────────────────────────────────────────────────

  private distance(a: Vec3, b: Vec3): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
