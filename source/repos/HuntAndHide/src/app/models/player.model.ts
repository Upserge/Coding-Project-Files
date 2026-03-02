/** Player types and constants. Imports only from item.model. */

import { HiderItemType, WeaponType } from './item.model';

// ── Roles & Animals ──────────────────────────────────────────

export type PlayerRole = 'hunter' | 'hider';

export type HiderAnimal = 'fox' | 'rabbit' | 'deer' | 'frog' | 'owl' | 'snake' | 'chameleon';
export type HunterAnimal = 'wolf' | 'lion' | 'panther';
export type AnimalCharacter = HiderAnimal | HunterAnimal;

export const HIDER_ANIMALS: readonly HiderAnimal[] = [
  'fox', 'rabbit', 'deer', 'frog', 'owl', 'snake', 'chameleon',
];

export const HUNTER_ANIMALS: readonly HunterAnimal[] = [
  'wolf', 'lion', 'panther',
];

// ── Geometry helpers ─────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Player state ─────────────────────────────────────────────

export interface PlayerState {
  uid: string;
  displayName: string;
  role: PlayerRole;
  animal: AnimalCharacter;
  position: Vec3;
  rotation: Vec3;
  isAlive: boolean;
  score: number;
  isCpu: boolean;
}

export interface HiderState extends PlayerState {
  role: 'hider';
  animal: HiderAnimal;
  /** Milliseconds since last movement — convert to hunter at HIDER_IDLE_LIMIT_MS. */
  idleTimerMs: number;
  /** 2-slot inventory of held items (not yet activated). */
  inventory: [HiderItemType | null, HiderItemType | null];
  /** Currently active timed effect (set when an inventory item is used). */
  activeItem: HiderItemType | null;
  /** Remaining ms for the currently active item effect (0 = no effect). */
  activeItemRemainingMs: number;
  /** Remaining ms of bolo-induced slow debuff (0 = not slowed). */
  slowRemainingMs: number;
}

export interface HunterState extends PlayerState {
  role: 'hunter';
  animal: HunterAnimal;
  /** Milliseconds remaining before starvation. Starts at HUNTER_HUNGER_MS. */
  hungerRemainingMs: number;
  /** 2-slot weapon inventory. */
  inventory: [WeaponType | null, WeaponType | null];
  equippedWeapon: WeaponType;
}

// ── Decoy state ──────────────────────────────────────────

export interface DecoyState {
  id: string;
  position: Vec3;
  direction: Vec3;
  remainingMs: number;
  /** Matches the spawning hider so the decoy looks identical. */
  animal: HiderAnimal;
  displayName: string;
}

// ── Gameplay constants (all tuneable) ────────────────────

/** Maximum items a player can carry at once. */
export const MAX_INVENTORY_SLOTS = 2;

/** Hiders must move within this window or they convert to a hunter. */
export const HIDER_IDLE_LIMIT_MS = 7_000;

/** Hunter hunger gauge — dies when it reaches 0. */
export const HUNTER_HUNGER_MS = 300_000; // 5 minutes

/** Speed multiplier relative to base movement speed. */
export const HIDER_SPEED_MULTIPLIER = 1.5;
export const HUNTER_SPEED_MULTIPLIER = 1.0;

/** Duration of bolo-induced slow debuff in ms. */
export const BOLO_SLOW_MS = 3_000;

/** Default active-item effect duration in ms. */
export const ITEM_EFFECT_DURATION_MS = 5_000;
