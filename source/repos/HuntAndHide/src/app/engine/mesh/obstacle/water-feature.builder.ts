import * as THREE from 'three';
import { GlbLoaderService } from '../glb-loader.service';
import { WaterModelDef, POND_MODEL_DEF } from '../water-model.config';

/** Module-level loader reference, set once via initWaterLoader(). */
let loader: GlbLoaderService | null = null;

/** Call once before any water-feature build usage to wire the GLB cache. */
export function initWaterLoader(service: GlbLoaderService): void {
  loader = service;
}

/** Build a pond mesh scaled to the given placement size. */
export function buildWaterFeatureMesh(size: number): THREE.Group {
  return buildFromModel('pond', POND_MODEL_DEF, size);
}

// ── Shared pipeline ──────────────────────────────────────────

function buildFromModel(key: string, def: WaterModelDef, size: number): THREE.Group {
  const clone = loader?.getModel(key);
  if (!clone) return buildFallbackBox(def);

  normaliseScale(clone, size);
  centerAndGround(clone);
  return clone;
}

/**
 * Uniformly scale the model so its longest horizontal axis matches
 * the placement size.  Preserves the model's native proportions.
 */
function normaliseScale(group: THREE.Group, size: number): void {
  const box = new THREE.Box3().setFromObject(group);
  const modelSize = box.getSize(new THREE.Vector3());
  const longest = Math.max(modelSize.x, modelSize.z, 0.001);
  group.scale.setScalar(size / longest);
}

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

function buildFallbackBox(def: WaterModelDef): THREE.Group {
  const geo = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a9fd6, transparent: true, opacity: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = def.height * 0.5;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}
