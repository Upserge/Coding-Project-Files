import { inject, Injectable, signal } from '@angular/core';
import { HunterState, HUNTER_HUNGER_MS, HUNTER_STAMINA_MAX } from '../models/player.model';
import { CollisionService } from './collision.service';

/**
 * HunterRespawnService manages starved-hunter death timers,
 * the "YOU DIED" overlay, and respawn positioning.
 */
@Injectable({ providedIn: 'root' })
export class HunterRespawnService {
  private readonly collision = inject(CollisionService);

  readonly hunterDeathActive = signal(false);
  readonly hunterDeathCountdown = signal(0);

  private readonly deathTimerS = 3;
  private pendingDeaths = new Map<string, number>();

  get pendingCount(): number {
    return this.pendingDeaths.size;
  }

  /** Returns a dead hunter if starvation triggers, else null. */
  handleStarvation(state: HunterState, starved: boolean, localUid: string): HunterState | null {
    if (!starved) return null;
    if (this.pendingDeaths.has(state.uid)) return null;
    this.pendingDeaths.set(state.uid, this.deathTimerS);
    this.activateDeathOverlay(state.uid, localUid);
    return { ...state, isAlive: false };
  }

  /** Process pending death timers; returns UIDs ready for respawn. */
  processPendingDeaths(delta: number, localUid: string): Set<string> {
    const respawned = new Set<string>();
    for (const [uid, remaining] of this.pendingDeaths) {
      const next = remaining - delta;
      if (next <= 0) {
        respawned.add(uid);
        this.pendingDeaths.delete(uid);
        this.clearDeathOverlay(uid, localUid);
      } else {
        this.pendingDeaths.set(uid, next);
        this.updateCountdown(uid, localUid, next);
      }
    }
    return respawned;
  }

  respawnHunter(hunter: HunterState): HunterState {
    const spawnPos = this.collision.ejectFromObstacles({ x: 0, y: 0, z: 0 });
    return {
      ...hunter,
      position: spawnPos,
      hungerRemainingMs: HUNTER_HUNGER_MS,
      stamina: HUNTER_STAMINA_MAX,
      isAlive: true,
    };
  }

  reset(): void {
    this.pendingDeaths.clear();
    this.hunterDeathActive.set(false);
    this.hunterDeathCountdown.set(0);
  }

  private activateDeathOverlay(hunterUid: string, localUid: string): void {
    if (hunterUid !== localUid) return;
    this.hunterDeathActive.set(true);
    this.hunterDeathCountdown.set(this.deathTimerS);
  }

  private clearDeathOverlay(uid: string, localUid: string): void {
    if (uid !== localUid) return;
    this.hunterDeathActive.set(false);
    this.hunterDeathCountdown.set(0);
  }

  private updateCountdown(uid: string, localUid: string, remaining: number): void {
    if (uid !== localUid) return;
    this.hunterDeathCountdown.set(Math.ceil(remaining));
  }
}
