import * as THREE from 'three';
import { ObstacleType } from '../../../models/map.model';
import { buildTreeMesh } from './tree.builder';
import { buildBushMesh } from './bush.builder';
import { buildRockMesh } from './rock.builder';
import { buildVehicleMesh } from './vehicle.builder';
import { buildHoleMesh } from './hole.builder';
import { buildLeafPileMesh } from './leaf-pile.builder';
import { buildSafariGearMesh } from './safari-gear.builder';

/** Map-based dispatch — each ObstacleType resolves to a builder function. */
const OBSTACLE_BUILDERS: Record<ObstacleType, () => THREE.Group> = {
  tree:        buildTreeMesh,
  bush:        buildBushMesh,
  rock:        buildRockMesh,
  jeep:        () => buildVehicleMesh('jeep'),
  truck:       () => buildVehicleMesh('truck'),
  hole:        buildHoleMesh,
  leaf_pile:   buildLeafPileMesh,
  safari_gear: buildSafariGearMesh,
};

/** Look up and invoke the builder for the given obstacle type. */
export function buildObstacleMesh(type: ObstacleType): THREE.Group | null {
  const builder = OBSTACLE_BUILDERS[type];
  return builder ? builder() : null;
}
