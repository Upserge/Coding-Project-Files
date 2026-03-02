import { Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { MapService } from './map.service';
import { OBSTACLE_CONFIGS } from '../models/map.model';

/**
 * CollisionService enforces map bounds and simple obstacle collisions.
 * Uses axis-aligned footprint tests against obstacle placements and
 * clamps to the playable area. If a proposed movement collides with
 * an obstacle the previous position is returned to block the move.
 */
@Injectable({ providedIn: 'root' })
export class CollisionService {
  // Default player footprint radius (world units)
  private readonly playerRadius = 0.4;

  constructor(private readonly mapService: MapService) {}

  /**
   * Resolve a proposed movement. Returns an adjusted position that is
   * clamped to the playable bounds and doesn't intersect obstacle footprints.
   * If a collision with an obstacle is detected the previous position is returned.
   */
  resolvePosition(prev: Vec3, proposed: Vec3, radius = this.playerRadius): Vec3 {
    const map = this.mapService.getMap('jungle');

    const halfW = map.width / 2;
    const halfD = map.depth / 2;
    const margin = 0; // keep players a few units from exact map edge

    // Clamp to bounds first
    const clampedX = Math.max(-halfW + margin, Math.min(halfW - margin, proposed.x));
    const clampedZ = Math.max(-halfD + margin, Math.min(halfD - margin, proposed.z));
    const candidate = { x: clampedX, y: proposed.y, z: clampedZ } as Vec3;

    // Helper: test if a position intersects any obstacle footprint
    const intersects = (pos: Vec3) => {
      for (const obs of map.obstacles) {
        const cfg = OBSTACLE_CONFIGS[obs.type];
        const halfObsX = cfg.size.x / 2 + radius;
        const halfObsZ = cfg.size.z / 2 + radius;

        const dx = Math.abs(pos.x - obs.position.x);
        const dz = Math.abs(pos.z - obs.position.z);

        if (dx <= halfObsX && dz <= halfObsZ) return true;
      }
      return false;
    };

    // If there's no collision, accept candidate immediately
    if (!intersects(candidate)) return candidate;

    // Collision detected — attempt gentle sliding along individual axes.
    // Compute intended movement delta from previous position.
    const moveDx = proposed.x - prev.x;
    const moveDz = proposed.z - prev.z;

    const SLIDE_FACTOR = 0.6; // how much movement is allowed when sliding (0-1)

    // Try X-only movement
    const testX = { x: prev.x + moveDx * SLIDE_FACTOR, y: proposed.y, z: prev.z } as Vec3;
    const testZ = { x: prev.x, y: proposed.y, z: prev.z + moveDz * SLIDE_FACTOR } as Vec3;

    const canX = !intersects(testX);
    const canZ = !intersects(testZ);

    if (canX && !canZ) return { x: Math.max(-halfW + margin, Math.min(halfW - margin, testX.x)), y: proposed.y, z: prev.z };
    if (!canX && canZ) return { x: prev.x, y: proposed.y, z: Math.max(-halfD + margin, Math.min(halfD - margin, testZ.z)) };
    if (canX && canZ) {
      // Both axes free — allow sliding on both with reduced magnitude
      const outX = Math.max(-halfW + margin, Math.min(halfW - margin, prev.x + moveDx * SLIDE_FACTOR));
      const outZ = Math.max(-halfD + margin, Math.min(halfD - margin, prev.z + moveDz * SLIDE_FACTOR));
      const out = { x: outX, y: proposed.y, z: outZ } as Vec3;
      // Final safety check
      return intersects(out) ? prev : out;
    }

    // No sliding possible — block movement
    return prev;
  }
}
