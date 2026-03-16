import * as THREE from 'three';
import { buildBarkNormalMap } from '../procedural-normal.builder';

/** Palette for jungle trees. */
const TRUNK_COLOR = 0x5d4037;
const TRUNK_DARK = 0x4e342e;
const CANOPY_BASE = 0x2e7d32;
const CANOPY_MID = 0x388e3c;
const CANOPY_TOP = 0x1b5e20;
const VINE_COLOR = 0x33691e;
const ROOT_COLOR = 0x4e342e;

/** Shared bark normal map (generated once, reused across tree instances). */
let barkNormal: THREE.CanvasTexture | null = null;
function getBarkNormal(): THREE.CanvasTexture {
  barkNormal ??= buildBarkNormalMap(128);
  return barkNormal;
}

/** Cached canopy materials keyed by colour. */
const canopyMatCache = new Map<number, THREE.MeshStandardMaterial>();
function getCanopyMat(color: number): THREE.MeshStandardMaterial {
  let m = canopyMatCache.get(color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 }); canopyMatCache.set(color, m); }
  return m;
}

let _knotGeo: THREE.SphereGeometry | null = null;
let _knotMat: THREE.MeshStandardMaterial | null = null;
function getKnotGeo(): THREE.SphereGeometry { return _knotGeo ??= new THREE.SphereGeometry(0.15, 5, 5); }
function getKnotMat(): THREE.MeshStandardMaterial { return _knotMat ??= new THREE.MeshStandardMaterial({ color: TRUNK_DARK, roughness: 1 }); }

let _rootGeo: THREE.ConeGeometry | null = null;
let _rootMat: THREE.MeshStandardMaterial | null = null;
function getRootGeo(): THREE.ConeGeometry { return _rootGeo ??= new THREE.ConeGeometry(0.12, 0.6, 4); }
function getRootMat(): THREE.MeshStandardMaterial {
  return _rootMat ??= new THREE.MeshStandardMaterial({
    color: ROOT_COLOR, roughness: 0.95, normalMap: getBarkNormal(), normalScale: new THREE.Vector2(0.6, 0.6),
  });
}

let _vineMat: THREE.MeshStandardMaterial | null = null;
function getVineMat(): THREE.MeshStandardMaterial { return _vineMat ??= new THREE.MeshStandardMaterial({ color: VINE_COLOR, roughness: 0.85 }); }

/** Build a multi-part jungle tree with randomized variation. */
export function buildTreeMesh(): THREE.Group {
  const group = new THREE.Group();

  // Randomized trunk height and canopy size for variety
  const trunkH = 3.0 + Math.random() * 1.2;
  const canopyScale = 0.85 + Math.random() * 0.35;
  const lean = (Math.random() - 0.5) * 0.08;

  group.add(buildTrunk(trunkH, lean));
  group.add(buildTrunkKnot(trunkH));

  // Layered canopy with per-tree randomness
  const baseY = trunkH * 0.55;
  group.add(buildCanopyLayer(CANOPY_BASE, 1.8 * canopyScale, baseY, 1.2 * canopyScale));
  group.add(buildCanopyLayer(CANOPY_MID,  1.4 * canopyScale, baseY + 1.6, 1.6 * canopyScale));
  group.add(buildCanopyLayer(CANOPY_TOP,  0.9 * canopyScale, baseY + 2.8, 1.2 * canopyScale));

  // Root buttresses at base
  addRootButtresses(group);

  // Hanging vines (50% chance per tree for variety)
  if (Math.random() > 0.5) {
    addHangingVines(group, baseY + 1.0);
  }

  return group;
}

function buildTrunk(height: number, lean: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.22, 0.42, height, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: TRUNK_COLOR,
    roughness: 0.95,
    normalMap: getBarkNormal(),
    normalScale: new THREE.Vector2(0.8, 0.8),
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.rotation.z = lean;
  mesh.castShadow = true;
  return mesh;
}

function buildCanopyLayer(color: number, radius: number, y: number, height: number): THREE.Mesh {
  const geo = new THREE.ConeGeometry(radius, height, 7);
  const mesh = new THREE.Mesh(geo, getCanopyMat(color));
  mesh.position.y = y;
  // Slight random rotation for asymmetry
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = true;
  return mesh;
}

function buildTrunkKnot(trunkH: number): THREE.Mesh {
  const mesh = new THREE.Mesh(getKnotGeo(), getKnotMat());
  const knotY = 0.8 + Math.random() * (trunkH * 0.4);
  const angle = Math.random() * Math.PI * 2;
  mesh.position.set(Math.cos(angle) * 0.25, knotY, Math.sin(angle) * 0.25);
  return mesh;
}

/** Flared root buttresses at the trunk base. */
function addRootButtresses(group: THREE.Group): void {
  const count = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const root = new THREE.Mesh(getRootGeo(), getRootMat());
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    root.position.set(Math.cos(angle) * 0.35, 0.15, Math.sin(angle) * 0.35);
    root.rotation.z = Math.cos(angle) * 0.6;
    root.rotation.x = Math.sin(angle) * 0.6;
    group.add(root);
  }
}

/** Thin cylinder vines dangling from canopy. */
function addHangingVines(group: THREE.Group, canopyY: number): void {
  const vineCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < vineCount; i++) {
    const length = 0.8 + Math.random() * 1.5;
    const geo = new THREE.CylinderGeometry(0.015, 0.02, length, 4);
    const vine = new THREE.Mesh(geo, getVineMat());
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.6 + Math.random() * 0.8;
    vine.position.set(
      Math.cos(angle) * radius,
      canopyY - length / 2,
      Math.sin(angle) * radius,
    );
    vine.rotation.z = (Math.random() - 0.5) * 0.2;
    group.add(vine);
  }
}
