/** Map and obstacle type definitions. No dependencies on other models. */

export type ObstacleType =
  | 'tree'
  | 'bush'
  | 'leaf_pile'
  | 'hole'
  | 'sedan'
  | 'safari_gear'
  | 'rock'
  | 'tent'
  | 'picnic_scene';

export type DecorationType =
  | 'fern'
  | 'flower'
  | 'mushroom_cluster'
  | 'fallen_log'
  | 'vine';

export type WaterFeatureType = 'pond';

export interface ObstacleConfig {
  type: ObstacleType;
  /** Width/depth footprint in world-units for collision. */
  size: { x: number; z: number };
  /** Whether hiders can hide inside/behind this obstacle. */
  canHideInside: boolean;
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
  /** Radius of the pond in world units. */
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
  tree:          { type: 'tree',          size: { x: 1.5, z: 1.5 }, canHideInside: false },
  bush:          { type: 'bush',          size: { x: 2,   z: 2   }, canHideInside: true  },
  leaf_pile:     { type: 'leaf_pile',     size: { x: 2,   z: 2   }, canHideInside: true  },
  hole:          { type: 'hole',          size: { x: 1.5, z: 1.5 }, canHideInside: true  },
  sedan:         { type: 'sedan',         size: { x: 2.5, z: 5   }, canHideInside: true  },
  safari_gear:   { type: 'safari_gear',   size: { x: 1,   z: 1   }, canHideInside: false },
  rock:          { type: 'rock',          size: { x: 2,   z: 2   }, canHideInside: false },
  tent:          { type: 'tent',          size: { x: 3,   z: 3   }, canHideInside: true  },
  picnic_scene:  { type: 'picnic_scene',  size: { x: 4,   z: 4   }, canHideInside: false },
};
