import * as THREE from 'three';

/** Palette for ground holes. */
const HOLE_COLOR = 0x3e2723;
const RIM_COLOR = 0x5d4037;
const DIRT_COLOR = 0x795548;

/** Build a ground hole with rim and loose dirt accents. */
export function buildHoleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildHoleDisc());
  group.add(buildRim());
  addDirtMounds(group);
  return group;
}

function buildHoleDisc(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12);
  const mat = new THREE.MeshStandardMaterial({ color: HOLE_COLOR, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.02;
  return mesh;
}

function buildRim(): THREE.Mesh {
  const geo = new THREE.TorusGeometry(0.85, 0.12, 6, 16);
  const mat = new THREE.MeshStandardMaterial({ color: RIM_COLOR, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

function addDirtMounds(group: THREE.Group): void {
  const geo = new THREE.SphereGeometry(0.18, 5, 4);
  const mat = new THREE.MeshStandardMaterial({ color: DIRT_COLOR, roughness: 1 });
  const offsets = [[0.7, 0.05, 0.5], [-0.6, 0.04, -0.6], [0.9, 0.03, -0.2]];
  for (const [x, y, z] of offsets) {
    const mound = new THREE.Mesh(geo, mat);
    mound.position.set(x, y, z);
    mound.scale.set(1.5, 0.5, 1.2);
    group.add(mound);
  }
}
