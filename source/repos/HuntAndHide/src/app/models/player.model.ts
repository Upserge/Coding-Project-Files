/** Player types and constants. */

// ── Roles & Animals ──────────────────────────────────────────

export type PlayerRole = 'hunter' | 'hider';

export type HiderAnimal = 'fox' | 'rabbit' | 'deer' | 'frog' | 'owl' | 'snake' | 'chameleon' | 'pig';
export type HunterAnimal = 'wolf' | 'lion' | 'panther';
export type AnimalCharacter = HiderAnimal | HunterAnimal;

export const HIDER_ANIMALS: readonly HiderAnimal[] = [
  'fox', 'rabbit', 'deer', 'frog', 'owl', 'snake', 'chameleon', 'pig',
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
  /** True when the hider is inside a hiding-spot obstacle (bush, leaf pile, hole). */
  isHiding: boolean;
  /** Obstacle ID of the occupied hiding spot, or null when not hiding. */
  hidingSpotId: string | null;
  /** True when the hider has been caught — plays the caught animation before conversion. */
  isCaught: boolean;
}

export interface HunterState extends PlayerState {
  role: 'hunter';
  animal: HunterAnimal;
  /** Milliseconds remaining before starvation. Starts at HUNTER_HUNGER_MS. */
  hungerRemainingMs: number;
  /** Current stamina (0–HUNTER_STAMINA_MAX). Drains while sprinting, regens otherwise. */
  stamina: number;
  /** True when the player is holding sprint and has stamina remaining. */
  isSprinting: boolean;
  /** Seconds remaining before sprinting is allowed again after exhaustion. */
  exhaustionCooldownS: number;
  /** Seconds remaining for the local exhausted feedback animation. */
  exhaustedFeedbackS: number;
}

// ── Gameplay constants (all tuneable) ────────────────────

/** Hiders must move within this window or they convert to a hunter. */
export const HIDER_IDLE_LIMIT_MS = 7_000;

/** Hunter hunger gauge — dies when it reaches 0. */
export const HUNTER_HUNGER_MS = 120_000; // 2 minutes

/** Speed multiplier relative to base movement speed. */
export const HIDER_SPEED_MULTIPLIER = 1.5;
export const HUNTER_SPEED_MULTIPLIER = 1.0;

/** Hunter stamina pool. */
export const HUNTER_STAMINA_MAX = 100;
/** Stamina drained per second while sprinting. */
export const HUNTER_STAMINA_DRAIN_PER_S = 25;
/** Stamina recovered per second while not sprinting. */
export const HUNTER_STAMINA_REGEN_PER_S = 12;
/** Speed multiplier while sprinting. */
export const HUNTER_SPRINT_MULTIPLIER = 1.6;
/** Sprint lockout after a hunter fully exhausts stamina. */
export const HUNTER_EXHAUSTION_COOLDOWN_S = 3.0;
/** Short feedback animation when a hunter becomes exhausted. */
export const HUNTER_EXHAUSTED_FEEDBACK_S = 0.55;
