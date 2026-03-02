import { inject, Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { MapService } from './map.service';
import { OBSTACLE_CONFIGS, ObstaclePlacement } from '../models/map.model';

/** Maximum distance from a hiding spot center to interact with it. */
const INTERACT_RADIUS = 2.5;

/**
 * HidingService manages hiding-spot occupancy.
 *
 * Each canHideInside obstacle can hold at most one hider.
 * The game loop queries proximity and toggles hide/unhide
 * based on the F-key (local) or CPU decision.
 */
@Injectable({ providedIn: 'root' })
export class HidingService {
  private readonly mapService = inject(MapService);

  /** obstacleId → hider uid currently occupying the spot. */
  private readonly occupied = new Map<string, string>();
  /** Reverse lookup: hider uid → obstacleId. */
  private readonly hiderToSpot = new Map<string, string>();

  // ── Occupancy management ───────────────────────────────────

  /** Claim a hiding spot for a hider. Returns true on success. */
  occupy(obstacleId: string, hiderUid: string): boolean {
    if (this.occupied.has(obstacleId)) return false;
    this.occupied.set(obstacleId, hiderUid);
    this.hiderToSpot.set(hiderUid, obstacleId);
    return true;
  }

  /** Release the spot a hider is currently in. */
  vacate(hiderUid: string): void {
    const spotId = this.hiderToSpot.get(hiderUid);
    if (spotId) {
      this.occupied.delete(spotId);
      this.hiderToSpot.delete(hiderUid);
    }
  }

  /** Whether a specific obstacle is already occupied. */
  isOccupied(obstacleId: string): boolean {
    return this.occupied.has(obstacleId);
  }

  /** Get the obstacle ID a hider is hiding in, if any. */
  getSpotForHider(hiderUid: string): string | null {
    return this.hiderToSpot.get(hiderUid) ?? null;
  }

  /** Clear all occupancy (e.g. on game reset). */
  clear(): void {
    this.occupied.clear();
    this.hiderToSpot.clear();
  }

  // ── Proximity queries ──────────────────────────────────────

  /**
   * Find the nearest unoccupied canHideInside obstacle within
   * INTERACT_RADIUS of the given position.
   * Returns the obstacle placement or null.
   */
  getNearbyHidingSpot(pos: Vec3): ObstaclePlacement | null {
    const map = this.mapService.getMap('jungle');
    let best: ObstaclePlacement | null = null;
    let bestDist = INTERACT_RADIUS;

    for (const obs of map.obstacles) {
      const cfg = OBSTACLE_CONFIGS[obs.type];
      if (!cfg.canHideInside) continue;
      if (this.occupied.has(obs.id)) continue;

      const dx = pos.x - obs.position.x;
      const dz = pos.z - obs.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < bestDist) {
        bestDist = dist;
        best = obs;
      }
    }

    return best;
  }
}
