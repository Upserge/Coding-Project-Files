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

  private readonly mapWidth = 200;
  private readonly mapDepth = 200;

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
    const half = 90; // keep a 10-unit margin inside the 200×200 ground

    // Dense tree line along edges (every 6 units)
    for (let x = -half; x <= half; x += 6) {
      obstacles.push(this.place(id++, 'tree', x, -half, 0));
      obstacles.push(this.place(id++, 'tree', x, half, 0));
    }
    for (let z = -half + 6; z <= half - 6; z += 6) {
      obstacles.push(this.place(id++, 'tree', -half, z, 0));
      obstacles.push(this.place(id++, 'tree', half, z, 0));
    }

    // Scattered interior trees — fill the larger space
    const treePositions = [
      [-40, -30], [30, -50], [-20, 20], [50, 40], [-60, 60],
      [0, -70], [70, -20], [-70, 0], [20, 70], [-50, -60],
      [-30, 45], [60, -60], [-10, -40], [40, 10], [-75, -30],
      [10, 55], [-55, 25], [35, -35], [-25, -75], [65, 65],
      [0, 0], [-45, -10], [55, -45], [-65, 50], [25, -65],
      [75, 25], [-80, -60], [45, 75], [-35, 70], [80, -75],
    ];
    for (const [x, z] of treePositions) {
      obstacles.push(this.place(id++, 'tree', x, z, Math.random() * Math.PI));
    }

    // Bushes (hide-able) — many more for the bigger map
    const bushPositions = [
      [-30, -10], [10, -35], [-55, 40], [40, 25], [0, 5],
      [-20, 50], [60, -55], [-70, -35], [25, 75], [75, 10],
      [-45, -50], [50, -15], [-15, 65], [35, 55], [-65, -15],
      [15, -60], [-35, 30], [70, 45], [-10, -80], [80, -40],
      [-80, 20], [5, 30], [-50, -70], [55, 70], [-25, -25],
    ];
    for (const [x, z] of bushPositions) {
      obstacles.push(this.place(id++, 'bush', x, z, Math.random() * Math.PI));
    }

    // Leaf piles
    const leafPositions = [
      [-15, -20], [25, 10], [-40, -65], [55, 55], [-65, 30],
      [10, -50], [-30, 60], [70, -30], [-5, 40], [45, -70],
      [-55, -40], [30, 80], [-75, 10], [60, 15], [-20, -55],
    ];
    for (const [x, z] of leafPositions) {
      obstacles.push(this.place(id++, 'leaf_pile', x, z, 0));
    }

    // Holes
    const holePositions = [
      [-10, -55], [35, -15], [-45, 25], [10, 60],
      [-60, -20], [50, -50], [-25, 45], [75, 35],
      [0, -30], [-40, 70],
    ];
    for (const [x, z] of holePositions) {
      obstacles.push(this.place(id++, 'hole', x, z, 0));
    }

    // Abandoned vehicles — spread across the map
    obstacles.push(this.place(id++, 'jeep', -55, -45, 0.3));
    obstacles.push(this.place(id++, 'truck', 65, 50, -0.5));
    obstacles.push(this.place(id++, 'jeep', 30, -70, 1.2));
    obstacles.push(this.place(id++, 'truck', -70, 30, 0.8));
    obstacles.push(this.place(id++, 'jeep', 10, 40, -0.3));
    obstacles.push(this.place(id++, 'truck', -30, -70, 2.0));

    // Safari gear
    const gearPositions = [
      [-25, 30], [40, -30], [0, -40], [-65, -20],
      [55, 20], [-40, 55], [20, -55], [-15, 75],
      [70, -65], [-50, -55],
    ];
    for (const [x, z] of gearPositions) {
      obstacles.push(this.place(id++, 'safari_gear', x, z, Math.random() * Math.PI));
    }

    // Rocks
    const rockPositions = [
      [-35, -70], [75, -40], [-70, 75], [20, -20],
      [-60, -10], [45, 60], [-10, -65], [60, -10],
      [0, 50], [-45, 15], [30, 30], [-80, -45],
    ];
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
      [-30, -20], [30, -30], [-10, 30], [50, 10], [-50, -50],
      [0, 60], [-60, 20],
    ];
    for (const [x, z] of hiderSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hider' });
    }

    // Hunter spawns — at the edges
    const hunterSpawns = [[0, -80], [-75, 0], [75, 0]];
    for (const [x, z] of hunterSpawns) {
      points.push({ id: `spawn_${id++}`, position: { x, y: 0, z }, forRole: 'hunter' });
    }

    // Item spawns — spread across the larger map
    const itemSpawns = [
      [-20, -40], [20, -10], [-40, 20], [40, -40], [0, 40],
      [-25, -60], [60, 20], [-60, -20], [10, 50], [70, -10],
      [-10, -75], [50, 70], [-70, 50], [25, -60], [-40, 70],
      [30, 50], [-55, -35], [65, -55], [-15, 15], [45, -20],
      [-75, 40], [10, -30], [-30, -10], [55, 35], [-5, 65],
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
