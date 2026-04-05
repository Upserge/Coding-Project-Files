import * as THREE from 'three';
import { GlbLoaderService } from '../glb-loader.service';
import {
  FoliageModelDef,
  TREE_MODEL_DEF, TREE_VARIANT_KEYS,
  BUSH_MODEL_DEF, BUSH_VARIANT_KEYS,
  TENT_MODEL_DEF,
  PICNIC_MODEL_DEF,
  LEAF_PILE_MODEL_DEF,
} from '../foliage-model.config';

/** Module-level loader reference, set once via initFoliageLoader(). */
let loader: GlbLoaderService | null = null;

/** Call once before any foliage build usage to wire the GLB cache. */
export function initFoliageLoader(service: GlbLoaderService): void {
  loader = service;
}

// ── Public builders ──────────────────────────────────────────

export function buildTreeMesh(): THREE.Group {
  return buildFromPool(TREE_VARIANT_KEYS, TREE_MODEL_DEF, 0.8, 1.3);
}

export function buildBushMesh(): THREE.Group {
  return buildFromPool(BUSH_VARIANT_KEYS, BUSH_MODEL_DEF, 0.85, 1.2);
}

export function buildTentMesh(): THREE.Group {
  return buildFromPool(['tent'], TENT_MODEL_DEF, 0.9, 1.1);
}

export function buildPicnicSceneMesh(): THREE.Group {
  return buildFromPool(['picnic_scene'], PICNIC_MODEL_DEF, 0.8, 1.2);
}

export function buildLeafPileMesh(): THREE.Group {
  return buildFromPool(['leaf_pile'], LEAF_PILE_MODEL_DEF, 1.0, 1.4);
}

// ── Shared pipeline ──────────────────────────────────────────

function buildFromPool(
  keys: string[],
  def: FoliageModelDef,
  scaleMin: number,
  scaleMax: number,
): THREE.Group {
  const key = keys[Math.floor(Math.random() * keys.length)];
  const clone = loader?.getModel(key);
  if (!clone) return buildFallbackBox(def);

  normaliseScale(clone, def);
  centerAndGround(clone);
  applyRandomScale(clone, scaleMin, scaleMax);
  return clone;
}

function normaliseScale(group: THREE.Group, def: FoliageModelDef): void {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const sx = def.width / Math.max(size.x, 0.001);
  const sy = def.height / Math.max(size.y, 0.001);
  const sz = def.depth / Math.max(size.z, 0.001);
  group.scale.setScalar(Math.min(sx, sy, sz));
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

function applyRandomScale(group: THREE.Group, min: number, max: number): void {
  const factor = min + Math.random() * (max - min);
  group.scale.multiplyScalar(factor);
}

function buildFallbackBox(def: FoliageModelDef): THREE.Group {
  const geo = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = def.height * 0.5;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}
