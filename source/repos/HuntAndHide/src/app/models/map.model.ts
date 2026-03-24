/** Map and obstacle type definitions. No dependencies on other models. */

export type ObstacleType =
  | 'tree'
  | 'bush'
  | 'leaf_pile'
  | 'hole'
  | 'sedan'
  | 'safari_gear'
  | 'rock';

export type DecorationType =
  | 'fern'
  | 'flower'
  | 'mushroom_cluster'
  | 'fallen_log'
  | 'vine';

export type WaterFeatureType = 'pond' | 'stream';

export interface ObstacleConfig {
  type: ObstacleType;
  /** Width/depth footprint in world-units for collision. */
  size: { x: number; z: number };
  /** Whether hiders can hide inside/behind this obstacle. */
  canHideInside: boolean;
  /** Whether this obstacle blocks projectile line-of-sight. */
  blocksProjectiles: boolean;
}

export interface ObstaclePlacement {
  id: string;
  type: ObstacleType;
  position: { x: number; y: number; z: number };
  rotationY: number;
}

export interface DecorationPlacement {
  id: string;
  type: DecorationType;
  position: { x: number; y: number; z: number };
  rotationY: number;
  scale: number;
}

export interface WaterPlacement {
  id: string;
  type: WaterFeatureType;
  position: { x: number; y: number; z: number };
  rotationY: number;
  /** For ponds: radius. For streams: length. */
  size: number;
}

export interface SpawnPoint {
  id: string;
  position: { x: number; y: number; z: number };
  forRole: 'hunter' | 'hider' | 'item';
}

export interface MapConfig {
  id: string;
  displayName: string;
  /** World-unit dimensions of the playable area. */
  width: number;
  depth: number;
  obstacles: ObstaclePlacement[];
  decorations: DecorationPlacement[];
  waterFeatures: WaterPlacement[];
  spawnPoints: SpawnPoint[];
}

export const OBSTACLE_CONFIGS: Record<ObstacleType, ObstacleConfig> = {
  tree:        { type: 'tree',        size: { x: 1.5, z: 1.5 }, canHideInside: false, blocksProjectiles: true },
  bush:        { type: 'bush',        size: { x: 2,   z: 2   }, canHideInside: true,  blocksProjectiles: false },
  leaf_pile:   { type: 'leaf_pile',   size: { x: 2,   z: 2   }, canHideInside: true,  blocksProjectiles: false },
  hole:        { type: 'hole',        size: { x: 1.5, z: 1.5 }, canHideInside: true,  blocksProjectiles: false },
  sedan:       { type: 'sedan',       size: { x: 2.5, z: 5   }, canHideInside: true,  blocksProjectiles: true },
  safari_gear: { type: 'safari_gear', size: { x: 1,   z: 1   }, canHideInside: false, blocksProjectiles: false },
  rock:        { type: 'rock',        size: { x: 2,   z: 2   }, canHideInside: false, blocksProjectiles: true },
};
