import { inject, Injectable } from '@angular/core';
import {
  PlayerRole,
  PlayerState,
  HiderState,
  HunterState,
  AnimalCharacter,
  HiderAnimal,
  HunterAnimal,
  HIDER_ANIMALS,
  HUNTER_ANIMALS,
  HUNTER_HUNGER_MS,
  Vec3,
} from '../models/player.model';
import { DEFAULT_SESSION_CONFIG } from '../models/session.model';
import { IdentityService } from './identity.service';

/**
 * PlayerService handles:
 * - Role assignment (7 hiders / 3 hunters ratio)
 * - Random animal character selection
 * - Building initial PlayerState for a new player joining a session
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly identity = inject(IdentityService);

  // ── Role assignment ────────────────────────────────────────

  /** Determine role for a new player based on current session counts. */
  assignRole(currentHiderCount: number, currentHunterCount: number): PlayerRole {
    const { hiderSlots, hunterSlots } = DEFAULT_SESSION_CONFIG;

    // Fill hunters first if none exist, then balance to ratio
    if (currentHunterCount < hunterSlots && currentHiderCount >= hiderSlots) {
      return 'hunter';
    }
    if (currentHunterCount === 0 && currentHiderCount > 0) {
      return 'hunter';
    }

    // Maintain the 7:3 ratio
    const hiderRatio = currentHiderCount / (hiderSlots || 1);
    const hunterRatio = currentHunterCount / (hunterSlots || 1);
    return hiderRatio <= hunterRatio ? 'hider' : 'hunter';
  }

  // ── Animal assignment ──────────────────────────────────────

  /** Pick a random animal for the given role, avoiding duplicates in session. */
  assignAnimal(role: PlayerRole, takenAnimals: AnimalCharacter[]): AnimalCharacter {
    const pool: readonly AnimalCharacter[] = role === 'hider' ? HIDER_ANIMALS : HUNTER_ANIMALS;
    const available = pool.filter(a => !takenAnimals.includes(a));

    if (available.length === 0) {
      // All taken — allow duplicates (more players than animal types)
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  // ── Factory ────────────────────────────────────────────────

  /** Build a fresh PlayerState for someone joining a session. */
  createPlayerState(
    role: PlayerRole,
    animal: AnimalCharacter,
    spawnPosition: Vec3,
  ): PlayerState {
    return {
      uid: this.identity.getToken(),
      displayName: this.identity.getUsername() || 'Anonymous',
      role,
      animal,
      position: { ...spawnPosition },
      rotation: { x: 0, y: 0, z: 0 },
      isAlive: true,
      score: 0,
    };
  }

  /** Build a full HiderState. */
  createHiderState(animal: HiderAnimal, spawnPosition: Vec3): HiderState {
    return {
      ...this.createPlayerState('hider', animal, spawnPosition),
      role: 'hider',
      animal,
      idleTimerMs: 0,
      activeItem: null,
    };
  }

  /** Build a full HunterState. */
  createHunterState(animal: HunterAnimal, spawnPosition: Vec3): HunterState {
    return {
      ...this.createPlayerState('hunter', animal, spawnPosition),
      role: 'hunter',
      animal,
      hungerRemainingMs: HUNTER_HUNGER_MS,
      equippedWeapon: 'spear', // default starting weapon
    };
  }
}
