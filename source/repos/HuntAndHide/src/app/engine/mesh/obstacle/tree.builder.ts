import * as THREE from 'three';
import { buildBarkNormalMap } from '../procedural-normal.builder';

/** Palette for jungle trees. */
const TRUNK_COLOR = 0x5d4037;
const TRUNK_DARK = 0x4e342e;
const CANOPY_BASE = 0x2e7d32;
const CANOPY_MID = 0x388e3c;
const CANOPY_TOP = 0x1b5e20;

/** Shared bark normal map (generated once, reused across tree instances). */
let barkNormal: THREE.CanvasTexture | null = null;
function getBarkNormal(): THREE.CanvasTexture {
  barkNormal ??= buildBarkNormalMap(128);
  return barkNormal;
}

/** Build a multi-part jungle tree (trunk + layered canopy). */
export function buildTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildTrunk());
  group.add(buildCanopyLayer(CANOPY_BASE, 1.8, 2.4, 1.2));
  group.add(buildCanopyLayer(CANOPY_MID, 1.4, 3.8, 1.6));
  group.add(buildCanopyLayer(CANOPY_TOP, 0.9, 5.0, 1.2));
  group.add(buildTrunkKnot());
  return group;
}

function buildTrunk(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.25, 0.4, 3.5, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: TRUNK_COLOR,
    roughness: 0.95,
    normalMap: getBarkNormal(),
    normalScale: new THREE.Vector2(0.8, 0.8),
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.75;
  mesh.castShadow = true;
  return mesh;
}

function buildCanopyLayer(color: number, radius: number, y: number, height: number): THREE.Mesh {
  const geo = new THREE.ConeGeometry(radius, height, 7);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  mesh.castShadow = true;
  return mesh;
}

function buildTrunkKnot(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.15, 5, 5);
  const mat = new THREE.MeshStandardMaterial({ color: TRUNK_DARK, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.2, 1.2, 0.15);
  return mesh;
}
