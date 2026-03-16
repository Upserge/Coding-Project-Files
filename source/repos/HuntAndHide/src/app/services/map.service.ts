import { Injectable } from '@angular/core';
import {
  MapConfig,
  ObstaclePlacement,
  SpawnPoint,
  ObstacleType,
  DecorationPlacement,
  DecorationType,
  WaterPlacement,
} from '../models/map.model';

// ── Placement distribution table ─────────────────────────────
// Each entry defines how many of a given obstacle type to spawn,
// the minimum spacing between same-type instances (minSpacing),
// and the minimum clearance from all previously placed objects (crossTypeSpacing).

interface PlacementSpec {
  count: number;
  minSpacing: number;
  crossTypeSpacing: number;
  rotationRange: number;
}

const OBSTACLE_DISTRIBUTION: Record<ObstacleType, PlacementSpec> = {
  tree:        { count: 55, minSpacing: 8,  crossTypeSpacing: 5,  rotationRange: Math.PI * 2 },
  bush:        { count: 55, minSpacing: 7,  crossTypeSpacing: 4,  rotationRange: Math.PI * 2 },
  leaf_pile:   { count: 30, minSpacing: 8,  crossTypeSpacing: 4,  rotationRange: Math.PI * 2 },
  hole:        { count: 20, minSpacing: 10, crossTypeSpacing: 5,  rotationRange: 0 },
  jeep:        { count: 4,  minSpacing: 30, crossTypeSpacing: 6,  rotationRange: Math.PI * 2 },
  truck:       { count: 3,  minSpacing: 30, crossTypeSpacing: 6,  rotationRange: Math.PI * 2 },
  safari_gear: { count: 10, minSpacing: 12, crossTypeSpacing: 4,  rotationRange: Math.PI * 2 },
  rock:        { count: 14, minSpacing: 10, crossTypeSpacing: 5,  rotationRange: Math.PI * 2 },
};

const DECORATION_WEIGHTS: { type: DecorationType; weight: number }[] = [
  { type: 'fern',             weight: 3 },
  { type: 'flower',           weight: 2 },
  { type: 'mushroom_cluster', weight: 1 },
  { type: 'fallen_log',       weight: 1 },
  { type: 'vine',             weight: 1 },
];

/**
 * MapService generates and provides the jungle map layout.
 * All placement uses Poisson-disc–style scatter with minimum-distance
 * enforcement so objects are spread out and never overlap.
 */
@Injectable({ providedIn: 'root' })
export class MapService {

  private readonly mapWidth = 200;
  private readonly mapDepth = 200;

  /** Cached map — generated once, reused for collision and rendering. */
  private cachedMap: MapConfig | null = null;

  // ── Map generation ─────────────────────────────────────────

  /** Build the default jungle map (generates once, then caches). */
  generateJungleMap(): MapConfig {
    this.cachedMap ??= {
      id: 'jungle',
      displayName: 'Jungle',
      width: this.mapWidth,
      depth: this.mapDepth,
      obstacles: this.generateObstacles(),
      decorations: this.generateDecorations(),
      waterFeatures: this.generateWaterFeatures(),
      spawnPoints: this.generateSpawnPoints(),
    };
    return this.cachedMap;
  }

  getMap(mapId: string): MapConfig {
    return this.generateJungleMap();
  }

  /** Clear cached map so the next call regenerates a fresh layout. */
  resetMap(): void {
    this.cachedMap = null;
  }

  // ── Obstacle placement ─────────────────────────────────────

  private generateObstacles(): ObstaclePlacement[] {
    const obstacles: ObstaclePlacement[] = [];
    const allPositions: [number, number][] = [];
    const margin = 10;
    const halfW = this.mapWidth / 2 - margin;
    const halfD = this.mapDepth / 2 - margin;
    let id = 0;

    // Process each obstacle type from the distribution table
    const types = Object.keys(OBSTACLE_DISTRIBUTION) as ObstacleType[];
    for (const type of types) {
      const spec = OBSTACLE_DISTRIBUTION[type];
      const positions = poissonDiscScatter(
        spec.count, halfW, halfD, spec.minSpacing, allPositions, spec.crossTypeSpacing,
      );
      for (const [x, z] of positions) {
        allPositions.push([x, z]);
        const rotY = spec.rotationRange > 0
          ? Math.random() * spec.rotationRange
          : 0;
        obstacles.push({
          id: `obs_${id++}`,
          type,
          position: { x, y: 0, z },
          rotationY: rotY,
        });
      }
    }

    return obstacles;
  }

