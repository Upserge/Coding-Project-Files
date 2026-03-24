import * as THREE from 'three';
import { GlbLoaderService } from '../glb-loader.service';
import { VEHICLE_MODEL_DEF, VEHICLE_VARIANT_KEYS, VehicleModelDef } from '../vehicle-model.config';

/** Module-level loader reference, set once via initVehicleLoader(). */
let loader: GlbLoaderService | null = null;

/** Call once before any buildVehicleMesh() usage to wire the GLB cache. */
export function initVehicleLoader(service: GlbLoaderService): void {
  loader = service;
}

/** Build a vehicle mesh by cloning a random preloaded sedan variant. */
export function buildVehicleMesh(_type: string): THREE.Group {
  const def = VEHICLE_MODEL_DEF;
  const clone = loader?.getModel(pickRandomVariant());
  if (!clone) return buildFallbackBox(def);

  normaliseScale(clone, def);
  centerAndGround(clone);
  applyRotationOffset(clone, def);
  return clone;
}

function pickRandomVariant(): string {
  return VEHICLE_VARIANT_KEYS[Math.floor(Math.random() * VEHICLE_VARIANT_KEYS.length)];
}

function normaliseScale(group: THREE.Group, def: VehicleModelDef): void {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const scaleX = def.width / Math.max(size.x, 0.001);
  const scaleY = def.height / Math.max(size.y, 0.001);
  const scaleZ = def.depth / Math.max(size.z, 0.001);
  const uniform = Math.min(scaleX, scaleY, scaleZ);
  group.scale.setScalar(uniform);
}

/**
 * Recenter children so the bounding box is centred on XZ origin
 * with the bottom at Y = 0. Compensates for arbitrary node
 * translations baked into the GLB (e.g. scene-sheet offsets).
 *
 * Child positions live in the group's local space, so the
 * world-space bounding-box center must be converted back to
 * local space (dividing by the group's scale) before adjusting.
 */
function centerAndGround(group: THREE.Group): void {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const s = group.scale;
  for (const child of group.children) {
    child.position.x -= center.x / s.x;
    child.position.y -= box.min.y / s.y;
    child.position.z -= center.z / s.z;
  }
}

function applyRotationOffset(group: THREE.Group, def: VehicleModelDef): void {
  if (def.rotationOffset === 0) return;
  group.rotation.y = def.rotationOffset;
}

/** Minimal placeholder shown when the GLB hasn't loaded yet. */
function buildFallbackBox(def: VehicleModelDef): THREE.Group {
  const geo = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = def.height * 0.5;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}
