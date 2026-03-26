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
  HUNTER_EXHAUSTED_FEEDBACK_S,
  HUNTER_HUNGER_MS,
  HUNTER_EXHAUSTION_COOLDOWN_S,
  HUNTER_STAMINA_MAX,
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

    const total = currentHiderCount + currentHunterCount;

    // Special rule: if the lobby currently has no hunters and the incoming
    // player would be the 5th (total currently 4), force them to be a hunter
    // so the game will have at least one hunter.
    if (currentHunterCount === 0 && total === 4) {
      return 'hunter';
    }

    // Respect slot limits.
    if (currentHunterCount >= hunterSlots) return 'hider';
    if (currentHiderCount >= hiderSlots) return 'hunter';

    // Otherwise choose randomly between hider and hunter.
    return Math.random() < 0.5 ? 'hider' : 'hunter';
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
      isCpu: false,
    };
  }

  /** Build a full HiderState. */
  createHiderState(animal: HiderAnimal, spawnPosition: Vec3): HiderState {
    const base = this.createPlayerState('hider', animal, spawnPosition);
    return {
      ...base,
      score: 50,
      role: 'hider',
      animal,
      idleTimerMs: 0,
      isHiding: false,
      hidingSpotId: null,
      isCaught: false,
    };
  }

  /** Build a full HunterState. */
  createHunterState(animal: HunterAnimal, spawnPosition: Vec3): HunterState {
    return {
      ...this.createPlayerState('hunter', animal, spawnPosition),
      role: 'hunter',
      animal,
      hungerRemainingMs: HUNTER_HUNGER_MS,
      stamina: HUNTER_STAMINA_MAX,
      isSprinting: false,
      exhaustionCooldownS: 0,
      exhaustedFeedbackS: 0,
      kills: 0,
    };
  }
}
