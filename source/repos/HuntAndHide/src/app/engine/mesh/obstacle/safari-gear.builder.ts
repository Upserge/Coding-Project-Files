import * as THREE from 'three';

/** Palette for abandoned safari gear. */
const CRATE_COLOR = 0xa1887f;
const STRAP_COLOR = 0x5d4037;
const METAL_COLOR = 0x9e9e9e;

/** Build a small crate with strap and buckle detail. */
export function buildSafariGearMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildCrate());
  group.add(buildStrap());
  group.add(buildBuckle());
  return group;
}

function buildCrate(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
  const mat = new THREE.MeshStandardMaterial({ color: CRATE_COLOR, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.2;
  mesh.castShadow = true;
  return mesh;
}

function buildStrap(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.65, 0.06, 0.08);
  const mat = new THREE.MeshStandardMaterial({ color: STRAP_COLOR, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0.32, 0);
  return mesh;
}

function buildBuckle(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.1, 0.08, 0.1);
  const mat = new THREE.MeshStandardMaterial({ color: METAL_COLOR, metalness: 0.5, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.2, 0.33, 0);
  return mesh;
}
