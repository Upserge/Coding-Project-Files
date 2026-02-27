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
}

export interface HiderState extends PlayerState {
  role: 'hider';
  animal: HiderAnimal;
  /** Milliseconds since last movement — convert to hunter at HIDER_IDLE_LIMIT_MS. */
  idleTimerMs: number;
  activeItem: HiderItemType | null;
}

export interface HunterState extends PlayerState {
  role: 'hunter';
  animal: HunterAnimal;
  /** Milliseconds remaining before starvation. Starts at HUNTER_HUNGER_MS. */
  hungerRemainingMs: number;
  equippedWeapon: WeaponType;
}

// ── Gameplay constants (all tuneable) ────────────────────────

/** Hiders must move within this window or they convert to a hunter. */
export const HIDER_IDLE_LIMIT_MS = 7_000;

/** Hunter hunger gauge — dies when it reaches 0. */
export const HUNTER_HUNGER_MS = 300_000; // 5 minutes

/** Speed multiplier relative to base movement speed. */
export const HIDER_SPEED_MULTIPLIER = 1.5;
export const HUNTER_SPEED_MULTIPLIER = 1.0;
