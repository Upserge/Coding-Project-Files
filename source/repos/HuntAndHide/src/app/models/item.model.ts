/** Item and weapon type definitions. No dependencies on other models. */

export type HiderItemType = 'smoke_bomb' | 'decoy' | 'speed_burst';
export type WeaponType = 'spear' | 'bolo';
export type EdibleType = 'berry' | 'mushroom' | 'grub';

/** Any item that can exist on the map. */
export type ItemType = HiderItemType | WeaponType | EdibleType;

export interface Item {
  id: string;
  type: ItemType;
  position: { x: number; y: number; z: number };
  isPickedUp: boolean;
  ownerId: string | null;
}

export interface ItemConfig {
  type: ItemType;
  displayName: string;
  description: string;
  /** Duration in ms for timed effects (smoke, speed burst). 0 = instant. */
  effectDurationMs: number;
  /** Radius in world-units for AoE effects (smoke, bolo). 0 = single target. */
  effectRadius: number;
}

export const ITEM_CONFIGS: Record<HiderItemType, ItemConfig> = {
  smoke_bomb: {
    type: 'smoke_bomb',
    displayName: 'Smoke Bomb',
    description: 'Blocks hunter vision in a radius',
    effectDurationMs: 3000,
    effectRadius: 4,
  },
  decoy: {
    type: 'decoy',
    displayName: 'Decoy',
    description: 'Spawns a fake player that moves briefly',
    effectDurationMs: 5000,
    effectRadius: 0,
  },
  speed_burst: {
    type: 'speed_burst',
    displayName: 'Speed Burst',
    description: 'Sprint boost for a short duration',
    effectDurationMs: 3000,
    effectRadius: 0,
  },
};

export const WEAPON_CONFIGS: Record<WeaponType, ItemConfig> = {
  spear: {
    type: 'spear',
    displayName: 'Spear',
    description: 'Straight-line throw — retrievable after landing',
    effectDurationMs: 0,
    effectRadius: 0,
  },
  bolo: {
    type: 'bolo',
    displayName: 'Bolo',
    description: 'AoE slow on impact — retrievable',
    effectDurationMs: 2000,
    effectRadius: 3,
  },
};
