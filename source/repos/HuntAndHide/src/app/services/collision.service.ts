import { Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { MapService } from './map.service';
import { OBSTACLE_CONFIGS } from '../models/map.model';

/**
 * CollisionService enforces map bounds and simple obstacle collisions.
 * Uses axis-aligned footprint tests against obstacle placements and
 * clamps to the playable area. If a proposed movement collides with
 * an obstacle the previous position is returned to block the move.
 *
 * Hiders can pass through canHideInside obstacles when `allowHiding` is true.
 */
@Injectable({ providedIn: 'root' })
export class CollisionService {
  // Default player footprint radius (world units)
  private readonly playerRadius = 0.4;

  constructor(private readonly mapService: MapService) {}

  /**
   * Resolve a proposed movement. Returns an adjusted position that is
   * clamped to the playable bounds and doesn't intersect obstacle footprints.
   * When `allowHiding` is true, canHideInside obstacles are ignored.
   */
  resolvePosition(prev: Vec3, proposed: Vec3, radius = this.playerRadius, allowHiding = false): Vec3 {
    const map = this.mapService.getMap('jungle');

    const halfW = map.width / 2;
    const halfD = map.depth / 2;
    const margin = 0;

    // Clamp to bounds first
    const clampedX = Math.max(-halfW + margin, Math.min(halfW - margin, proposed.x));
    const clampedZ = Math.max(-halfD + margin, Math.min(halfD - margin, proposed.z));
    const candidate = { x: clampedX, y: proposed.y, z: clampedZ } as Vec3;

    // Helper: test if a position intersects any blocking obstacle
    const intersects = (pos: Vec3) => {
      for (const obs of map.obstacles) {
        const cfg = OBSTACLE_CONFIGS[obs.type];
        if (allowHiding && cfg.canHideInside) continue; // hiders pass through
        const halfObsX = cfg.size.x / 2 + radius;
        const halfObsZ = cfg.size.z / 2 + radius;

        const dx = Math.abs(pos.x - obs.position.x);
        const dz = Math.abs(pos.z - obs.position.z);

        if (dx <= halfObsX && dz <= halfObsZ) return true;
      }
      return false;
    };

    if (!intersects(candidate)) return candidate;

    const moveDx = proposed.x - prev.x;
    const moveDz = proposed.z - prev.z;

    const SLIDE_FACTOR = 0.6;

    const testX = { x: prev.x + moveDx * SLIDE_FACTOR, y: proposed.y, z: prev.z } as Vec3;
    const testZ = { x: prev.x, y: proposed.y, z: prev.z + moveDz * SLIDE_FACTOR } as Vec3;

    const canX = !intersects(testX);
    const canZ = !intersects(testZ);

    if (canX && !canZ) return { x: Math.max(-halfW + margin, Math.min(halfW - margin, testX.x)), y: proposed.y, z: prev.z };
    if (!canX && canZ) return { x: prev.x, y: proposed.y, z: Math.max(-halfD + margin, Math.min(halfD - margin, testZ.z)) };
    if (canX && canZ) {
      const outX = Math.max(-halfW + margin, Math.min(halfW - margin, prev.x + moveDx * SLIDE_FACTOR));
      const outZ = Math.max(-halfD + margin, Math.min(halfD - margin, prev.z + moveDz * SLIDE_FACTOR));
      const out = { x: outX, y: proposed.y, z: outZ } as Vec3;
      return intersects(out) ? prev : out;
    }

    return prev;
  }

  /** Check if a position is inside any canHideInside obstacle footprint. */
  isInsideHidingSpot(pos: Vec3): boolean {
    const map = this.mapService.getMap('jungle');
    for (const obs of map.obstacles) {
      const cfg = OBSTACLE_CONFIGS[obs.type];
      if (!cfg.canHideInside) continue;
      const halfX = cfg.size.x / 2;
      const halfZ = cfg.size.z / 2;
      if (Math.abs(pos.x - obs.position.x) <= halfX && Math.abs(pos.z - obs.position.z) <= halfZ) {
        return true;
      }
    }
    return false;
  }
}