  // ── Spawn points ───────────────────────────────────────────

  private generateSpawnPoints(): SpawnPoint[] {
    const points: SpawnPoint[] = [];
    let id = 0;

    // Hider spawns — scattered around the interior
    const hiderPositions = poissonDiscScatter(7, 60, 60, 15, []);
    for (const [x, z] of hiderPositions) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hider' });
    }

    // Hunter spawns — at the edges
    const hunterSpawns: [number, number][] = [[0, -80], [-75, 0], [75, 0]];
    for (const [x, z] of hunterSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hunter' });
    }

    // Item spawns — spread across the larger map
    const itemPositions = poissonDiscScatter(25, 75, 75, 10, []);
    for (const [x, z] of itemPositions) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'item' });
    }

    return points;
  }

  // ── Decorations (non-collidable visual scatter) ────────────

  private generateDecorations(): DecorationPlacement[] {
    const decorations: DecorationPlacement[] = [];
    const weightedPool = buildWeightedPool(DECORATION_WEIGHTS);
    const positions = poissonDiscScatter(120, 85, 85, 3, []);
    let id = 0;

    for (const [x, z] of positions) {
      const type = weightedPool[Math.floor(Math.random() * weightedPool.length)];
      const scale = 0.8 + Math.random() * 0.5;
      decorations.push({
        id: `deco_${id++}`,
        type,
        position: { x, y: 0, z },
        rotationY: Math.random() * Math.PI * 2,
        scale,
      });
    }
    return decorations;
  }

  // ── Water features ────────────────────────────────────────

  private generateWaterFeatures(): WaterPlacement[] {
    const features: WaterPlacement[] = [];
    let id = 0;
    const pondPositions = poissonDiscScatter(4, 65, 65, 25, []);
    for (const [x, z] of pondPositions) {
      const size = 3.5 + Math.random() * 3;
      features.push({
        id: `water_${id++}`,
        type: 'pond',
        position: { x, y: 0, z },
        rotationY: 0,
        size,
      });
    }

    const streamPositions = poissonDiscScatter(2, 50, 50, 30, pondPositions);
    for (const [x, z] of streamPositions) {
      features.push({
        id: `water_${id++}`,
        type: 'stream',
        position: { x, y: 0, z },
        rotationY: Math.random() * Math.PI,
        size: 10 + Math.random() * 4,
      });
    }

    return features;
  }
}

// ── Scatter utilities (module-level, pure functions) ─────────

/**
 * Poisson-disc–style scatter: generates up to `count` random positions
 * within [−halfW..halfW] × [−halfD..halfD].
 *
 * Newly placed points enforce `minDist` between each other.
 * Previously placed `existing` points enforce `minDistExisting`
 * (defaults to `minDist` when omitted).
 */
function poissonDiscScatter(
  count: number,
  halfW: number,
  halfD: number,
  minDist: number,
  existing: [number, number][],
  minDistExisting: number = minDist,
): [number, number][] {
  const result: [number, number][] = [];
  const minDistSq = minDist * minDist;
  const crossDistSq = minDistExisting * minDistExisting;
  const maxAttempts = count * 30;
  let attempts = 0;

  while (result.length < count && attempts < maxAttempts) {
    attempts++;
    const x = (Math.random() - 0.5) * halfW * 2;
    const z = (Math.random() - 0.5) * halfD * 2;

    // Check against previously placed cross-type positions
    const tooCloseExisting = existing.some(([ex, ez]) => {
      const dx = x - ex;
      const dz = z - ez;
      return dx * dx + dz * dz < crossDistSq;
    });
    // Check against same-batch positions (same type)
    const tooCloseSameType = result.some(([rx, rz]) => {
      const dx = x - rx;
      const dz = z - rz;
      return dx * dx + dz * dz < minDistSq;
    });

    if (!tooCloseExisting && !tooCloseSameType) {
      result.push([x, z]);
    }
  }

  return result;
}

/** Expand a weighted spec array into a flat pool for uniform random pick. */
function buildWeightedPool(weights: { type: DecorationType; weight: number }[]): DecorationType[] {
  const pool: DecorationType[] = [];
  for (const entry of weights) {
    for (let i = 0; i < entry.weight; i++) {
      pool.push(entry.type);
    }
  }
  return pool;
}
