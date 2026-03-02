import * as THREE from 'three';

/** Palette for leaf piles. */
const LEAF_BROWN = 0x8d6e63;
const LEAF_ORANGE = 0xcc8033;
const LEAF_GREEN = 0x6d8b3a;

/** Build a leafy pile from stacked flat discs with color variation. */
export function buildLeafPileMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildLayer(LEAF_BROWN, 1.5, 0.08, 0.04));
  group.add(buildLayer(LEAF_ORANGE, 1.2, 0.10, 0.14));
  group.add(buildLayer(LEAF_GREEN, 0.8, 0.06, 0.22));
  addScatteredLeaves(group);
  return group;
}

function buildLayer(color: number, radius: number, height: number, y: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius * 0.85, radius, height, 8);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

function addScatteredLeaves(group: THREE.Group): void {
  const geo = new THREE.PlaneGeometry(0.2, 0.12);
  const colors = [LEAF_BROWN, LEAF_ORANGE, LEAF_GREEN];
  const offsets = [
    [1.0, 0.01, 0.5], [-0.8, 0.01, -0.7], [0.6, 0.01, -0.9],
    [-1.1, 0.01, 0.3], [0.3, 0.01, 1.0],
  ];
  for (let i = 0; i < offsets.length; i++) {
    const [x, y, z] = offsets[i];
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide });
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.set(x, y, z);
    leaf.rotation.x = -Math.PI / 2;
    leaf.rotation.z = i * 1.2;
    group.add(leaf);
  }
}
