import { Injectable } from '@angular/core';
import { Vec3 } from '../models/player.model';
import { MapService } from './map.service';
import { OBSTACLE_CONFIGS } from '../models/map.model';

const JUNGLE_MAP_ID = 'jungle';
const SLIDE_FACTOR = 0.6;

type JungleMap = ReturnType<MapService['getMap']>;
type MapObstacle = JungleMap['obstacles'][number];

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
    const map = this.getMap();
    const candidate = this.clampToBounds(proposed, map);
    if (!this.intersectsBlockingObstacle(map, candidate, radius, allowHiding)) return candidate;
    return this.resolveSlidePosition(map, prev, proposed, radius, allowHiding);
  }

  /** Check if a position is inside any canHideInside obstacle footprint. */
  isInsideHidingSpot(pos: Vec3): boolean {
    for (const obs of this.getMap().obstacles) {
      const cfg = OBSTACLE_CONFIGS[obs.type];
      if (!cfg.canHideInside) continue;
      if (this.overlapsObstacle(pos, obs, cfg.size.x / 2, cfg.size.z / 2)) return true;
    }
    return false;
  }

  /**
   * Push a position outside any obstacle it overlaps (for hunters spawning
   * inside hiding-spot obstacles after conversion). Finds the nearest edge
   * and ejects along the shortest axis.
   */
  ejectFromObstacles(pos: Vec3, radius = this.playerRadius): Vec3 {
    const map = this.getMap();
    let out = { ...pos };

    for (const obs of map.obstacles) {
      out = this.ejectFromObstacle(out, obs, radius);
    }

    return this.clampToBounds(out, map);
  }

  private getMap(): JungleMap {
    return this.mapService.getMap(JUNGLE_MAP_ID);
  }

  private resolveSlidePosition(
    map: JungleMap,
    prev: Vec3,
    proposed: Vec3,
    radius: number,
    allowHiding: boolean,
  ): Vec3 {
    const move = this.getMoveDelta(prev, proposed);
    const testX = { x: prev.x + move.x * SLIDE_FACTOR, y: proposed.y, z: prev.z } as Vec3;
    const testZ = { x: prev.x, y: proposed.y, z: prev.z + move.z * SLIDE_FACTOR } as Vec3;
    const canX = !this.intersectsBlockingObstacle(map, testX, radius, allowHiding);
    const canZ = !this.intersectsBlockingObstacle(map, testZ, radius, allowHiding);
    if (canX && !canZ) return this.buildClampedXSlide(testX, prev, map);
    if (!canX && canZ) return this.buildClampedZSlide(testZ, prev, map);
    if (!canX && !canZ) return prev;
    return this.resolveDualAxisSlide(map, prev, proposed, move, radius, allowHiding);
  }

  private buildClampedXSlide(testX: Vec3, prev: Vec3, map: JungleMap): Vec3 {
    return { ...this.clampToBounds(testX, map), z: prev.z };
  }

  private buildClampedZSlide(testZ: Vec3, prev: Vec3, map: JungleMap): Vec3 {
    return { ...this.clampToBounds(testZ, map), x: prev.x };
  }

  private resolveDualAxisSlide(
    map: JungleMap,
    prev: Vec3,
    proposed: Vec3,
    move: { x: number; z: number },
    radius: number,
    allowHiding: boolean,
  ): Vec3 {
    const out = this.clampToBounds({
      x: prev.x + move.x * SLIDE_FACTOR,
      y: proposed.y,
      z: prev.z + move.z * SLIDE_FACTOR,
    }, map);
    if (this.intersectsBlockingObstacle(map, out, radius, allowHiding)) return prev;
    return out;
  }

  private intersectsBlockingObstacle(
    map: JungleMap,
    pos: Vec3,
    radius: number,
    allowHiding: boolean,
  ): boolean {
    for (const obs of map.obstacles) {
      const cfg = OBSTACLE_CONFIGS[obs.type];
      if (allowHiding && cfg.canHideInside) continue;
      if (this.overlapsObstacle(pos, obs, cfg.size.x / 2 + radius, cfg.size.z / 2 + radius)) return true;
    }
    return false;
  }

  private overlapsObstacle(pos: Vec3, obs: MapObstacle, halfX: number, halfZ: number): boolean {
    const dx = Math.abs(pos.x - obs.position.x);
    const dz = Math.abs(pos.z - obs.position.z);
    return dx <= halfX && dz <= halfZ;
  }

  private ejectFromObstacle(pos: Vec3, obs: MapObstacle, radius: number): Vec3 {
    const cfg = OBSTACLE_CONFIGS[obs.type];
    const halfX = cfg.size.x / 2 + radius;
    const halfZ = cfg.size.z / 2 + radius;
    const dx = pos.x - obs.position.x;
    const dz = pos.z - obs.position.z;
    if (!this.overlapsStrict(dx, dz, halfX, halfZ)) return pos;
    return this.pushOutsideObstacle(pos, obs, dx, dz, halfX, halfZ);
  }

  private overlapsStrict(dx: number, dz: number, halfX: number, halfZ: number): boolean {
    return Math.abs(dx) < halfX && Math.abs(dz) < halfZ;
  }

  private pushOutsideObstacle(
    pos: Vec3,
    obs: MapObstacle,
    dx: number,
    dz: number,
    halfX: number,
    halfZ: number,
  ): Vec3 {
    const overlapX = halfX - Math.abs(dx);
    const overlapZ = halfZ - Math.abs(dz);
    if (overlapX < overlapZ) return { ...pos, x: obs.position.x + Math.sign(dx || 1) * halfX };
    return { ...pos, z: obs.position.z + Math.sign(dz || 1) * halfZ };
  }

  private clampToBounds(pos: Vec3, map: JungleMap): Vec3 {
    return {
      x: this.clampAxis(pos.x, map.width / 2),
      y: pos.y,
      z: this.clampAxis(pos.z, map.depth / 2),
    };
  }

  private clampAxis(value: number, halfExtent: number): number {
    return Math.max(-halfExtent, Math.min(halfExtent, value));
  }

  private getMoveDelta(prev: Vec3, proposed: Vec3): { x: number; z: number } {
    return { x: proposed.x - prev.x, z: proposed.z - prev.z };
  }
}
