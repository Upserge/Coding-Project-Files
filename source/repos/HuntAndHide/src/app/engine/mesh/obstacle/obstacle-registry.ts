import * as THREE from 'three';
import { ObstacleType } from '../../../models/map.model';
import { buildTreeMesh, buildBushMesh, buildTentMesh, buildPicnicSceneMesh, buildLeafPileMesh } from './foliage.builder';
import { buildRockMesh } from './rock.builder';
import { buildVehicleMesh } from './vehicle.builder';
import { buildHoleMesh } from './hole.builder';
import { buildSafariGearMesh } from './safari-gear.builder';

/** Map-based dispatch — each ObstacleType resolves to a builder function. */
const OBSTACLE_BUILDERS: Record<ObstacleType, () => THREE.Group> = {
  tree:          buildTreeMesh,
  bush:          buildBushMesh,
  rock:          buildRockMesh,
  sedan:         () => buildVehicleMesh('sedan'),
  hole:          buildHoleMesh,
  leaf_pile:     buildLeafPileMesh,
  safari_gear:   buildSafariGearMesh,
  tent:          buildTentMesh,
  picnic_scene:  buildPicnicSceneMesh,
};

/** Look up and invoke the builder for the given obstacle type. */
export function buildObstacleMesh(type: ObstacleType): THREE.Group | null {
  const builder = OBSTACLE_BUILDERS[type];
  return builder ? builder() : null;
}
