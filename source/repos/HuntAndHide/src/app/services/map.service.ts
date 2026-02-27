import { Injectable } from '@angular/core';
import {
  MapConfig,
  ObstaclePlacement,
  SpawnPoint,
  ObstacleType,
} from '../models/map.model';

/**
 * MapService generates and provides the jungle map layout.
 * Obstacle positions are deterministic per map ID so all clients agree.
 */
@Injectable({ providedIn: 'root' })
export class MapService {

  private readonly mapWidth = 60;
  private readonly mapDepth = 60;

  // ── Map generation ─────────────────────────────────────────

  /** Build the default jungle map. */
  generateJungleMap(): MapConfig {
    return {
      id: 'jungle',
      displayName: 'Jungle',
      width: this.mapWidth,
      depth: this.mapDepth,
      obstacles: this.generateObstacles(),
      spawnPoints: this.generateSpawnPoints(),
    };
  }

  getMap(mapId: string): MapConfig {
    // Only one map for now
    if (mapId === 'jungle') return this.generateJungleMap();
    return this.generateJungleMap();
  }

  // ── Obstacle placement ─────────────────────────────────────

  private generateObstacles(): ObstaclePlacement[] {
    const obstacles: ObstaclePlacement[] = [];
    let id = 0;

    // Dense tree line along edges
    for (let x = -25; x <= 25; x += 5) {
      obstacles.push(this.place(id++, 'tree', x, -25, 0));
      obstacles.push(this.place(id++, 'tree', x, 25, 0));
    }
    for (let z = -20; z <= 20; z += 5) {
      obstacles.push(this.place(id++, 'tree', -25, z, 0));
      obstacles.push(this.place(id++, 'tree', 25, z, 0));
    }

    // Scattered interior trees
    const treePositions = [
      [-10, -8], [8, -12], [-5, 5], [12, 10], [-15, 15],
      [0, -18], [18, -5], [-18, 0], [5, 18], [-12, -15],
    ];
    for (const [x, z] of treePositions) {
      obstacles.push(this.place(id++, 'tree', x, z, Math.random() * Math.PI));
    }

    // Bushes (hide-able)
    const bushPositions = [
      [-8, -3], [3, -9], [-14, 10], [10, 7], [0, 0],
      [-6, 12], [15, -15], [-20, -10], [7, 20], [20, 3],
    ];
    for (const [x, z] of bushPositions) {
      obstacles.push(this.place(id++, 'bush', x, z, Math.random() * Math.PI));
    }

    // Leaf piles
    const leafPositions = [[-4, -6], [6, 3], [-10, -18], [14, 14], [-17, 8]];
    for (const [x, z] of leafPositions) {
      obstacles.push(this.place(id++, 'leaf_pile', x, z, 0));
    }

    // Holes
    const holePositions = [[-2, -14], [9, -4], [-12, 6], [3, 15]];
    for (const [x, z] of holePositions) {
      obstacles.push(this.place(id++, 'hole', x, z, 0));
    }

    // Abandoned vehicles
    obstacles.push(this.place(id++, 'jeep', -16, -12, 0.3));
    obstacles.push(this.place(id++, 'truck', 17, 12, -0.5));
    obstacles.push(this.place(id++, 'jeep', 8, -20, 1.2));

    // Safari gear
    const gearPositions = [[-7, 8], [11, -8], [0, -11], [-19, -5]];
    for (const [x, z] of gearPositions) {
      obstacles.push(this.place(id++, 'safari_gear', x, z, Math.random() * Math.PI));
    }

    // Rocks
    const rockPositions = [[-9, -20], [20, -10], [-20, 20], [5, -5]];
    for (const [x, z] of rockPositions) {
      obstacles.push(this.place(id++, 'rock', x, z, Math.random() * Math.PI));
    }

    return obstacles;
  }

  // ── Spawn points ───────────────────────────────────────────

  private generateSpawnPoints(): SpawnPoint[] {
    const points: SpawnPoint[] = [];
    let id = 0;

    // Hider spawns — scattered around the interior
    const hiderSpawns = [
      [-8, -5], [8, -8], [-3, 8], [12, 3], [-12, -12],
      [0, 15], [-15, 5],
    ];
    for (const [x, z] of hiderSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hider' });
    }

    // Hunter spawns — at the edges
    const hunterSpawns = [[0, -22], [-20, 0], [20, 0]];
    for (const [x, z] of hunterSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hunter' });
    }

    // Item spawns — spread evenly
    const itemSpawns = [
      [-5, -10], [5, -3], [-10, 5], [10, -10], [0, 10],
      [-7, -15], [15, 5], [-15, -5], [3, 12], [18, -3],
      [-3, -20], [12, 18], [-18, 12], [7, -15], [-10, 18],
    ];
    for (const [x, z] of itemSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'item' });
    }

    return points;
  }

  // ── Helpers ────────────────────────────────────────────────

  private place(id: number, type: ObstacleType, x: number, z: number, rotY: number): ObstaclePlacement {
    return {
      id: `obs_${id}`,
      type,
      position: { x, y: 0, z },
      rotationY: rotY,
    };
  }
}
